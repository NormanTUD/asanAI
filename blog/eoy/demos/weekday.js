(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function weekdayScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-weekday-scene";
    el.innerHTML = '<div class="ls-weekday-stage"><canvas class="ls-canvas" role="img" aria-label="' + api.esc(DE ? "Montag bis Sonntag liegen auf einer Linie; jeder Schritt zum nächsten Tag ist dieselbe Richtung. Weiter rollt die Linie zu einem Kreis." : "Monday to Sunday lie on a line; every step to the next day is the same direction. Next rolls the line into a circle.") + '"></canvas></div><p class="ls-weekday-note">' + (DE ? "Die Ordnung ist gelernt: Montag → Dienstag, Dienstag → Mittwoch, … Dieselbe Richtung trägt den nächsten Tag. Weiter rollt die Linie zum Kreis: ein eigener Raum." : "The order is learned: Monday → Tuesday, Tuesday → Wednesday, … The same direction carries the next day. Next rolls the line into a circle: its own space.") + '</p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-weekday-stage");
    var canvas = el.querySelector("canvas");
    var size = null;
    var days = DE ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var morph = 0;
    var raf = 0;
    var transitioning = false;
    var done = false;
    var timers = [];
    var fallback = 0;

    function catmull(p0, p1, p2, p3, t) {
      var t2 = t * t, t3 = t2 * t;
      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      };
    }
    function stopRaf() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function clearTimers() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
      if (fallback) { clearTimeout(fallback); fallback = 0; }
    }

    function place() {
      var w = size.w, h = size.h;
      var pad = Math.max(34, w * 0.08);
      var lineY = h * 0.52;
      var step = (w - pad * 2) / (days.length - 1);
      var cx = w / 2;
      var cy = h * 0.48;
      var R = Math.max(40, Math.min((w - pad * 2) * 0.30, (h - 64) * 0.40));
      var pts = [];
      for (var i = 0; i < days.length; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / days.length;
        pts.push({
          label: days[i],
          index: i,
          angle: a,
          lx: pad + i * step,
          ly: lineY,
          cx: cx + Math.cos(a) * R,
          cy: cy + Math.sin(a) * R
        });
      }
      return { pts: pts, cx: cx, cy: cy, R: R };
    }

    function draw() {
      if (!size) return;
      var c = size.ctx, w = size.w, h = size.h;
      var C = api.colors();
      c.clearRect(0, 0, w, h);
      c.fillStyle = C.paper; c.fillRect(0, 0, w, h);
      var g = place();
      var m = morph;
      var pts = g.pts;
      var n = pts.length;
      var P = pts.map(function (p) {
        return {
          label: p.label,
          index: p.index,
          angle: p.angle,
          x: core.lerp(p.lx, p.cx, m),
          y: core.lerp(p.ly, p.cy, m)
        };
      });

      c.strokeStyle = C.line; c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(P[0].x, P[0].y);
      var steps = 10;
      for (var i = 0; i < n; i++) {
        var c0 = P[(i - 1 + n) % n], c1 = P[i], c2 = P[(i + 1) % n], c3 = P[(i + 2) % n];
        for (var k = 1; k <= steps; k++) {
          var q = catmull(c0, c1, c2, c3, k / steps);
          c.lineTo(q.x, q.y);
        }
      }
      c.closePath();
      c.stroke();

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

      if (m > 0.55) {
        c.globalAlpha = (m - 0.55) / 0.45;
        var a = P[n - 1], b = P[0];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len; dy /= len;
        var s = 6;
        c.fillStyle = C.green;
        c.beginPath();
        c.moveTo(mx + dx * s, my + dy * s);
        c.lineTo(mx - dy * s * 0.8, my + dx * s * 0.8);
        c.lineTo(mx + dy * s * 0.8, my - dx * s * 0.8);
        c.closePath(); c.fill();
        c.globalAlpha = 1;
      }

      if (m > 0.7) {
        c.globalAlpha = (m - 0.7) / 0.3;
        c.fillStyle = C.muted;
        c.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(DE ? "eigener Raum" : "its own space", g.cx, g.cy);
        c.globalAlpha = 1;
      }

      P.forEach(function (p) {
        c.beginPath(); c.arc(p.x, p.y, p.index === 1 || p.index === 2 ? 7 : 5, 0, Math.PI * 2);
        c.fillStyle = p.index === 1 || p.index === 2 ? C.gold : C.petrol; c.fill();
        c.strokeStyle = C.paper; c.lineWidth = 2; c.stroke();
        var cos = Math.cos(p.angle), sin = Math.sin(p.angle);
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

    function startMorph() {
      transitioning = true;
      var t0 = performance.now();
      var roll = 1000;
      var hold = 650;
      var unroll = 1000;
      function tick(now) {
        var t = now - t0;
        if (t < roll) {
          morph = core.ease(t / roll);
          draw();
          raf = requestAnimationFrame(tick);
        } else if (t < roll + hold) {
          morph = 1;
          draw();
          raf = requestAnimationFrame(tick);
        } else if (t < roll + hold + unroll) {
          morph = 1 - core.ease((t - roll - hold) / unroll);
          draw();
          raf = requestAnimationFrame(tick);
        } else {
          if (fallback) { clearTimeout(fallback); fallback = 0; }
          morph = 0;
          draw();
          transitioning = false;
          done = true;
          raf = 0;
        }
      }
      fallback = setTimeout(function () {
        if (!transitioning) return;
        stopRaf();
        morph = 0;
        draw();
        transitioning = false;
        done = true;
        fallback = 0;
      }, roll + hold + unroll + 80);
      raf = requestAnimationFrame(tick);
    }

    function finish() {
      if (!transitioning) return false;
      stopRaf();
      if (fallback) { clearTimeout(fallback); fallback = 0; }
      transitioning = false;
      morph = 0;
      draw();
      done = true;
      return true;
    }

    function next() {
      if (transitioning) { finish(); return true; }
      if (done) return false;
      if (api.reducedMotion) { done = true; return false; }
      startMorph();
      return true;
    }

    function resume() {
      stopRaf();
      clearTimers();
      transitioning = false;
      done = false;
      morph = 0;
      draw();
    }

    function pause() {
      stopRaf();
      clearTimers();
      if (transitioning) {
        transitioning = false;
        morph = 0;
        draw();
      }
      done = false;
    }

    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", draw);
    resize();
    return {
      update: function () {},
      resize: resize,
      next: next,
      hasNext: function () { return true; },
      busy: function () { return transitioning; },
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
