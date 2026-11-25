/* TOKEN / EGO — a real, small, decoder-only transformer forward pass.
 *
 * Architecture (selected for interpretability, not for a leaderboard):
 *   token embedding + fixed sinusoidal position
 *   6 × [ pre-LN → 4-head causal self-attention → residual add
 *         pre-LN → GELU feed-forward (d_ff = 4·d_model) → residual add ]
 *   final LN → tied unembedding → softmax
 *
 * The arithmetic is exact. The attention and MLP weights are constructed from
 * seeded, structured random matrices: each head owns a 32-dimensional slice of
 * the 128-dimensional residual stream, and the Q/K/V/O maps are orthogonal
 * rotations of that slice. The token directions are a PCA projection of real
 * model2vec (potion-base-8M) static embeddings. The unembedding is tied to the
 * token embedding, as in GPT-2. No pretrained transformer checkpoint is used;
 * the game says so, and the "weights" panel shows the actual numbers.
 *
 * Everything is Float32Array / double arithmetic and runs synchronously. A
 * 12-token forward pass is ~15M multiply-adds and takes a few milliseconds.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) { root.TEGO = root.TEGO || {}; root.TEGO.Model = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var U = (root.TEGO && root.TEGO.U) || (typeof require === "function" ? require("./util.js").U : null);
  var DATA = (root.TEGO && root.TEGO.DATA) || (typeof require === "function" ? require("./embeddings.js") : null);
  var CFG = (root.TEGO && root.TEGO.CFG) || {
    dModel: 128, nHeads: 4, dHead: 32, dFf: 512, nLayers: 6, maxSeq: 32,
    lnEps: 1e-5, seed: 0x5eed5eed,
  };

  if (!U) throw new Error("TOKEN/EGO: util.js must load before model.js");
  if (!DATA) throw new Error("TOKEN/EGO: embeddings.js must load before model.js");

  var D = CFG.dModel;
  var H = CFG.nHeads;
  var DH = CFG.dHead;
  var F = CFG.dFf;
  var L = CFG.nLayers;
  var V = DATA.vocab.length;
  var POS_SCALE = 0.18;
  var LOGIT_SCALE = 0.9;

  var VOCAB = DATA.vocab.slice();
  var VOCAB_MAP = {};
  for (var vi = 0; vi < VOCAB.length; vi++) VOCAB_MAP[VOCAB[vi]] = vi;

  function makeEmbedding() {
    var e = new Float32Array(V * D);
    for (var i = 0; i < V; i++) {
      for (var d = 0; d < D; d++) e[i * D + d] = DATA.emb[i][d];
    }
    return e;
  }

  function makePositions() {
    var p = new Float32Array(CFG.maxSeq * D);
    for (var pos = 0; pos < CFG.maxSeq; pos++) {
      for (var i = 0; i < D; i += 2) {
        var freq = Math.pow(10000, -i / D);
        p[pos * D + i] = Math.sin(pos * freq) * POS_SCALE;
        if (i + 1 < D) p[pos * D + i + 1] = Math.cos(pos * freq) * POS_SCALE;
      }
    }
    return p;
  }

  function buildWeights(seed) {
    var rng = U.mulberry32(seed);
    var W = {
      E: makeEmbedding(),
      P: makePositions(),
      layers: [],
      lnfGamma: new Float32Array(D),
      lnfBeta: new Float32Array(D),
    };
    for (var d = 0; d < D; d++) {
      W.lnfGamma[d] = 1 + U.gauss(rng) * 0.012;
      W.lnfBeta[d] = U.gauss(rng) * 0.008;
    }

    for (var l = 0; l < L; l++) {
      var layer = {
        ln1Gamma: new Float32Array(D), ln1Beta: new Float32Array(D),
        ln2Gamma: new Float32Array(D), ln2Beta: new Float32Array(D),
        wq: new Float32Array(D * D), wk: new Float32Array(D * D),
        wv: new Float32Array(D * D), wo: new Float32Array(D * D),
        bq: new Float32Array(D), bk: new Float32Array(D),
        bv: new Float32Array(D), bo: new Float32Array(D),
        w1: new Float32Array(F * D), b1: new Float32Array(F),
        w2: new Float32Array(D * F), b2: new Float32Array(D),
        headRot: [],
      };
      for (var d2 = 0; d2 < D; d2++) {
        layer.ln1Gamma[d2] = 1 + U.gauss(rng) * 0.018;
        layer.ln1Beta[d2] = U.gauss(rng) * 0.012;
        layer.ln2Gamma[d2] = 1 + U.gauss(rng) * 0.018;
        layer.ln2Beta[d2] = U.gauss(rng) * 0.012;
        layer.bq[d2] = U.gauss(rng) * 0.025;
        layer.bk[d2] = U.gauss(rng) * 0.025;
        layer.bv[d2] = U.gauss(rng) * 0.025;
        layer.bo[d2] = U.gauss(rng) * 0.015;
      }

      // One orthogonal rotation per head per projection. The head subspaces
      // are fixed 32-dim slices; the rotations make each layer look at the
      // slice through a different lens.
      var qRot = [], kRot = [], vRot = [], oRot = [];
      for (var h = 0; h < H; h++) {
        qRot.push(U.orthogonal(rng, DH));
        kRot.push(U.orthogonal(rng, DH));
        vRot.push(U.orthogonal(rng, DH));
        oRot.push(U.orthogonal(rng, DH));
      }
      layer.headRot = { q: qRot, k: kRot, v: vRot, o: oRot };

      var qScale = 1.55, kScale = 1.55, vScale = 0.52, oScale = 0.52, cross = 0.012;
      for (var h2 = 0; h2 < H; h2++) {
        var base = h2 * DH;
        for (var r = 0; r < DH; r++) {
          var i = base + r;
          for (var c = 0; c < DH; c++) {
            var j = base + c;
            layer.wq[i * D + j] = qRot[h2][r][c] * qScale + U.gauss(rng) * cross;
            layer.wk[i * D + j] = kRot[h2][r][c] * kScale + U.gauss(rng) * cross;
            layer.wv[i * D + j] = vRot[h2][r][c] * vScale + U.gauss(rng) * cross;
            layer.wo[i * D + j] = oRot[h2][r][c] * oScale + U.gauss(rng) * cross;
          }
          // A little leakage between head subspaces keeps the matrices from
          // being perfectly block-diagonal, like a real trained model.
          for (var j2 = 0; j2 < D; j2++) {
            if (j2 >= base && j2 < base + DH) continue;
            layer.wq[i * D + j2] += U.gauss(rng) * cross;
            layer.wk[i * D + j2] += U.gauss(rng) * cross;
            layer.wv[i * D + j2] += U.gauss(rng) * cross;
            layer.wo[i * D + j2] += U.gauss(rng) * cross;
          }
        }
      }

      // W1: half dimension-detectors (near the coordinate axes), half random
      // feature directions. W2 mixes the 512 neuron outputs back to 128 dims.
      for (var n = 0; n < F; n++) {
        var row = new Float64Array(D);
        if (n < D) {
          row[n] = 0.82;
          for (var d3 = 0; d3 < D; d3++) row[d3] += U.gauss(rng) * 0.18;
        } else {
          for (var d4 = 0; d4 < D; d4++) row[d4] = U.gauss(rng);
        }
        var rn = U.norm(row) || 1;
        var scale1 = n < D ? 0.9 : 1.0;
        for (var d5 = 0; d5 < D; d5++) layer.w1[n * D + d5] = (row[d5] / rn) * scale1;
        layer.b1[n] = U.gauss(rng) * 0.10;
      }
      var w2Scale = 0.088;
      for (var d6 = 0; d6 < D; d6++) {
        for (var n2 = 0; n2 < F; n2++) {
          layer.w2[d6 * F + n2] = U.gauss(rng) * w2Scale;
        }
        layer.b2[d6] = U.gauss(rng) * 0.02;
      }
      W.layers.push(layer);
    }
    return W;
  }

  function layerNorm(x, gamma, beta, eps, stats) {
    var n = x.length, mean = 0, i;
    for (i = 0; i < n; i++) mean += x[i];
    mean /= n;
    var v = 0;
    for (i = 0; i < n; i++) { var d = x[i] - mean; v += d * d; }
    v /= n;
    var inv = 1 / Math.sqrt(v + eps);
    var out = new Float64Array(n);
    for (i = 0; i < n; i++) out[i] = ((x[i] - mean) * inv) * gamma[i] + beta[i];
    if (stats) { stats.mean = mean; stats.variance = v; stats.invStd = inv; }
    return out;
  }

  function matVec(W, x, rows, cols) {
    var out = new Float64Array(rows);
    for (var r = 0; r < rows; r++) {
      var s = 0, off = r * cols;
      for (var c = 0; c < cols; c++) s += W[off + c] * x[c];
      out[r] = s;
    }
    return out;
  }

  function add(a, b) {
    var out = new Float64Array(a.length);
    for (var i = 0; i < a.length; i++) out[i] = a[i] + b[i];
    return out;
  }

  function addBias(a, b) {
    var out = new Float64Array(a.length);
    for (var i = 0; i < a.length; i++) out[i] = a[i] + b[i];
    return out;
  }

  function dotRange(a, b, start, len) {
    var s = 0;
    for (var i = 0; i < len; i++) s += a[start + i] * b[start + i];
    return s;
  }

  function copyF32(dst, src, offset) {
    for (var i = 0; i < src.length; i++) dst[offset + i] = src[i];
  }

  function Transformer(seed) {
    this.seed = seed === undefined ? CFG.seed : seed;
    this.W = buildWeights(this.seed);
    this.vocab = VOCAB;
    this.vocabMap = VOCAB_MAP;
    this.dModel = D;
    this.nHeads = H;
    this.dHead = DH;
    this.dFf = F;
    this.nLayers = L;
    this.temperature = 1;
    this.logitScale = LOGIT_SCALE;
  }

  Transformer.prototype.parameterCount = function () {
    var n = 0, W = this.W;
    n += W.E.length + W.P.length + W.lnfGamma.length + W.lnfBeta.length;
    for (var l = 0; l < W.layers.length; l++) {
      var Lw = W.layers[l];
      n += Lw.ln1Gamma.length + Lw.ln1Beta.length + Lw.ln2Gamma.length + Lw.ln2Beta.length;
      n += Lw.wq.length + Lw.wk.length + Lw.wv.length + Lw.wo.length;
      n += Lw.bq.length + Lw.bk.length + Lw.bv.length + Lw.bo.length;
      n += Lw.w1.length + Lw.b1.length + Lw.w2.length + Lw.b2.length;
    }
    return n;
  };

  Transformer.prototype.tokenId = function (token) {
    var id = this.vocabMap[token];
    if (id === undefined) return -1;
    return id;
  };

  Transformer.prototype.encode = function (tokens) {
    var ids = new Int32Array(tokens.length);
    for (var i = 0; i < tokens.length; i++) {
      var id = this.tokenId(tokens[i]);
      if (id < 0) throw new Error("token not in vocabulary: " + tokens[i]);
      ids[i] = id;
    }
    return ids;
  };

  Transformer.prototype.embed = function (ids) {
    var T = ids.length, W = this.W;
    var tok = new Float32Array(T * D), pos = new Float32Array(T * D), x = new Float32Array(T * D);
    for (var i = 0; i < T; i++) {
      var id = ids[i];
      for (var d = 0; d < D; d++) {
        var te = W.E[id * D + d];
        var pe = W.P[i * D + d];
        tok[i * D + d] = te;
        pos[i * D + d] = pe;
        x[i * D + d] = te + pe;
      }
    }
    return { tok: tok, pos: pos, x: x };
  };

  Transformer.prototype.run = function (tokens, playerIndex, options) {
    options = options || {};
    var T = tokens.length;
    if (T < 1 || T > CFG.maxSeq) throw new Error("sequence length out of range: " + T);
    var player = playerIndex === undefined ? T - 1 : Math.max(0, Math.min(T - 1, playerIndex | 0));
    var ids = this.encode(tokens);
    var W = this.W;
    var emb = this.embed(ids);
    var x = new Float64Array(emb.x); // full-precision working copy
    var trace = {
      tokens: tokens.slice(),
      ids: Array.from(ids),
      T: T,
      player: player,
      playerToken: tokens[player],
      playerId: ids[player],
      embed: {
        tok: emb.tok,
        pos: emb.pos,
        x0: new Float32Array(emb.x),
      },
      layers: [],
      cfg: { dModel: D, nHeads: H, dHead: DH, dFf: F, nLayers: L, maxSeq: CFG.maxSeq, lnEps: CFG.lnEps },
      vocab: VOCAB,
      ledger: [],
      notes: {
        positional: "fixed sinusoidal, scaled by " + POS_SCALE,
        unembedding: "tied to the token embedding, logit scale " + this.logitScale,
        weights: "seeded structured synthetic weights; arithmetic is exact",
      },
    };

    // The ledger decomposes the player's residual stream into additive writes.
    // x = embedding + Σ head writes + Σ attention biases + Σ FFN writes.
    trace.ledger.push({
      kind: "embed", layer: -1, head: -1,
      label: "token + position",
      vector: new Float32Array(emb.x.slice(player * D, player * D + D)),
    });

    for (var l = 0; l < L; l++) {
      var Lw = W.layers[l];
      var layer = {
        l: l,
        xIn: new Float32Array(T * D),
        ln1: new Float32Array(T * D),
        ln1Stats: [],
        q: new Float32Array(T * D),
        k: new Float32Array(T * D),
        v: new Float32Array(T * D),
        scores: new Float32Array(H * T * T),
        weights: new Float32Array(H * T * T),
        z: new Float32Array(T * D),
        headOut: new Float32Array(H * T * D),
        attnBias: new Float32Array(Lw.bo),
        attnOut: new Float32Array(T * D),
        xMid: new Float32Array(T * D),
        ln2: new Float32Array(T * D),
        ln2Stats: [],
        hidden: new Float32Array(T * F),
        gelu: new Float32Array(T * F),
        ffnOut: new Float32Array(T * D),
        xOut: new Float32Array(T * D),
        attnEntropy: new Float32Array(T * H),
        headNorm: new Float32Array(H * T),
      };
      copyF32(layer.xIn, x, 0);

      // Pre-LN, Q/K/V.
      var qs = [], ks = [], vs = [];
      for (var i = 0; i < T; i++) {
        var xi = x.slice(i * D, i * D + D);
        var st1 = {};
        var ln = layerNorm(xi, Lw.ln1Gamma, Lw.ln1Beta, CFG.lnEps, st1);
        layer.ln1Stats.push(st1);
        copyF32(layer.ln1, ln, i * D);
        var q = addBias(matVec(Lw.wq, ln, D, D), Lw.bq);
        var k = addBias(matVec(Lw.wk, ln, D, D), Lw.bk);
        var v = addBias(matVec(Lw.wv, ln, D, D), Lw.bv);
        copyF32(layer.q, q, i * D);
        copyF32(layer.k, k, i * D);
        copyF32(layer.v, v, i * D);
        qs.push(q); ks.push(k); vs.push(v);
      }

      // Per-head causal attention. Scores are scaled by 1/sqrt(d_head).
      var scale = 1 / Math.sqrt(DH);
      var z = new Float64Array(T * D);
      for (var h = 0; h < H; h++) {
        var hbase = h * DH;
        for (var ii = 0; ii < T; ii++) {
          var rowOff = (h * T + ii) * T;
          var maxScore = -Infinity;
          for (var jj = 0; jj <= ii; jj++) {
            var sc = dotRange(qs[ii], ks[jj], hbase, DH) * scale;
            layer.scores[rowOff + jj] = sc;
            if (sc > maxScore) maxScore = sc;
          }
          for (var jj2 = ii + 1; jj2 < T; jj2++) layer.scores[rowOff + jj2] = -Infinity;
          var sum = 0;
          for (var jj3 = 0; jj3 <= ii; jj3++) {
            var e = Math.exp(layer.scores[rowOff + jj3] - maxScore);
            layer.weights[rowOff + jj3] = e;
            sum += e;
          }
          var invSum = 1 / sum;
          var entropy = 0;
          for (var jj4 = 0; jj4 <= ii; jj4++) {
            var a = layer.weights[rowOff + jj4] * invSum;
            layer.weights[rowOff + jj4] = a;
            if (a > 0) entropy -= a * Math.log(a);
            for (var c = 0; c < DH; c++) z[ii * D + hbase + c] += a * vs[jj4][hbase + c];
          }
          for (var jj5 = ii + 1; jj5 < T; jj5++) layer.weights[rowOff + jj5] = 0;
          layer.attnEntropy[ii * H + h] = entropy;
        }
      }
      copyF32(layer.z, z, 0);

      // Output projection and per-head write vectors.
      for (var i3 = 0; i3 < T; i3++) {
        var zi = z.slice(i3 * D, i3 * D + D);
        var out = new Float64Array(D);
        var perHead = [];
        for (var h3 = 0; h3 < H; h3++) {
          var hOut = new Float64Array(D);
          for (var r3 = 0; r3 < D; r3++) {
            var s3 = 0, off3 = r3 * D + h3 * DH;
            for (var c3 = 0; c3 < DH; c3++) s3 += Lw.wo[off3 + c3] * zi[h3 * DH + c3];
            hOut[r3] = s3;
            out[r3] += s3;
          }
          perHead.push(hOut);
          copyF32(layer.headOut, hOut, (h3 * T + i3) * D);
          var hn = U.norm(hOut);
          layer.headNorm[h3 * T + i3] = hn;
        }
        for (var d7 = 0; d7 < D; d7++) out[d7] += Lw.bo[d7];
        copyF32(layer.attnOut, out, i3 * D);
        var xmid = new Float64Array(D);
        for (var d8 = 0; d8 < D; d8++) xmid[d8] = x[i3 * D + d8] + out[d8];
        copyF32(layer.xMid, xmid, i3 * D);

        // Pre-FFN LayerNorm.
        var st2 = {};
        var ln2 = layerNorm(xmid, Lw.ln2Gamma, Lw.ln2Beta, CFG.lnEps, st2);
        layer.ln2Stats.push(st2);
        copyF32(layer.ln2, ln2, i3 * D);

        // GELU feed-forward.
        var pre = matVec(Lw.w1, ln2, F, D);
        var act = new Float64Array(F);
        for (var n = 0; n < F; n++) {
          var val = pre[n] + Lw.b1[n];
          layer.hidden[i3 * F + n] = val;
          act[n] = U.gelu(val);
          layer.gelu[i3 * F + n] = act[n];
        }
        var ff = matVec(Lw.w2, act, D, F);
        for (var d9 = 0; d9 < D; d9++) ff[d9] += Lw.b2[d9];
        copyF32(layer.ffnOut, ff, i3 * D);
        var xout = new Float64Array(D);
        for (var d10 = 0; d10 < D; d10++) xout[d10] = xmid[d10] + ff[d10];
        copyF32(layer.xOut, xout, i3 * D);
        for (var d11 = 0; d11 < D; d11++) x[i3 * D + d11] = xout[d11];
      }

      // Ledger writes for the player, in order.
      for (var h4 = 0; h4 < H; h4++) {
        trace.ledger.push({
          kind: "attn", layer: l, head: h4,
          label: "L" + (l + 1) + " head " + (h4 + 1),
          vector: new Float32Array(layer.headOut.slice((h4 * T + player) * D, (h4 * T + player) * D + D)),
        });
      }
      trace.ledger.push({
        kind: "bias", layer: l, head: -1,
        label: "L" + (l + 1) + " attention bias",
        vector: new Float32Array(Lw.bo),
      });
      trace.ledger.push({
        kind: "ffn", layer: l, head: -1,
        label: "L" + (l + 1) + " FFN",
        vector: new Float32Array(layer.ffnOut.slice(player * D, player * D + D)),
      });

      trace.layers.push(layer);
    }

    // Final LN and tied unembedding.
    var xFinal = x.slice(player * D, player * D + D);
    var finalStats = {};
    var lnf = layerNorm(xFinal, W.lnfGamma, W.lnfBeta, CFG.lnEps, finalStats);
    var logits = new Float64Array(V);
    var bias = options.logitBias;
    for (var v = 0; v < V; v++) {
      var s = 0;
      for (var d12 = 0; d12 < D; d12++) s += W.E[v * D + d12] * lnf[d12];
      logits[v] = s * this.logitScale + (bias ? bias[v] : 0);
    }
    var probs = U.softmax(logits, 1);
    trace.final = {
      x: new Float32Array(xFinal),
      ln: new Float32Array(lnf),
      stats: finalStats,
      logits: logits,
      probs: probs,
      logitScale: this.logitScale,
    };
    trace.xFinalAll = new Float32Array(x);
    trace.playerResidual = new Float32Array(xFinal);
    trace.playerLayerNorm = new Float32Array(lnf);

    // Sanity: the ledger must sum to the player's final residual.
    var check = new Float64Array(D);
    for (var li = 0; li < trace.ledger.length; li++) {
      var lv = trace.ledger[li].vector;
      for (var d13 = 0; d13 < D; d13++) check[d13] += lv[d13];
    }
    var err = 0;
    for (var d14 = 0; d14 < D; d14++) err = Math.max(err, Math.abs(check[d14] - xFinal[d14]));
    trace.ledgerError = err;

    return trace;
  };

  Transformer.prototype.predict = function (tokens, playerIndex, temperature, topK) {
    var tr = this.run(tokens, playerIndex);
    var t = temperature === undefined ? 1 : temperature;
    var p = U.softmax(tr.final.logits, t);
    var top = U.topK(p, topK || 10);
    return { trace: tr, probs: p, top: top };
  };

  Transformer.prototype.sample = function (tokens, playerIndex, temperature, rng) {
    var tr = this.run(tokens, playerIndex);
    var p = U.softmax(tr.final.logits, temperature === undefined ? 1 : temperature);
    var r = (rng || Math.random)();
    var acc = 0, chosen = p.length - 1;
    for (var i = 0; i < p.length; i++) {
      acc += p[i];
      if (r <= acc) { chosen = i; break; }
    }
    return { id: chosen, token: VOCAB[chosen], p: p, trace: tr };
  };

  function getVec(trace, where, index, layer, head) {
    if (where === "x0") return Array.prototype.slice.call(trace.embed.x0, index * D, index * D + D);
    if (where === "ln1") return Array.prototype.slice.call(trace.layers[layer].ln1, index * D, index * D + D);
    if (where === "q") return Array.prototype.slice.call(trace.layers[layer].q, index * D, index * D + D);
    if (where === "k") return Array.prototype.slice.call(trace.layers[layer].k, index * D, index * D + D);
    if (where === "v") return Array.prototype.slice.call(trace.layers[layer].v, index * D, index * D + D);
    if (where === "z") return Array.prototype.slice.call(trace.layers[layer].z, index * D, index * D + D);
    if (where === "attn") return Array.prototype.slice.call(trace.layers[layer].attnOut, index * D, index * D + D);
    if (where === "xmid") return Array.prototype.slice.call(trace.layers[layer].xMid, index * D, index * D + D);
    if (where === "ln2") return Array.prototype.slice.call(trace.layers[layer].ln2, index * D, index * D + D);
    if (where === "ffn") return Array.prototype.slice.call(trace.layers[layer].ffnOut, index * D, index * D + D);
    if (where === "xout") return Array.prototype.slice.call(trace.layers[layer].xOut, index * D, index * D + D);
    if (where === "hidden") return Array.prototype.slice.call(trace.layers[layer].hidden, index * F, index * F + F);
    if (where === "gelu") return Array.prototype.slice.call(trace.layers[layer].gelu, index * F, index * F + F);
    if (where === "head") return Array.prototype.slice.call(trace.layers[layer].headOut, (head * trace.T + index) * D, (head * trace.T + index) * D + D);
    if (where === "final") return Array.prototype.slice.call(trace.final.x, 0, D);
    if (where === "finalLn") return Array.prototype.slice.call(trace.final.ln, 0, D);
    throw new Error("unknown vector: " + where);
  }

  function getAttention(trace, layer, head, row) {
    var T = trace.T, off = (head * T + row) * T;
    return Array.prototype.slice.call(trace.layers[layer].weights, off, off + T);
  }

  function getScores(trace, layer, head, row) {
    var T = trace.T, off = (head * T + row) * T;
    return Array.prototype.slice.call(trace.layers[layer].scores, off, off + T);
  }

  return {
    Transformer: Transformer,
    create: function (seed) { return new Transformer(seed); },
    getVec: getVec,
    getAttention: getAttention,
    getScores: getScores,
    V: V, D: D, H: H, DH: DH, F: F, L: L,
    VOCAB: VOCAB,
    POS_SCALE: POS_SCALE,
    LOGIT_SCALE: LOGIT_SCALE,
  };
});
