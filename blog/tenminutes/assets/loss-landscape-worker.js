"use strict";

function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function makeData() {
  var xs = [], ys = [];
  for (var i = 0; i < 32; i++) {
    var x = -1 + 2 * i / 31;
    xs.push(x);
    ys.push(0.5 + 0.4 * Math.sin(2 * Math.PI * x));
  }
  return { xs: xs, ys: ys };
}

function pack(o) {
  return o.W1.concat(o.b1, o.W2, [o.b2]);
}
function unpack(f) {
  return {
    W1: f.slice(0, 4),
    b1: f.slice(4, 8),
    W2: f.slice(8, 12),
    b2: f[12]
  };
}
function forward(o, x) {
  var h = [], y = o.b2;
  for (var j = 0; j < 4; j++) {
    h[j] = Math.tanh(o.W1[j] * x + o.b1[j]);
    y += o.W2[j] * h[j];
  }
  return { h: h, y: y };
}
function lossOf(o, data) {
  var s = 0;
  for (var i = 0; i < data.xs.length; i++) {
    var d = forward(o, data.xs[i]).y - data.ys[i];
    s += d * d;
  }
  return s / data.xs.length;
}
function grads(o, data) {
  var g = { W1: [0, 0, 0, 0], b1: [0, 0, 0, 0], W2: [0, 0, 0, 0], b2: 0 };
  var n = data.xs.length;
  for (var i = 0; i < n; i++) {
    var x = data.xs[i], y = data.ys[i];
    var f = forward(o, x);
    var d = f.y - y;
    g.b2 += 2 * d / n;
    for (var j = 0; j < 4; j++) {
      g.W2[j] += 2 * d * f.h[j] / n;
      var dz = 2 * d * o.W2[j] * (1 - f.h[j] * f.h[j]);
      g.W1[j] += dz * x / n;
      g.b1[j] += dz / n;
    }
  }
  return pack(g);
}
function train(data, lr, seed) {
  var rand = rng(seed);
  var f = [];
  for (var k = 0; k < 13; k++) f[k] = (rand() * 2 - 1) * 0.6;
  var vel = f.map(function () { return 0; });
  for (var epoch = 0; epoch < 3200; epoch++) {
    var g = grads(unpack(f), data);
    var step = lr * (1 - 0.55 * epoch / 3200);
    for (var i = 0; i < f.length; i++) {
      vel[i] = 0.9 * vel[i] - step * g[i];
      f[i] += vel[i];
    }
  }
  return f;
}
function normalize(v) {
  var s = 0;
  for (var i = 0; i < v.length; i++) s += v[i] * v[i];
  s = Math.sqrt(s) || 1;
  return v.map(function (x) { return x / s; });
}
function dot(a, b) {
  var s = 0;
  for (var i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function weightsAt(center, d1, d2, a, b) {
  return center.map(function (v, i) { return v + a * d1[i] + b * d2[i]; });
}
function sample(flat, d1, d2, data, n, range) {
  var z = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < n; j++) {
      var a = -range + 2 * range * j / (n - 1);
      var b = -range + 2 * range * i / (n - 1);
      row.push(lossOf(unpack(weightsAt(flat, d1, d2, a, b)), data));
    }
    z.push(row);
  }
  return z;
}
function trajectory(flat, d1, d2, data, lr) {
  var f = weightsAt(flat, d1, d2, 1.8, -1.55);
  var vel = f.map(function () { return 0; });
  var out = [];
  for (var step = 0; step < 28; step++) {
    var p = f.map(function (v, i) { return v - flat[i]; });
    out.push({ a: dot(p, d1), b: dot(p, d2), loss: lossOf(unpack(f), data) });
    var g = grads(unpack(f), data);
    for (var i = 0; i < f.length; i++) {
      vel[i] = 0.85 * vel[i] - lr * 1.6 * g[i];
      f[i] += vel[i];
    }
  }
  var p = f.map(function (v, i) { return v - flat[i]; });
  out.push({ a: dot(p, d1), b: dot(p, d2), loss: lossOf(unpack(f), data) });
  return out;
}

self.onmessage = function (e) {
  if (!e.data || e.data.cmd !== "train") return;
  var data = makeData();
  var lr = Math.max(0.005, Math.min(0.3, Number(e.data.lr) || 0.06));
  var seed = (Number(e.data.seed) || Date.now()) >>> 0;
  var flat = train(data, lr, seed);
  var rand = rng(seed ^ 0x9E3779B9);
  var d1 = normalize(flat.map(function () { return rand() * 2 - 1; }));
  var d2 = normalize(flat.map(function () { return rand() * 2 - 1; }));
  var proj = dot(d2, d1);
  d2 = normalize(d2.map(function (v, i) { return v - proj * d1[i]; }));
  var z = sample(flat, d1, d2, data, 21, 2.4);
  var traj = trajectory(flat, d1, d2, data, lr);
  var best = Infinity, bestRow = 0, bestCol = 0;
  for (var i = 0; i < z.length; i++) for (var j = 0; j < z[i].length; j++) {
    if (z[i][j] < best) { best = z[i][j]; bestRow = i; bestCol = j; }
  }
  var o = unpack(flat);
  self.postMessage({
    lr: lr,
    seed: seed,
    params: flat.length,
    loss: lossOf(o, data),
    z: z,
    range: 2.4,
    best: { i: bestRow, j: bestCol, loss: best },
    trajectory: traj,
    net: o,
    xs: data.xs,
    ys: data.ys
  });
};
