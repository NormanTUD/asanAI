"use strict";

var DATA = {
  xs: [-3, -2, -1, 0, 1, 2, 3],
  ys: [-1.25, -0.72, -0.18, 0.22, 0.58, 1.06, 1.48]
};

function loss(a, b) {
  var s = 0;
  for (var i = 0; i < DATA.xs.length; i++) {
    var d = a * DATA.xs[i] + b - DATA.ys[i];
    s += d * d;
  }
  return s / DATA.xs.length;
}

function grad(a, b) {
  var ga = 0, gb = 0, n = DATA.xs.length;
  for (var i = 0; i < n; i++) {
    var d = a * DATA.xs[i] + b - DATA.ys[i];
    ga += 2 * d * DATA.xs[i] / n;
    gb += 2 * d / n;
  }
  return { a: ga, b: gb };
}

function optimum() {
  var n = DATA.xs.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (var i = 0; i < n; i++) {
    var x = DATA.xs[i], y = DATA.ys[i];
    sx += x; sy += y; sxx += x * x; sxy += x * y;
  }
  var a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { a: a, b: (sy - a * sx) / n };
}

function trajectory(opt, lr, startA, startB, steps) {
  var a = startA, b = startB;
  var va = 0, vb = 0, ma = 0, mb = 0, sa = 0, sb = 0;
  var out = [];
  for (var k = 0; k <= steps; k++) {
    out.push({ a: a, b: b, loss: loss(a, b) });
    var g = grad(a, b);
    if (opt === "sgd") {
      a -= lr * g.a;
      b -= lr * g.b;
    } else if (opt === "momentum") {
      va = 0.9 * va - lr * g.a;
      vb = 0.9 * vb - lr * g.b;
      a += va;
      b += vb;
    } else {
      ma = 0.9 * ma + 0.1 * g.a;
      mb = 0.9 * mb + 0.1 * g.b;
      sa = 0.999 * sa + 0.001 * g.a * g.a;
      sb = 0.999 * sb + 0.001 * g.b * g.b;
      var mha = ma / (1 - Math.pow(0.9, k + 1));
      var mhb = mb / (1 - Math.pow(0.9, k + 1));
      var vha = sa / (1 - Math.pow(0.999, k + 1));
      var vhb = sb / (1 - Math.pow(0.999, k + 1));
      a -= lr * 1.8 * mha / (Math.sqrt(vha) + 1e-8);
      b -= lr * 1.8 * mhb / (Math.sqrt(vhb) + 1e-8);
    }
  }
  return out;
}

function surface(n, a0, a1, b0, b1) {
  var z = [];
  for (var i = 0; i < n; i++) {
    var row = [], b = b0 + (b1 - b0) * i / (n - 1);
    for (var j = 0; j < n; j++) {
      var a = a0 + (a1 - a0) * j / (n - 1);
      row.push(loss(a, b));
    }
    z.push(row);
  }
  return z;
}

self.onmessage = function (e) {
  if (!e.data || e.data.cmd !== "train") return;
  var lr = Math.max(0.01, Math.min(0.3, Number(e.data.lr) || 0.08));
  var startA = -1.55, startB = 1.62, steps = 38;
  var sgd = trajectory("sgd", lr, startA, startB, steps);
  var adam = trajectory("adam", lr, startA, startB, steps);
  var momentum = trajectory("momentum", lr, startA, startB, steps);
  var opt = optimum();
  var range = { a0: -2.2, a1: 2.2, b0: -2.2, b1: 2.2 };
  // keep the optimum and both starts inside the slice
  range.a0 = Math.min(range.a0, opt.a - 0.4);
  range.a1 = Math.max(range.a1, opt.a + 0.4);
  range.b0 = Math.min(range.b0, opt.b - 0.4);
  range.b1 = Math.max(range.b1, opt.b + 0.4);
  var z = surface(25, range.a0, range.a1, range.b0, range.b1);
  self.postMessage({
    lr: lr,
    examples: DATA,
    optimum: opt,
    range: range,
    z: z,
    trajectories: { sgd: sgd, adam: adam, momentum: momentum }
  });
};
