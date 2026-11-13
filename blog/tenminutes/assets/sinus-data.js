(function () {
  "use strict";
  function truth(x) { return 0.5 + 0.42 * Math.sin(2 * Math.PI * x); }
  function build() {
    var points = [];
    var seed = 11;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    for (var i = 0; i < 18; i++) {
      var x = 0.10 + 0.60 * i / 17;
      points.push({ x: x, y: truth(x) + (rnd() - 0.5) * 0.035 });
    }
    return points;
  }
  window.TM_SINUS_DATA = {
    points: build(),
    truth: truth,
    reset: function () { this.points = build(); }
  };
})();
