(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function weekdayScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-weekday-scene";
    el.innerHTML = '<div class="ls-weekday-stage" data-tip="' + (DE ? "Die Woche als Linie; Weiter rollt sie in eine zyklische Ordnung." : "The week as a line; Next rolls it into a cyclic order.") + '"><canvas class="ls-canvas" role="img" data-tip="' + (DE ? "Tage auf einer Linie; jeder Schritt zum nächsten Tag ist derselbe Winkel." : "Days on a line; every step to the next day is the same angle.") + '" aria-label="' + api.esc(DE ? "Montag bis Sonntag liegen auf einer Linie; jeder Schritt zum nächsten Tag ist derselbe Winkelschritt. Weiter rollt die Linie zu einem Kreis." : "Monday to Sunday lie on a line; every step to the next day is the same angular step. Next rolls the line into a circle.") + '"></canvas></div><p class="ls-weekday-note" data-tip="' + (DE ? "Die gelernte Ordnung wird sichtbar: derselbe Winkel trägt den nächsten Tag." : "The learned order becomes visible: the same angle carries the next day.") + '">' + (DE ? "Die Ordnung ist gelernt: Montag → Dienstag, Dienstag → Mittwoch, … Derselbe Winkelschritt trägt den nächsten Tag. Weiter rollt die Linie zum Kreis: eine zyklische Ordnung. Nochmal Weiter rollt sie zurück; danach geht es weiter." : "The order is learned: Monday → Tuesday, Tuesday → Wednesday, … The same angular step carries the next day. Next rolls the line into a circle: a cyclic order. Next again rolls it back; after that, next moves on.") + '</p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-weekday-stage");
    var canvas = el.querySelector("canvas");
    var size = null;
    var days = DE ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var morph = 0;
    var raf = 0;
    var transitioning = false;
    var phase = "line";
    var shown = false;
    var targetMorph = 0;
    var fallback = 0;

    function stopRaf() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function clearTimers() {
      if (fallback) { clearTimeout(fallback); fallback = 0; }
    }

    function arcInfo() {
      var w = size.w, h = size.h;
      var pad = Math.max(34, w * 0.08);
      var lineY = h * 0.52;
      var cx = w / 2;
      var cy = h * 0.50;
      var n = days.length;
      var L = w - pad * 2;
      var arc = 2 * Math.PI * (n - 1) / n;
      var rFull = L / arc;
      var R = Math.min(rFull, Math.max(40, (h - 70) / 2));
      var fit = rFull ? R / rFull : 1;
      var t = morph;
      var theta = arc * t;
      var r = t > 0.0001 ? L / theta : 0;
      var scale = 1 + (fit - 1) * t;
      var anchorY = lineY + ((cy - R) - lineY) * t;
      var radius = r * scale;
      var centerY = anchorY + radius;
      return {
        t: t, cx: cx, cy: cy, L: L, lineY: lineY, theta: theta,
        radius: radius, centerY: centerY,
        startPhi: -theta / 2, endPhi: theta / 2
      };
    }

    function place() {
      var g = arcInfo();
      var n = days.length;
      var pts = [];
      for (var i = 0; i < n; i++) {
        var u = (i - (n - 1) / 2) / ((n - 1) / 2);
        var phi = u * g.theta / 2;
        var x, y;
        if (g.t > 0.0001) {
          x = g.cx + g.radius * Math.sin(phi);
          y = g.centerY - g.radius * Math.cos(phi);
        } else {
          x = g.cx + u * g.L / 2;
          y = g.lineY;
        }
        pts.push({ label: days[i], index: i, u: u, x: x, y: y });
      }
      return { pts: pts, info: g, cx: g.cx, cy: g.cy };
    }

    function drawArc(c, info, start, end, steps) {
      c.beginPath();
      for (var i = 0; i <= steps; i++) {
        var phi = start + (end - start) * i / steps;
        var x = info.cx + info.radius * Math.sin(phi);
        var y = info.centerY - info.radius * Math.cos(phi);
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    function draw() {
      if (!size) return;
      var c = size.ctx, w = size.w, h = size.h;
      var C = api.colors();
      c.clearRect(0, 0, w, h);
      c.fillStyle = C.paper; c.fillRect(0, 0, w, h);
      var g = place();
      var m = morph;
      var P = g.pts;
      var n = P.length;
      var info = g.info;

      c.strokeStyle = C.line; c.lineWidth = 1.4; c.lineCap = "round";
      if (m < 0.0005) {
        c.beginPath();
        c.moveTo(P[0].x, P[0].y);
        c.lineTo(P[n - 1].x, P[n - 1].y);
        c.stroke();
      } else {
        var steps = Math.max(80, Math.ceil(info.theta / (2 * Math.PI) * 240));
        drawArc(c, info, info.startPhi, info.endPhi, steps);
        if (m > 0.9) {
          c.globalAlpha = (m - 0.9) / 0.1;
          drawArc(c, info, info.endPhi, info.startPhi + 2 * Math.PI, 80);
          c.globalAlpha = 1;
        }
      }

      if (m < 0.2) {
        c.globalAlpha = 1 - m / 0.2;
        var p1 = P[1], p2 = P[2];
        c.strokeStyle = C.green; c.lineWidth = 2.6;
        c.beginPath(); c.moveTo(p1.x, p1.y - 15); c.lineTo(p2.x, p2.y - 15); c.stroke();
        c.fillStyle = C.green;
        c.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        c.textAlign = "center"; c.textBaseline = "bottom";
        c.fillText(DE ? "immer derselbe Schritt" : "the same step every time", (p1.x + p2.x) / 2, Math.min(p1.y, p2.y) - 22);
        c.globalAlpha = 1;
      }

      if (m > 0.7) {
        c.globalAlpha = (m - 0.7) / 0.3;
        c.fillStyle = C.muted;
        c.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(DE ? "zyklische Ordnung" : "cyclic order", g.cx, g.cy);
        c.globalAlpha = 1;
      }

      P.forEach(function (p) {
        c.beginPath(); c.arc(p.x, p.y, p.index === 1 || p.index === 2 ? 7 : 5, 0, Math.PI * 2);
        c.fillStyle = p.index === 1 || p.index === 2 ? C.gold : C.petrol; c.fill();
        c.strokeStyle = C.paper; c.lineWidth = 2; c.stroke();
        var fa = p.u * Math.PI;
        var cos = Math.sin(fa), sin = -Math.cos(fa);
        var ox = core.lerp(0, cos * 18, m);
        var oy = core.lerp(18, sin * 18, m);
        c.fillStyle = C.ink;
        c.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        c.textBaseline = "middle";
        c.textAlign = m > 0.5 ? (cos > 0.35 ? "left" : cos < -0.35 ? "right" : "center") : "center";
        c.fillText(p.label, p.x + ox, p.y + oy);
      });
    }

    function resize() { size = api.fit(canvas, stage); draw(); }

    function complete() {
      stopRaf();
      fast = false;
      if (fallback) { clearTimeout(fallback); fallback = 0; }
      morph = targetMorph;
      transitioning = false;
      phase = targetMorph === 1 ? "circle" : "line";
      if (targetMorph === 1) shown = true;
      draw();
    }

    var fastFrom = 0, fastT0 = 0, fast = false;
    function startTransition(to) {
      stopRaf();
      if (fallback) { clearTimeout(fallback); fallback = 0; }
      var from = morph;
      targetMorph = to;
      transitioning = true;
      fast = false;
      phase = to === 1 ? "rolling" : "unrolling";
      var t0 = performance.now();
      var duration = (api.motion && api.motion.scale) ? api.motion.scale(1600) : 1600;
      function tick(now) {
        if (!transitioning) return;
        var p;
        if (fast) p = (now - fastT0) / 120;
        else p = (now - t0) / duration;
        if (p < 1) {
          var start = fast ? fastFrom : from;
          morph = start + (to - start) * core.ease(Math.max(0, p));
          draw();
          raf = requestAnimationFrame(tick);
        } else {
          complete();
        }
      }
      fallback = setTimeout(function () { if (transitioning) complete(); }, duration + 80);
      raf = requestAnimationFrame(tick);
    }

    function finish() {
      if (!transitioning) return false;
      complete();
      return true;
    }
    // Rapid Next: keep the rolling/unrolling visible, but finish the rest of
    // the transition in ~120 ms instead of skipping it.
    function speedUp() {
      if (!transitioning) return false;
      if (!fast) {
        fast = true;
        fastFrom = morph;
        fastT0 = performance.now();
      }
      return true;
    }

    function next() {
      if (api.reducedMotion) return false;
      if (transitioning) { speedUp(); return true; }
      if (phase === "line" && !shown) { startTransition(1); return true; }
      if (phase === "circle") { startTransition(0); return true; }
      return false;
    }

    function reset() {
      stopRaf();
      clearTimers();
      transitioning = false;
      phase = "line";
      shown = false;
      targetMorph = 0;
      morph = 0;
      draw();
    }

    function resume() { reset(); }
    function pause() { reset(); }

    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", draw);
    resize();
    return {
      update: function () {},
      resize: resize,
      next: next,
      hasNext: function () {
        if (api.reducedMotion) return false;
        return transitioning || (phase === "line" && !shown) || phase === "circle";
      },
      hasPrev: function () { return false; },
      busy: function () { return transitioning; },
      speedUp: speedUp,
      finish: finish,
      pause: pause,
      resume: resume,
      destroy: function () {
        stopRaf();
        clearTimers();
        window.removeEventListener("resize", resize);
        window.removeEventListener("tm:theme", draw);
        el.remove();
      }
    };
  }
  core.register("weekday", weekdayScene);
})();
