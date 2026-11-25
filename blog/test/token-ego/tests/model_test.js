#!/usr/bin/env node
/* White-box + black-box tests for the TOKEN/EGO transformer. */
"use strict";

global.THREE = { CanvasTexture: function () {}, SRGBColorSpace: 0, LinearFilter: 0 };
const util = require("../src/util.js");
global.TEGO = { U: util.U };
require("../src/config.js");
const DATA = require("../src/embeddings.js");
global.TEGO.DATA = DATA;
const M = require("../src/model.js");

const U = util.U;
let passed = 0, failed = 0;
function ok(cond, name, detail) {
  if (cond) { passed++; }
  else { failed++; console.error("  FAIL " + name + (detail ? " — " + detail : "")); }
}
function close(a, b, eps, name) {
  ok(Math.abs(a - b) <= (eps === undefined ? 1e-6 : eps), name, a + " vs " + b);
}

const prompt = ["the", "lighthouse", "keeper", "watched", "the", "storm", "swallow", "the", "last", "light", "."];
const model = M.create();
const tr = model.run(prompt, 5);
const D = M.D, H = M.H, T = tr.T, F = M.F;

console.log("== shapes ==");
ok(tr.layers.length === M.L, "layer count");
ok(tr.embed.x0.length === T * D, "embedding shape");
ok(tr.final.logits.length === M.V, "logit shape");
ok(tr.final.probs.length === M.V, "prob shape");
ok(tr.layers[0].scores.length === H * T * T, "score shape");
ok(tr.layers[0].hidden.length === T * F, "hidden shape");
ok(tr.ledger.length === 1 + M.L * (H + 2), "ledger length", String(tr.ledger.length));

console.log("== residual ledger ==");
ok(tr.ledgerError < 1e-4, "ledger sums to final residual", String(tr.ledgerError));
const sum = new Float64Array(D);
for (const item of tr.ledger) for (let d = 0; d < D; d++) sum[d] += item.vector[d];
let maxDiff = 0;
for (let d = 0; d < D; d++) maxDiff = Math.max(maxDiff, Math.abs(sum[d] - tr.playerResidual[d]));
ok(maxDiff < 1e-4, "ledger vector sum", String(maxDiff));

console.log("== softmax / attention ==");
for (let l = 0; l < M.L; l++) {
  for (let h = 0; h < H; h++) {
    for (let i = 0; i < T; i++) {
      const w = M.getAttention(tr, l, h, i);
      let s = 0;
      for (let j = 0; j < T; j++) {
        s += w[j];
        if (j > i) ok(w[j] === 0, "future masked L" + l + " h" + h + " i" + i + " j" + j);
        ok(w[j] >= -1e-9, "nonnegative weight L" + l + " h" + h + " i" + i + " j" + j);
      }
      close(s, 1, 1e-6, "attention row sums L" + l + " h" + h + " i" + i);
      const ent = tr.layers[l].attnEntropy[i * H + h];
      ok(ent >= -1e-6 && ent <= Math.log(i + 1) + 1e-6, "entropy bounds L" + l + " h" + h + " i" + i, String(ent));
    }
  }
}
let prog = 0;
for (const p of tr.final.probs) prog += p;
close(prog, 1, 1e-12, "final softmax sums to 1");
ok(Array.prototype.every.call(tr.final.probs, (p) => p >= 0), "all probabilities nonnegative");
const sp = U.softmax([1, 2, 3], 1);
close(sp[0] + sp[1] + sp[2], 1, 1e-12, "softmax helper");
const cold = U.softmax([0, 1, 2], 0.25);
const hot = U.softmax([0, 1, 2], 4);
ok(cold[2] > hot[2], "temperature sharpens distribution");
close(U.softmax([0, 0, 0], 1)[0], 1 / 3, 1e-12, "uniform softmax");

console.log("== layer norm ==");
for (let l = 0; l < M.L; l++) {
  const st = tr.layers[l].ln1Stats[5];
  ok(st.variance > 0, "pre-LN input variance positive");
  // Recompute the normalised vector from the stored input and check its mean/var.
  const ln = M.getVec(tr, "ln1", 5, l);
  const mean = U.mean(ln);
  const varr = U.variance(ln, mean);
  if (l > 0) {
    ok(Math.abs(mean) < 0.12, "LN output mean near 0 L" + l, String(mean));
    ok(Math.abs(varr - 1) < 0.2, "LN output variance near 1 L" + l, String(varr));
  }
}

console.log("== residual stream ==");
for (let l = 0; l < M.L; l++) {
  const lay = tr.layers[l];
  for (let i = 0; i < T; i++) {
    const xin = l === 0
      ? Array.prototype.slice.call(tr.embed.x0, i * D, i * D + D)
      : M.getVec(tr, "xout", i, l - 1);
    const attn = M.getVec(tr, "attn", i, l);
    const xmid = M.getVec(tr, "xmid", i, l);
    const ffn = M.getVec(tr, "ffn", i, l);
    const xout = M.getVec(tr, "xout", i, l);
    for (let d = 0; d < D; d++) {
      close(xmid[d], xin[d] + attn[d], 1e-4, "xmid = x + attn L" + l);
      close(xout[d], xmid[d] + ffn[d], 1e-4, "xout = xmid + ffn L" + l);
    }
  }
}

console.log("== gelu ==");
close(U.gelu(0), 0, 1e-12, "gelu(0)");
close(U.gelu(5), 5, 0.02, "gelu(large positive)");
close(U.gelu(-5), 0, 0.005, "gelu(large negative)");
close(U.gelu(0.5), 0.3457, 0.002, "gelu(0.5) reference");
ok(Math.abs(U.gelu(0.5) - U.geluExact(0.5)) < 0.001, "tanh and exact GELU agree");

console.log("== determinism ==");
const a = model.run(prompt, 5);
const b = model.run(prompt, 5);
let same = true;
for (let i = 0; i < M.V; i++) if (a.final.logits[i] !== b.final.logits[i]) { same = false; break; }
ok(same, "same seed produces identical logits");
const other = M.create(12345);
const c = other.run(prompt, 5);
let differs = false;
for (let i = 0; i < M.V; i++) if (Math.abs(a.final.logits[i] - c.final.logits[i]) > 1e-6) { differs = true; break; }
ok(differs, "different seed produces different logits");

console.log("== edge cases ==");
const one = model.run(["storm"], 0);
ok(one.T === 1, "single token length");
ok(M.getAttention(one, 0, 0, 0)[0] === 1, "single token attends to itself with weight 1");
const last = model.run(prompt, prompt.length - 1);
ok(last.player === prompt.length - 1, "player clamped to last token");
let threw = false;
try { model.run(["definitely-not-a-token"], 0); } catch (e) { threw = true; }
ok(threw, "unknown token throws");
const noPlayer = model.run(prompt);
ok(noPlayer.player === prompt.length - 1, "default player is last token");

console.log("== no NaN / infinity ==");
let bad = false;
for (const lay of tr.layers) {
  for (const k of ["xIn", "ln1", "q", "k", "v", "z", "attnOut", "xMid", "ln2", "hidden", "gelu", "ffnOut", "xOut"]) {
    for (const v of lay[k]) if (!isFinite(v)) { bad = true; console.error("non-finite in", k); break; }
  }
}
ok(!bad, "all layer values finite");
ok(Array.prototype.every.call(tr.final.probs, isFinite), "all probabilities finite");

console.log("== performance ==");
const t0 = Date.now();
for (let i = 0; i < 10; i++) model.run(prompt, 5);
const ms = (Date.now() - t0) / 10;
console.log("  forward pass: " + ms.toFixed(1) + " ms (warm)");
ok(ms < 500, "forward pass under 500 ms", String(ms));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
