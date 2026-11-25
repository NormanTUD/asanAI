(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function weekdayScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-weekday-scene";
    el.innerHTML = '<div class="ls-weekday-stage"><canvas class="ls-canvas" role="img" aria-label="' + api.esc(DE ? "Montag bis Sonntag liegen auf einer Linie; jeder Schritt zum nächsten Tag ist dieselbe Richtung." : "Monday to Sunday lie on a line; every step to the next day is the same direction.") + '"></canvas></div><p class="ls-weekday-note">' + (DE ? "Die Ordnung ist gelernt: Montag → Dienstag, Dienstag → Mittwoch, … Dieselbe Richtung trägt den nächsten Tag." : "The order is learned: Monday → Tuesday, Tuesday → Wednesday, … The same direction carries the next day.") + '</p>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-weekday-stage");
    var canvas = el.querySelector("canvas");
    var size = null;
    var days = DE ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    function draw() {
      if (!size) return;
      var c = size.ctx, w = size.w, h = size.h;
      var C = api.colors();
      c.clearRect(0, 0, w, h);
      c.fillStyle = C.paper; c.fillRect(0, 0, w, h);
      var pad = Math.max(34, w * 0.08), y = h * 0.52;
      c.strokeStyle = C.line; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(pad, y); c.lineTo(w - pad, y); c.stroke();
      var step = (w - pad * 2) / (days.length - 1);
      days.forEach(function (label, i) {
        var x = pad + i * step;
        c.beginPath(); c.arc(x, y, i === 1 || i === 2 ? 7 : 5, 0, Math.PI * 2);
        c.fillStyle = i === 1 || i === 2 ? C.gold : C.petrol; c.fill();
        c.strokeStyle = C.paper; c.lineWidth = 2; c.stroke();
        c.fillStyle = C.ink; c.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; c.textAlign = "center"; c.textBaseline = "top";
        c.fillText(label, x, y + 14);
      });
      c.strokeStyle = C.green; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(pad + step, y - 15); c.lineTo(pad + step * 2, y - 15); c.stroke();
      c.fillStyle = C.green; c.font = '700 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; c.textAlign = "center"; c.textBaseline = "bottom";
      c.fillText(DE ? "immer derselbe Schritt" : "the same step every time", pad + step * 1.5, y - 22);
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", draw);
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); window.removeEventListener("tm:theme", draw); el.remove(); } };
  }
  core.register("weekday", weekdayScene);
})();
