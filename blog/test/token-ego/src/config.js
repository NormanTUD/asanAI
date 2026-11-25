/* TOKEN / EGO — shared constants. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});

  TEGO.CFG = {
    dModel: 128,
    nHeads: 4,
    dHead: 32,
    dFf: 512,
    nLayers: 6,
    maxSeq: 32,
    lnEps: 1e-5,
    seed: 0x5eed5eed,
    modelName: "TEGO-1.2M",
    paramNote: "≈1.23M parameters · 6 layers · 4 heads · d_model 128 · d_ff 512",
  };

  TEGO.HEAD_COLORS = [0x5ff3ff, 0xff4fd8, 0xffc857, 0x6bffb0];
  TEGO.HEAD_CSS = ["#5ff3ff", "#ff4fd8", "#ffc857", "#6bffb0"];
  TEGO.HEAD_NAMES = ["dims 0–31", "dims 32–63", "dims 64–95", "dims 96–127"];

  TEGO.LAYER_COLORS = [
    0x5ff3ff, 0x6fb7ff, 0x8d7bff, 0xc46bff, 0xff4fd8, 0xffc857,
  ];
  TEGO.LAYER_CSS = [
    "#5ff3ff", "#6fb7ff", "#8d7bff", "#c46bff", "#ff4fd8", "#ffc857",
  ];

  TEGO.COLORS = {
    bg: 0x03040a,
    ink: "#e9f3ff",
    dim: "#8fa1bb",
    cyan: "#5ff3ff",
    magenta: "#ff4fd8",
    gold: "#ffc857",
    violet: "#8d7bff",
    green: "#6bffb0",
    red: "#ff5a6e",
    past: "#ffc857",
    future: "#8d7bff",
    player: "#f4fbff",
  };

  TEGO.PROMPTS = [
    {
      id: "storm",
      label: "The lighthouse",
      text: "The lighthouse keeper watched the storm swallow the last light.",
      tokens: ["the", "lighthouse", "keeper", "watched", "the", "storm", "swallow", "the", "last", "light", "."],
      display: ["The", "lighthouse", "keeper", "watched", "the", "storm", "swallow", "the", "last", "light", "."],
      player: 5,
      blurb: "A past tense, a storm, and a light that is about to disappear.",
    },
    {
      id: "cell",
      label: "The deep cell",
      text: "A single cell in the deep layer dreamed of electric fire.",
      tokens: ["a", "single", "cell", "in", "the", "deep", "layer", "dreamed", "of", "electric", "fire", "."],
      display: ["A", "single", "cell", "in", "the", "deep", "layer", "dreamed", "of", "electric", "fire", "."],
      player: 7,
      blurb: "A tiny unit in a wide hidden layer, remembering electricity.",
    },
    {
      id: "attention",
      label: "The river",
      text: "The river of attention carries every word into the future.",
      tokens: ["the", "river", "of", "attention", "carries", "every", "word", "into", "the", "future", "."],
      display: ["The", "river", "of", "attention", "carries", "every", "word", "into", "the", "future", "."],
      player: 3,
      blurb: "Attention as a current: every word is carried, none is copied.",
    },
    {
      id: "world",
      label: "The world",
      text: "We are all tokens passing through the weight of the world.",
      tokens: ["we", "are", "all", "tokens", "passing", "through", "the", "weight", "of", "the", "world", "."],
      display: ["We", "are", "all", "tokens", "passing", "through", "the", "weight", "of", "the", "world", "."],
      player: 3,
      blurb: "A sentence about sentences, passing through the weights.",
    },
  ];

  TEGO.LAYER_PHASES = [
    {
      id: "ln1",
      name: "LayerNorm",
      short: "LN",
      duration: 1.6,
      caption: "Before the layer reads you, it centres your vector: mean zero, variance one. Your direction survives; your scale is forgotten.",
    },
    {
      id: "qkv",
      name: "Q · K · V",
      short: "QKV",
      duration: 1.9,
      caption: "Three learned projections split you. Query: what you are looking for. Key: what you offer. Value: what you will hand over if chosen.",
    },
    {
      id: "attn",
      name: "Attention",
      short: "ATTN",
      duration: 3.2,
      caption: "Your query meets every key in the past. Dot products become scores; the causal mask holds the future shut; softmax turns the scores into a budget of attention.",
    },
    {
      id: "mix",
      name: "Mix",
      short: "MIX",
      duration: 2.2,
      caption: "You do not copy the past. You mix it: a weighted sum of value vectors. The weights are the only path by which another token can enter you.",
    },
    {
      id: "write",
      name: "Write",
      short: "WRITE",
      duration: 1.5,
      caption: "The head writes its mix back into your residual stream. Nothing is overwritten. Every layer adds.",
    },
    {
      id: "ffn",
      name: "Feed-forward",
      short: "FFN",
      duration: 3.4,
      caption: "LayerNorm again, then the wide door: 128 dimensions become 512. Neurons fire; GELU keeps the positive part, softly; the state is compressed back.",
    },
    {
      id: "write2",
      name: "Residual",
      short: "ADD",
      duration: 1.6,
      caption: "The FFN writes. The residual stream carries the sum. This layer is finished; you rise to the next.",
    },
  ];

  TEGO.STAGE = {
    intro: { name: "Boot", color: "#5ff3ff" },
    tokenize: { name: "Tokenization", color: "#ffc857" },
    embed: { name: "Embedding", color: "#6fb7ff" },
    layer: { name: "Transformer layer", color: "#8d7bff" },
    final: { name: "Unembedding", color: "#ff4fd8" },
    epilogue: { name: "Inference", color: "#f4fbff" },
  };

  TEGO.QUALITY = {
    low: { pixelRatio: 1, bloom: false, stars: 1400, nebula: false, neurons: 256, labelScale: 0.8 },
    medium: { pixelRatio: 1.5, bloom: true, stars: 2600, nebula: true, neurons: 512, labelScale: 1.0 },
    high: { pixelRatio: 2, bloom: true, stars: 4200, nebula: true, neurons: 512, labelScale: 1.0 },
  };

  TEGO.STAGE_ORDER = ["intro", "tokenize", "embed", "layer", "final", "epilogue"];

  // Convenience aliases: the model and scene read the architecture constants
  // from CFG, while the content registries stay on TEGO.
  TEGO.CFG.HEAD_COLORS = TEGO.HEAD_COLORS;
  TEGO.CFG.HEAD_CSS = TEGO.HEAD_CSS;
  TEGO.CFG.HEAD_NAMES = TEGO.HEAD_NAMES;
  TEGO.CFG.LAYER_COLORS = TEGO.LAYER_COLORS;
  TEGO.CFG.LAYER_CSS = TEGO.LAYER_CSS;
  TEGO.CFG.PROMPTS = TEGO.PROMPTS;
  TEGO.CFG.LAYER_PHASES = TEGO.LAYER_PHASES;
  TEGO.CFG.STAGE = TEGO.STAGE;
  TEGO.CFG.QUALITY = TEGO.QUALITY;
  TEGO.CFG.STAGE_ORDER = TEGO.STAGE_ORDER;

  if (typeof module === "object" && module.exports) module.exports = TEGO;
})(typeof globalThis !== "undefined" ? globalThis : this);
