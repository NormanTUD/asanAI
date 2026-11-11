#!/usr/bin/env node
"use strict";

const path = require("path");
const assert = require("assert");
const LS = require(path.join(__dirname, "..", "tenminutes", "learnsys.js"));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("ok   " + name);
  } catch (err) {
    failed++;
    console.error("FAIL " + name);
    console.error("     " + (err && err.message ? err.message : err));
  }
}

function near(a, b, eps) {
  assert.ok(Math.abs(a - b) <= (eps || 1e-9), a + " ~= " + b);
}

function fakeCtx() {
  const calls = [];
  const add = (name) => function () { calls.push([name].concat(Array.from(arguments))); };
  return {
    calls,
    save: add("save"), restore: add("restore"),
    fillRect: add("fillRect"), strokeRect: add("strokeRect"),
    beginPath: add("beginPath"), closePath: add("closePath"),
    arc: add("arc"), fill: add("fill"), stroke: add("stroke"),
    moveTo: add("moveTo"), lineTo: add("lineTo"),
    quadraticCurveTo: add("quadraticCurveTo"), fillText: add("fillText"),
    drawImage: add("drawImage"),
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "",
    textAlign: "", textBaseline: "", globalAlpha: 1
  };
}

test("version is exposed", function () {
  assert.strictEqual(LS.version, "2.0");
});

test("util.clamp / lerp / ease", function () {
  assert.strictEqual(LS.util.clamp(5, 0, 3), 3);
  assert.strictEqual(LS.util.clamp(-1, 0, 3), 0);
  assert.strictEqual(LS.util.lerp(10, 20, 0.25), 12.5);
  near(LS.util.ease(0), 0);
  near(LS.util.ease(1), 1);
  near(LS.util.ease(0.5), 0.5);
});

test("font levels are ordered and bounded", function () {
  const f = LS.util.fontLevels;
  assert.strictEqual(f.length, 5);
  for (let i = 1; i < f.length; i++) {
    assert.ok(f[i].body > f[i - 1].body);
    assert.ok(f[i].title > f[i - 1].title);
  }
  assert.strictEqual(LS.util.fontMin, 0);
  assert.strictEqual(LS.util.fontMax, 4);
});

test("normalizeFont clamps and falls back", function () {
  assert.strictEqual(LS.util.normalizeFont(-5), 0);
  assert.strictEqual(LS.util.normalizeFont(0), 0);
  assert.strictEqual(LS.util.normalizeFont(2), 2);
  assert.strictEqual(LS.util.normalizeFont(99), 4);
  assert.strictEqual(LS.util.normalizeFont("3"), 3);
  assert.strictEqual(LS.util.normalizeFont("nope"), 1);
  assert.strictEqual(LS.util.normalizeFont(undefined), 1);
});

test("filterDays respects tracks", function () {
  const days = [
    { id: "a", track: "idea" },
    { id: "b", track: "transformer" },
    { id: "c", track: "idea" }
  ];
  assert.strictEqual(LS.util.filterDays(days, "all").length, 3);
  assert.strictEqual(LS.util.filterDays(days, "idea").length, 2);
  assert.strictEqual(LS.util.filterDays(days, "missing").length, 0);
  assert.strictEqual(LS.util.filterDays(null, "idea").length, 0);
});

test("normalizePrefs clamps fonts and rejects bad values", function () {
  const p = LS.util.normalizePrefs({
    track: "transformer", depth: "deep", font: 99, day: -4, step: "2"
  });
  assert.strictEqual(p.track, "transformer");
  assert.strictEqual(p.depth, "deep");
  assert.strictEqual(p.font, 4);
  assert.strictEqual(p.day, 0);
  assert.strictEqual(p.step, 2);
  const d = LS.util.normalizePrefs({ depth: "nonsense", font: "x" });
  assert.strictEqual(d.depth, "standard");
  assert.strictEqual(d.font, 1);
  assert.strictEqual(d.track, "all");
});

test("scene.validate accepts a valid scene", function () {
  const scene = {
    camera: { yaw: 0.2 },
    primitives: [
      { id: "a", type: "rect", x: 0, y: 0, w: 10, h: 10 },
      { id: "b", type: "label", x: 1, y: 2, text: "hi" },
      { id: "c", type: "mesh", vertices: [[0, 0], [1, 0], [0, 1]] }
    ]
  };
  assert.strictEqual(LS.scene.validate(scene), true);
});

test("scene.validate rejects malformed scenes", function () {
  assert.throws(function () { LS.scene.validate(null); }, /primitives/);
  assert.throws(function () { LS.scene.validate({ primitives: {} }); }, /primitives/);
  assert.throws(function () {
    LS.scene.validate({ primitives: [{ type: "rect" }] });
  }, /id required/);
  assert.throws(function () {
    LS.scene.validate({ primitives: [{ id: "x", type: "nope" }] });
  }, /unknown primitive/);
  assert.throws(function () {
    LS.scene.validate({ primitives: [{ id: "x", type: "rect" }, { id: "x", type: "rect" }] });
  }, /duplicate/);
});

test("scene.diff finds persistent, exit, enter, camera", function () {
  const prev = {
    camera: { yaw: 0 },
    primitives: [
      { id: "keep", type: "rect", x: 0 },
      { id: "gone", type: "circle", x: 1 }
    ]
  };
  const next = {
    camera: { yaw: 1 },
    primitives: [
      { id: "keep", type: "rect", x: 10 },
      { id: "new", type: "bar", x: 2 }
    ]
  };
  const d = LS.scene.diff(prev, next);
  assert.strictEqual(d.persistent.length, 1);
  assert.strictEqual(d.persistent[0].id, "keep");
  assert.strictEqual(d.exit.length, 1);
  assert.strictEqual(d.exit[0].id, "gone");
  assert.strictEqual(d.enter.length, 1);
  assert.strictEqual(d.enter[0].id, "new");
  assert.strictEqual(d.camera.prev.yaw, 0);
  assert.strictEqual(d.camera.next.yaw, 1);
});

test("scene.interpolate moves persistent primitives and camera", function () {
  const prev = {
    camera: { yaw: 0 },
    primitives: [{ id: "a", type: "rect", x: 0, y: 0, w: 10, h: 10, opacity: 1 }]
  };
  const next = {
    camera: { yaw: 2 },
    primitives: [{ id: "a", type: "rect", x: 20, y: 10, w: 30, h: 10, opacity: 0.5 }]
  };
  const s0 = LS.scene.interpolate(prev, next, 0);
  const s1 = LS.scene.interpolate(prev, next, 1);
  const sm = LS.scene.interpolate(prev, next, 0.5);
  near(s0.primitives[0].x, 0);
  near(s1.primitives[0].x, 20);
  near(sm.primitives[0].x, 10);
  near(sm.primitives[0].opacity, 0.75);
  near(s0.camera.yaw, 0);
  near(s1.camera.yaw, 2);
});

test("scene.interpolate fades exit and enter primitives", function () {
  const prev = { primitives: [{ id: "gone", type: "rect", x: 0, opacity: 1 }] };
  const next = { primitives: [{ id: "new", type: "rect", x: 5, opacity: 1 }] };
  const early = LS.scene.interpolate(prev, next, 0.25);
  const gone = early.primitives.filter(function (p) { return p.id === "gone"; })[0];
  assert.ok(gone && gone.opacity < 1);
  const late = LS.scene.interpolate(prev, next, 0.75);
  const added = late.primitives.filter(function (p) { return p.id === "new"; })[0];
  assert.ok(added && added.opacity > 0);
});

test("scene.render draws every supported primitive", function () {
  const scene = {
    primitives: [
      { id: "r", type: "rect", x: 0, y: 0, w: 5, h: 5, fill: "#000" },
      { id: "c", type: "circle", x: 1, y: 1, r: 3, fill: "#000" },
      { id: "l", type: "line", x1: 0, y1: 0, x2: 1, y2: 1, stroke: "#000" },
      { id: "a", type: "arc", x1: 0, y1: 0, cx: 1, cy: 1, x2: 2, y2: 0, stroke: "#000" },
      { id: "t", type: "label", x: 0, y: 0, text: "x" },
      { id: "b", type: "bar", x: 0, y: 0, w: 10, h: 2, value: 0.5, fill: "#000" },
      { id: "m", type: "mesh", vertices: [[0, 0], [1, 0], [0, 1]], fill: "#000" }
    ]
  };
  const ctx = fakeCtx();
  LS.scene.render(ctx, scene);
  const names = ctx.calls.map(function (c) { return c[0]; });
  ["fillRect", "arc", "lineTo", "quadraticCurveTo", "fillText", "closePath"].forEach(function (n) {
    assert.ok(names.indexOf(n) >= 0, "missing " + n);
  });
});

test("scene.fromCanvas wraps a canvas as one image primitive", function () {
  const fake = { width: 320, height: 180 };
  const s = LS.scene.fromCanvas(fake);
  assert.strictEqual(s.primitives.length, 1);
  assert.strictEqual(s.primitives[0].type, "image");
  assert.strictEqual(s.primitives[0].image, fake);
  assert.strictEqual(s.primitives[0].w, 320);
});

test("motion durations are positive and ordered", function () {
  const m = LS.motion;
  ["step", "day", "camera", "text", "enter", "exit", "stagger"].forEach(function (k) {
    assert.ok(m[k] > 0, k);
  });
  assert.ok(m.camera >= m.step);
});

test("defineDemo registers and exposes metadata", function () {
  function factory() { return { update: function () {} }; }
  LS.defineDemo("__test_demo", factory, { tier: 3, label: "Test" });
  assert.strictEqual(LS.getDemoMeta("__test_demo").tier, 3);
  assert.strictEqual(LS.getDemoMeta("__test_demo").label, "Test");
});

test("prefs.normalize is the same normalizer", function () {
  const p = LS.prefs.normalize({ font: 99 });
  assert.strictEqual(p.font, LS.util.fontMax);
  assert.strictEqual(LS.prefs.key, "tm_learnsys_pref_v1");
});

console.log("");
console.log(passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
