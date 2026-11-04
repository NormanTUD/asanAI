/* TOKEN / EGO — HUD, title screen, inspectors, codex. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});
  var U = TEGO.U;
  var CFG = TEGO.CFG;

  var STAGE_LABEL = {
    intro: "BOOT",
    tokenize: "TOKENIZATION",
    embed_matrix: "EMBEDDING MATRIX",
    embed_space: "EMBEDDING SPACE",
    embed_position: "POSITION",
    layer: "TRANSFORMER LAYER",
    final: "UNEMBEDDING",
    epilogue: "INFERENCE",
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function UI() {
    this.actions = null;
    this.trace = null;
    this.model = null;
    this.activeHead = 0;
    this.currentLayer = 0;
    this.stage = "intro";
    this.phase = "intro";
    this.phaseT = 0;
    this.promptIndex = 0;
    this.playerIndex = 0;
    this.panelKind = null;
    this.panelTab = null;
    this.lastDraw = 0;
    this.lastTick = 0;
    this.toastTimer = null;
    this.captionTimer = null;
    this.attentionCanvas = null;
    this.attentionCtx = null;
    this.lastCaption = "";
    this.quality = "high";
    this.sound = true;
  }

  UI.prototype.init = function (actions) {
    this.actions = actions || {};
    var self = this;

    this.el = {
      hud: document.getElementById("hud"),
      stageName: document.getElementById("hud-stage-name"),
      phaseName: document.getElementById("hud-phase-name"),
      layerStack: document.getElementById("layer-stack"),
      metricNorm: document.getElementById("metric-norm"),
      metricVar: document.getElementById("metric-var"),
      metricEntropy: document.getElementById("metric-entropy"),
      metricResonance: document.getElementById("metric-resonance"),
      challenge: document.getElementById("challenge"),
      challengeHead: document.getElementById("challenge-head"),
      challengeOptions: document.getElementById("challenge-options"),
      challengeResult: document.getElementById("challenge-result"),
      headSelector: document.getElementById("head-selector"),
      attentionMini: document.getElementById("attention-mini"),
      playerToken: document.getElementById("player-token"),
      playerSub: document.getElementById("player-sub"),
      caption: document.getElementById("caption"),
      captionTech: document.getElementById("caption-tech"),
      progressBar: document.getElementById("progress-bar"),
      phaseBarFill: document.getElementById("phase-bar-fill"),
      phaseBarDots: document.getElementById("phase-bar-dots"),
      toast: document.getElementById("toast"),
      title: document.getElementById("title-screen"),
      titlePromptGrid: document.getElementById("prompt-grid"),
      titleTokens: document.getElementById("prompt-tokens"),
      promptBlurb: document.getElementById("prompt-blurb"),
      begin: document.getElementById("begin-btn"),
      titleHelp: document.getElementById("title-help"),
      sound: document.getElementById("sound-btn"),
      loading: document.getElementById("loading"),
      loadingBar: document.getElementById("loading-bar"),
      loadingText: document.getElementById("loading-text"),
      panel: document.getElementById("panel"),
      panelTitle: document.getElementById("panel-title"),
      panelTabs: document.getElementById("panel-tabs"),
      panelBody: document.getElementById("panel-body"),
      panelClose: document.getElementById("panel-close"),
      fader: document.getElementById("fader"),
      epilogue: document.getElementById("epilogue"),
      epilogueTitle: document.getElementById("epilogue-title"),
      epilogueText: document.getElementById("epilogue-text"),
      epilogueToken: document.getElementById("epilogue-token"),
      continueBtn: document.getElementById("continue-btn"),
      replayBtn: document.getElementById("replay-btn"),
      epilogueCodex: document.getElementById("epilogue-codex"),
      errorBox: document.getElementById("error-box"),
      titleQuality: document.getElementById("title-quality"),
      modeBtn: document.getElementById("mode-btn"),
      continueBtn: document.getElementById("continue-btn"),
      autoBtn: document.getElementById("auto-btn"),
      skipLayerBtn: document.getElementById("skip-layer-btn"),
      deepDiveBtn: document.getElementById("deep-dive-btn"),
      finalDeep: document.getElementById("final-deep"),
      overviewBtn: document.getElementById("overview-btn"),
      titleMode: document.getElementById("title-mode"),
      explainSee: document.getElementById("explain-see"),
      explainMeaning: document.getElementById("explain-meaning"),
      vectorStrip: document.getElementById("vector-strip"),
      normSpark: document.getElementById("norm-spark"),
      attnBudget: document.getElementById("attn-budget"),
      attnBudgetWrap: document.getElementById("attn-budget-wrap"),
      headBlock: document.getElementById("head-block"),
      attentionMiniWrap: document.getElementById("attention-mini-wrap"),
      embedNeighborsWrap: document.getElementById("embed-neighbors-wrap"),
      embedNeighbors: document.getElementById("embed-neighbors"),
      embedNorms: document.getElementById("embed-norms"),
      qkvHud: document.getElementById("qkv-hud"),
      ffnHud: document.getElementById("ffn-hud"),
      finalHud: document.getElementById("final-hud"),
      temperature: document.getElementById("temperature"),
      tempValue: document.getElementById("temp-value"),
      qkvHeadLabel: document.getElementById("qkv-head-label"),
      qkvQ: document.getElementById("qkv-q"),
      qkvK: document.getElementById("qkv-k"),
      qkvV: document.getElementById("qkv-v"),
      qkvQNorm: document.getElementById("qkv-q-norm"),
      qkvKNorm: document.getElementById("qkv-k-norm"),
      qkvVNorm: document.getElementById("qkv-v-norm"),
      ffnTop: document.getElementById("ffn-top"),
    };
    this.attentionCanvas = this.el.attentionMini;
    this.attentionCtx = this.attentionCanvas.getContext("2d");
    this.vectorCtx = this.el.vectorStrip.getContext("2d");
    this.normCtx = this.el.normSpark.getContext("2d");
    this.qkvCtx = { q: this.el.qkvQ.getContext("2d"), k: this.el.qkvK.getContext("2d"), v: this.el.qkvV.getContext("2d") };
    this.auto = false;
    this.temperature = 1;
    this.attnView = "alpha";

    // Layer stack.
    for (var l = 0; l < CFG.nLayers; l++) {
      var row = document.createElement("div");
      row.className = "layer-row";
      row.dataset.layer = String(l);
      row.innerHTML = '<span class="lr-dot"></span><span class="lr-name">L' + (l + 1) + '</span><span class="lr-phase">—</span>';
      row.title = "Jump to layer " + (l + 1);
      row.addEventListener("click", (function (idx) {
        return function () { self.actions.jumpLayer && self.actions.jumpLayer(idx); };
      })(l));
      this.el.layerStack.appendChild(row);
    }

    // Head buttons.
    for (var h = 0; h < CFG.nHeads; h++) {
      var b = document.createElement("button");
      b.className = "head-btn" + (h === 0 ? " active" : "");
      b.dataset.head = String(h);
      b.textContent = "H" + (h + 1);
      b.title = CFG.HEAD_NAMES[h] + " head";
      b.addEventListener("click", (function (idx) {
        return function () { self.actions.setHead && self.actions.setHead(idx); };
      })(h));
      this.el.headSelector.appendChild(b);
    }

    // Phase bar ticks.
    for (var p = 0; p < CFG.LAYER_PHASES.length; p++) {
      var tick = document.createElement("i");
      this.el.phaseBarDots.appendChild(tick);
    }

    // Prompt cards.
    for (var pi = 0; pi < TEGO.PROMPTS.length; pi++) {
      var pr = TEGO.PROMPTS[pi];
      var card = document.createElement("button");
      card.className = "prompt-card" + (pi === 0 ? " active" : "");
      card.dataset.prompt = String(pi);
      card.innerHTML = '<div class="pc-index">0' + (pi + 1) + '</div><div class="pc-label">' + esc(pr.label) + '</div><div class="pc-text">' + esc(pr.text) + '</div>';
      card.addEventListener("click", (function (idx) {
        return function () { self.actions.selectPrompt && self.actions.selectPrompt(idx); };
      })(pi));
      this.el.titlePromptGrid.appendChild(card);
    }

    this.el.begin.addEventListener("click", function () { self.actions.start && self.actions.start(); });
    this.el.titleHelp.addEventListener("click", function () { self.openPanel("help"); });
    this.el.sound.addEventListener("click", function () { self.actions.toggleSound && self.actions.toggleSound(); });
    this.el.titleMode.addEventListener("click", function () { self.actions.toggleAuto && self.actions.toggleAuto(); });
    this.el.modeBtn.addEventListener("click", function () { self.actions.toggleAuto && self.actions.toggleAuto(); });
    this.el.autoBtn.addEventListener("click", function () { self.actions.toggleAuto && self.actions.toggleAuto(); });
    this.el.continueBtn.addEventListener("click", function () { self.actions.next && self.actions.next(); });
    this.el.skipLayerBtn.addEventListener("click", function () { self.actions.skipLayer && self.actions.skipLayer(); });
    this.el.deepDiveBtn.addEventListener("click", function () { self.actions.deepDive && self.actions.deepDive(); });
    this.el.overviewBtn.addEventListener("click", function () { self.actions.toggleOverview && self.actions.toggleOverview(); });
    this.el.finalDeep.addEventListener("click", function () { self.actions.deepDive && self.actions.deepDive(); });
    this.el.temperature.addEventListener("input", function () {
      var v = parseFloat(self.el.temperature.value) || 1;
      self.temperature = v;
      self.el.tempValue.textContent = v.toFixed(2);
      self.actions.setTemperature && self.actions.setTemperature(v);
    });
    var viewBtns = document.querySelectorAll(".attn-view");
    for (var vb = 0; vb < viewBtns.length; vb++) {
      viewBtns[vb].addEventListener("click", (function (btn) {
        return function () {
          self.attnView = btn.dataset.view;
          for (var q = 0; q < viewBtns.length; q++) viewBtns[q].classList.toggle("active", viewBtns[q] === btn);
          self.drawAttention();
        };
      })(viewBtns[vb]));
    }
    this.el.panelClose.addEventListener("click", function () { self.closePanel(); });
    this.el.continueBtn.addEventListener("click", function () { self.actions.continueToken && self.actions.continueToken(); });
    this.el.replayBtn.addEventListener("click", function () { self.actions.replay && self.actions.replay(); });
    this.el.epilogueCodex.addEventListener("click", function () { self.openPanel("codex"); });

    this.el.panel.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest(".panel-tab") : null;
      if (t) {
        self.panelTab = t.dataset.tab;
        self.renderPanel();
      }
    });

    this.setPrompt(0, TEGO.PROMPTS[0].player);
  };

  UI.prototype.setPrompt = function (pi, playerIndex) {
    this.promptIndex = pi;
    var pr = TEGO.PROMPTS[pi];
    this.playerIndex = playerIndex === undefined ? pr.player : playerIndex;
    var cards = this.el.titlePromptGrid.querySelectorAll(".prompt-card");
    for (var i = 0; i < cards.length; i++) cards[i].classList.toggle("active", i === pi);
    this.el.promptBlurb.textContent = pr.blurb;
    this.renderTokenChips();
    this.el.playerToken.textContent = pr.display[this.playerIndex] || pr.tokens[this.playerIndex];
    this.el.playerSub.textContent = "position " + this.playerIndex + " · " + CFG.dModel + "-d";
  };

  UI.prototype.renderTokenChips = function () {
    var pr = TEGO.PROMPTS[this.promptIndex];
    var self = this;
    this.el.titleTokens.innerHTML = "";
    for (var i = 0; i < pr.tokens.length; i++) {
      var b = document.createElement("button");
      var cls = "token-chip";
      if (i === this.playerIndex) cls += " player";
      else if (i < this.playerIndex) cls += " past";
      else cls += " future";
      b.className = cls;
      b.textContent = pr.display[i] || pr.tokens[i];
      b.title = i === this.playerIndex ? "You are this token" : i < this.playerIndex ? "Past: visible to attention" : "Future: masked from attention";
      b.addEventListener("click", (function (idx) {
        return function () {
          self.setPrompt(self.promptIndex, idx);
          self.actions.selectPlayer && self.actions.selectPlayer(idx);
        };
      })(i));
      this.el.titleTokens.appendChild(b);
    }
  };

  UI.prototype.showTitle = function () {
    this.el.title.classList.remove("hidden");
    this.el.hud.classList.add("hud-hidden");
    this.el.epilogue.classList.add("hidden");
    this.el.panel.classList.add("hidden");
  };

  UI.prototype.hideTitle = function () {
    this.el.title.classList.add("hidden");
    this.el.hud.classList.remove("hud-hidden");
  };

  UI.prototype.setLoading = function (text, progress) {
    this.el.loading.classList.remove("hidden");
    if (text) this.el.loadingText.textContent = text;
    if (progress !== undefined) this.el.loadingBar.style.width = Math.round(progress * 100) + "%";
  };

  UI.prototype.hideLoading = function () {
    this.el.loading.classList.add("hidden");
  };

  UI.prototype.flash = function (ms) {
    var f = this.el.fader;
    f.classList.add("on");
    clearTimeout(this._flashTimer);
    var self = this;
    this._flashTimer = setTimeout(function () { f.classList.remove("on"); }, ms || 260);
  };

  UI.prototype.toast = function (text, ms) {
    var t = this.el.toast;
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () { t.classList.remove("show"); }, ms || 2200);
  };

  UI.prototype.showError = function (msg) {
    this.el.errorBox.classList.remove("hidden");
    this.el.errorBox.textContent = msg;
  };

  UI.prototype.setSound = function (on) {
    this.sound = !!on;
    this.el.sound.textContent = "Sound: " + (on ? "on" : "off");
    this.el.sound.setAttribute("aria-pressed", on ? "true" : "false");
  };

  UI.prototype.setQuality = function (name) {
    this.quality = name;
    if (this.el.titleQuality) this.el.titleQuality.textContent = "quality: " + name;
  };

  UI.prototype.setModel = function (model) {
    this.model = model;
  };

  UI.prototype.setTrace = function (trace) {
    this.trace = trace;
    if (!trace) return;
    var self = this;
    this.el.playerToken.textContent = trace.tokens[trace.player];
    this.el.playerSub.textContent = "position " + trace.player + " · " + CFG.dModel + "-d · id " + trace.ids[trace.player];
    this.setHead(this.activeHead);
    this.updatePlayerRow();
    this.updateMetrics();
    this.drawVectorStrip();
    this.drawNormSpark();
    this.drawAttentionBudget();
    this.drawQKVHud();
    this.drawFFNHud();
    this.drawEmbedNeighbors();
  };

  UI.prototype.setHead = function (h) {
    this.activeHead = U.clamp(h, 0, CFG.nHeads - 1);
    var btns = this.el.headSelector.querySelectorAll(".head-btn");
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("active", i === this.activeHead);
    this.drawAttention();
    this.drawAttentionBudget();
    this.drawQKVHud();
    if (this.panelKind === "math") this.renderPanel();
  };

  UI.prototype.setStage = function (stage, layer, phase, phaseT) {
    this.stage = stage;
    this.currentLayer = layer === undefined ? this.currentLayer : layer;
    this.phase = phase || stage;
    this.phaseT = phaseT || 0;

    var stageEl = this.el.stageName;
    var phaseEl = this.el.phaseName;
    if (stage === "layer") {
      stageEl.textContent = "LAYER " + (this.currentLayer + 1) + " / " + CFG.nLayers;
      var ph = this.phaseFor(this.phase);
      phaseEl.textContent = ph ? ph.name : this.phase;
    } else {
      stageEl.textContent = STAGE_LABEL[stage] || stage;
      phaseEl.textContent = stage === "intro" ? "a token is about to fall" : stage === "epilogue" ? "no weights were changed" : "";
    }

    var rows = this.el.layerStack.querySelectorAll(".layer-row");
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("active", stage === "layer" && i === this.currentLayer);
      rows[i].classList.toggle("done", stage === "layer" ? i < this.currentLayer : (stage === "final" || stage === "epilogue"));
      var phEl = rows[i].querySelector(".lr-phase");
      phEl.textContent = stage === "layer" && i === this.currentLayer ? (this.phaseFor(this.phase) || {}).short || "" : i < this.currentLayer ? "✓" : "—";
    }

    var ex = this.explainFor(stage, this.phase);
    var ph2 = this.phaseFor(this.phase);
    if (ph2 && stage === "layer") {
      this.setCaption(ex.caption || ph2.caption, ex.tech || this.techFor(ph2), ex.see, ex.meaning);
    } else {
      this.setCaption(ex.caption, ex.tech, ex.see, ex.meaning);
    }

    var isLayer = stage === "layer";
    if (!(isLayer && this.phase === "attn")) this.hideChallenge();
    this.el.qkvHud.classList.toggle("hidden", !(isLayer && this.phase === "qkv"));
    this.el.ffnHud.classList.toggle("hidden", !(isLayer && this.phase === "ffn"));
    this.el.attnBudgetWrap.classList.toggle("hidden", !isLayer);
    var isEmbed = stage === "embed_space" || stage === "embed_position";
    this.el.embedNeighborsWrap.classList.toggle("hidden", !isEmbed);
    this.el.headBlock.classList.toggle("hidden", stage !== "layer");
    this.el.attentionMiniWrap.classList.toggle("hidden", stage !== "layer");
    this.el.finalHud.classList.toggle("hidden", stage !== "final");
    if (isEmbed) this.drawEmbedNeighbors();

    this.updatePhaseBar();
    this.updateMetrics();
    this.drawAttention();
    this.drawAttentionBudget();
    this.drawQKVHud();
    this.drawFFNHud();
    this.drawVectorStrip();
    this.drawNormSpark();
    this.updateContinue();
  };

  UI.prototype.explainFor = function (stage, phase) {
    if (stage === "layer") {
      var m = {
        ln1: {
          caption: "Before the layer reads you, it centres your vector: mean zero, variance one. Your direction survives; your scale is forgotten.",
          tech: "LN(x) = γ ⊙ (x − μ)/√(σ² + ε) + β",
          see: "A lens between you and the central pillar. The 128 bars around the pillar are your actual residual vector.",
          meaning: "LayerNorm makes a normalized copy of your vector for the next sublayer. It subtracts the mean and divides by the standard deviation. The residual stream itself is not changed; this is only what the layer reads.",
        },
        qkv: {
          caption: "Three learned projections split you. Query: what you are looking for. Key: what you offer. Value: what you will hand over if chosen.",
          tech: "Q = W_Q·LN(x) · K = W_K·LN(x) · V = W_V·LN(x)",
          see: "Your token splits into Q, K and V ghost crystals around you, with three holographic panels. Each bar is one of the 32 dimensions of the active head.",
          meaning: "The same normalized vector is multiplied by three different matrices. Q is what you are looking for, K is what you offer to others, V is what you hand over. The head owns a fixed 32-dimensional slice; the other 96 dimensions belong to the other heads.",
        },
        attn: {
          caption: "Your query meets every key in the past. Dot products become scores; the causal mask holds the future shut; softmax turns the scores into a budget of attention.",
          tech: "s_ij = q_i·k_j / √32 · α = softmax(s + mask) · future → −∞",
          see: "Beams from you to the gold past tokens. All four heads are visible at once: each colour is a head, the selected head is brightest, the others stay visible. Beam thickness and brightness are α. The violet future has no beams.",
          meaning: "Each head computes its own scores, mask and softmax in parallel. The causal mask sets every future score to −∞, so a future token receives exactly zero weight. The selected head's exact α and weighted value contributions are in the budget list; the deep-dive panel shows all four heads side by side.",
        },
        mix: {
          caption: "You do not copy the past. You mix it: a weighted sum of value vectors. The weights are the only path by which another token can enter you.",
          tech: "z_i = Σ_j α_ij · v_j",
          see: "Value particles flow from each attended token into your crystal; your crystal tint blends with the mixture.",
          meaning: "Your attention output is a weighted average of the value vectors you attended to. If α is 0.98 for the keeper, 98% of that head's value comes from the keeper. The budget list shows both α and ‖α·v‖ so you can see who actually enters you.",
        },
        write: {
          caption: "The head writes its mix back into your residual stream. Nothing is overwritten. Every layer adds.",
          tech: "x ← x + W_O·z + b_O",
          see: "A bright pulse travels from your crystal into the pillar; the 128 bars around the pillar change.",
          meaning: "The mixed vector is projected by the output matrix W_O and added to the residual stream. The new vector is the old vector plus this write. The residual stream is additive: attention reads from it and writes into it, but never replaces it.",
        },
        ffn: {
          caption: "After the MHA write, the residual x_mid is normalized again. Then the wide door opens: 128 → 512. Every W₁ weight becomes a filament; the neurons fire; GELU gates them; W₂ compresses back to 128. The result is added to x_mid.",
          tech: "m = LN(x_mid) · pre = W₁m + b₁ · h = GELU(pre) · y = W₂h + b₂ · x_out = x_mid + y",
          see: "You travel through the LN door, the 128-node input ring, the full 65,536-filament W₁ web, the 512-neuron sphere, the GELU gate, the 65,536-filament W₂ web, and the 128-node output ring. The camera is the vector.",
          meaning: "The lift is linear: each of the 512 hidden values is a weighted sum of the 128 normalized values. The web draws every weight: brightness ∝ |W|, colour = sign. The hidden node brightness is the exact GELU activation. The 3D positions are a layout; the values are exact. W₂ returns y to 128 dimensions, and x_out = x_mid + y.",
        },
        write2: {
          caption: "The FFN writes. The residual stream carries the sum. This layer is finished; you rise to the next.",
          tech: "x ← x + y · the norm grows by addition",
          see: "The pillar grows brighter; the residual norm rises; the layer lifts to the next ring.",
          meaning: "The FFN output is added to the residual stream. The stream now contains the embedding plus every attention write and every FFN write so far. The next layer reads this new vector. The norm sparkline on the left shows the growth.",
        },
      };
      return m[phase] || { caption: "", tech: "", see: "", meaning: "" };
    }
    if (stage === "tokenize") {
      return {
        caption: "The sentence breaks into pieces. You are one of them: token #" + this.playerIndex + ", “" + (this.trace ? this.trace.tokens[this.playerIndex] : "") + "”. The model does not see the word. It sees an integer.",
        tech: "token id " + (this.trace ? this.trace.ids[this.playerIndex] : "—") + " · vocabulary " + (this.trace ? this.trace.vocab.length : "—"),
        see: "The sentence as discrete tokens floating in a line. You are the white token; gold tokens are your past, violet tokens are your future.",
        meaning: "The model does not read letters or words. It maps each piece to an integer id. That id selects a row of the token-embedding matrix: a direction in 128-dimensional space. The next stage puts you inside that space.",
      };
    }
    if (stage === "embed_matrix") {
      return {
        caption: "Your integer runs down the left edge of a matrix. One row lights up: 128 numbers. You are about to become that row.",
        tech: "x_token = E[id] · E ∈ ℝ^258×128",
        see: "A tall wall of 258 rows and 128 columns. The bright horizontal line is your row; the columns are the 128 embedding dimensions.",
        meaning: "The token id is an index into the embedding matrix E. Row id is the token's learned vector. Every row is a direction in the same 128-dimensional space. Similarity is the angle between directions, not Euclidean distance. The next stage puts you inside that space.",
      };
    }
    if (stage === "embed_space") {
      return {
        caption: "You are inside the embedding space. The other tokens are stars around you. Near means similar.",
        tech: "cos(E_i, E_j) = (E_i · E_j)/(‖E_i‖‖E_j‖) · 3D = PCA projection",
        see: "You are at the centre. The nearest stars are the tokens whose 128-dimensional embeddings point in a similar direction. The list on the right gives the exact cosine similarity.",
        meaning: "The 3D cloud is a PCA projection of the real 128-dimensional token vectors, so it is a map, not the full space. The true similarity is the cosine in 128 dimensions. Tokens that are close here are tokens the model treats as related directions.",
      };
    }
    if (stage === "embed_position") {
      return {
        caption: "A token is not only what it is; it is also where it stands. A fixed position vector is added.",
        tech: "x₀ = E[token] + P[position] · P is sinusoidal",
        see: "Cyan filaments are the token embedding E. Gold filaments are the position vector P. White filaments are the sum x₀.",
        meaning: "The position in the cloud is the direction of the token embedding, not the sequence position. The sequence position is added as a separate 128-dimensional vector P_pos. Dimension by dimension, x₀[d] = E[d] + P[d]. The sum is again a direction in the residual stream. The model now knows both what you are and where you are.",
      };
    }
    if (stage === "final") {
      return {
        caption: "Above the last layer, every token in the vocabulary becomes a possible future. The unembedding scores them; softmax turns the scores into a probability sky.",
        tech: "logits = E · LN(x₆) · p = softmax(logits / T)",
        see: "A sky of 258 token stars. Size and brightness are probability. The top labels show the exact percentages.",
        meaning: "The final vector is multiplied by the tied embedding matrix, producing one logit per vocabulary token. Softmax turns the logits into probabilities. Temperature rescales the logits: low T makes the sky sharper, high T flattens it. The model does not choose; it produces a distribution.",
      };
    }
    if (stage === "epilogue") {
      return {
        caption: "One forward pass. No memory, no learning, no gradient. Only a wave through the weights. You were the wave.",
        tech: "inference only · weights frozen",
        see: "The tower below, the probability sky above, the chosen token in the card.",
        meaning: "The weights did not change. There was no backward pass and no memory. The model computed a distribution and you picked one token. That is inference.",
      };
    }
    return {
      caption: "You are about to become a token.",
      tech: "1.23M weights · 6 layers · 4 heads · d_model 128 · d_ff 512",
      see: "A tower of six layers around a luminous residual stream.",
      meaning: "A transformer is a stack of identical layers. Each layer reads the residual stream, computes an attention update and a feed-forward update, and writes both back by addition.",
    };
  };

  UI.prototype.phaseFor = function (id) {
    for (var i = 0; i < CFG.LAYER_PHASES.length; i++) if (CFG.LAYER_PHASES[i].id === id) return CFG.LAYER_PHASES[i];
    return null;
  };

  UI.prototype.techFor = function (ph) {
    switch (ph.id) {
      case "ln1": return "LN(x) = γ ⊙ (x − μ)/√(σ² + ε) + β";
      case "qkv": return "Q = W_Q·LN(x), K = W_K·LN(x), V = W_V·LN(x)";
      case "attn": return "α = softmax(QKᵀ/√d_head + mask) · causal mask: j > i → −∞";
      case "mix": return "z = Σ α_ij v_j · the residual is not overwritten";
      case "write": return "x ← x + W_O·z + b_O";
      case "ffn": return "h = GELU(W₁·LN(x) + b₁), y = W₂·h + b₂";
      case "write2": return "x ← x + y · residual stream grows by addition";
      default: return "";
    }
  };

  UI.prototype.setCaption = function (text, tech, see, meaning) {
    if (text === this.lastCaption && see === this.lastSee && meaning === this.lastMeaning) return;
    this.lastCaption = text;
    this.lastSee = see;
    this.lastMeaning = meaning;
    var cap = this.el.caption, tc = this.el.captionTech, se = this.el.explainSee, me = this.el.explainMeaning;
    cap.style.opacity = "0";
    tc.style.opacity = "0";
    se.style.opacity = "0";
    me.style.opacity = "0";
    clearTimeout(this.captionTimer);
    var self = this;
    this.captionTimer = setTimeout(function () {
      cap.textContent = text;
      tc.textContent = tech || "";
      se.textContent = see || "";
      me.textContent = meaning || "";
      cap.style.opacity = "1";
      tc.style.opacity = "1";
      se.style.opacity = "1";
      me.style.opacity = "1";
    }, 120);
  };

  UI.prototype.sliceVec = function (arr, index, D) {
    D = D || CFG.dModel;
    var out = new Array(D);
    for (var i = 0; i < D; i++) out[i] = arr[index * D + i];
    return out;
  };

  UI.prototype.getCurrentVec = function () {
    if (!this.trace) return null;
    var D = CFG.dModel, p = this.trace.player;
    var l = Math.min(this.currentLayer, this.trace.layers.length - 1);
    var layer = this.trace.layers[l];
    if (this.stage === "layer") {
      if (this.phase === "write") return this.sliceVec(layer.xMid, p, D);
      if (this.phase === "write2") return this.sliceVec(layer.xOut, p, D);
      if (this.phase === "ffn") return this.sliceVec(layer.xMid, p, D);
      return this.sliceVec(layer.xIn, p, D);
    }
    if (this.stage === "embed_space") return this.sliceVec(this.trace.embed.tok, p, D);
    if (this.stage === "embed_position" || this.stage === "embed_matrix" || this.stage === "tokenize") return this.sliceVec(this.trace.embed.x0, p, D);
    if (this.stage === "final" || this.stage === "epilogue") return this.sliceVec(this.trace.final.x, 0, D);
    return this.sliceVec(this.trace.embed.x0, p, D);
  };

  UI.prototype.drawVectorStrip = function () {
    var c = this.el.vectorStrip;
    if (!c || !this.vectorCtx) return;
    var ctx = this.vectorCtx;
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.75)";
    ctx.fillRect(0, 0, w, h);
    var vec = this.getCurrentVec();
    var mid = h / 2;
    ctx.strokeStyle = "rgba(143,180,230,0.16)";
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
    if (!vec) return;
    var max = 1e-6;
    for (var i = 0; i < vec.length; i++) max = Math.max(max, Math.abs(vec[i]));
    var bw = w / vec.length;
    for (var j = 0; j < vec.length; j++) {
      var v = vec[j] / max;
      var bh = Math.abs(v) * (mid - 3);
      ctx.fillStyle = v >= 0 ? "rgba(95,243,255,0.88)" : "rgba(255,79,216,0.88)";
      ctx.fillRect(j * bw, v >= 0 ? mid - bh : mid, Math.max(1, bw - 0.4), Math.max(1, bh));
    }
  };

  UI.prototype.drawNormSpark = function () {
    var c = this.el.normSpark;
    if (!c || !this.normCtx || !this.trace) return;
    var ctx = this.normCtx;
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.75)";
    ctx.fillRect(0, 0, w, h);
    var norms = [];
    var p = this.trace.player, D = CFG.dModel;
    norms.push(U.norm(this.sliceVec(this.trace.embed.x0, p, D)));
    for (var l = 0; l < this.trace.layers.length; l++) norms.push(U.norm(this.sliceVec(this.trace.layers[l].xOut, p, D)));
    var max = Math.max.apply(null, norms) * 1.08 || 1;
    var min = Math.min.apply(null, norms) * 0.92;
    var pad = 8;
    function x(i) { return pad + (i / (norms.length - 1)) * (w - pad * 2); }
    function y(v) { return h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2); }
    ctx.strokeStyle = "rgba(95,243,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(95,243,255,0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (var i = 0; i < norms.length; i++) {
      if (i === 0) ctx.moveTo(x(i), y(norms[i])); else ctx.lineTo(x(i), y(norms[i]));
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    var current = this.stage === "layer" ? this.currentLayer + 1 : -1;
    for (var j = 0; j < norms.length; j++) {
      ctx.fillStyle = j === current ? "#fff" : "rgba(233,243,255,0.55)";
      ctx.beginPath(); ctx.arc(x(j), y(norms[j]), j === current ? 2.6 : 1.8, 0, Math.PI * 2); ctx.fill();
      if (j === 0 || j === norms.length - 1 || j === current) {
        ctx.font = "7px 'SF Mono', monospace";
        ctx.fillStyle = "rgba(233,243,255,0.55)";
        ctx.textAlign = "center";
        ctx.fillText(j === 0 ? "E" : "L" + j, x(j), h - 1);
      }
    }
    ctx.textAlign = "left";
    ctx.font = "7px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.55)";
    ctx.fillText("max " + U.fmt(max, 1), 3, 9);
  };

  UI.prototype.drawAttentionBudget = function () {
    if (!this.el.attnBudget) return;
    var box = this.el.attnBudget;
    var self = this;
    box.innerHTML = "";
    if (!this.trace || this.stage !== "layer") return;
    var l = Math.min(this.currentLayer, this.trace.layers.length - 1);
    var layer = this.trace.layers[l];
    var T = this.trace.T, p = this.trace.player, h = this.activeHead;
    var D = CFG.dModel, DH = CFG.dHead;
    var items = [];
    for (var j = 0; j <= p; j++) {
      var a = layer.weights[(h * T + p) * T + j];
      var vn = 0;
      for (var d = 0; d < DH; d++) {
        var vv = layer.v[j * D + h * DH + d];
        vn += vv * vv;
      }
      vn = Math.sqrt(vn);
      items.push({ j: j, a: a, c: a * vn });
    }
    items.sort(function (x, y) { return y.a - x.a; });
    var maxA = items.length ? items[0].a || 1 : 1;
    var headColor = CFG.HEAD_CSS[h];
    for (var i = 0; i < Math.min(8, items.length); i++) {
      var it = items[i];
      var el = document.createElement("div");
      el.className = "attn-item" + (it.j === p ? " player" : "");
      el.style.borderLeftColor = headColor;
      el.title = "token " + it.j + " · α = " + U.pct(it.a, 2) + " · weighted value contribution ‖α·v‖ = " + U.fmt(it.c, 2);
      el.innerHTML = '<span class="ai-name">' + esc(this.trace.tokens[it.j]) + '<small>pos ' + it.j + '</small></span>' +
        '<span class="ai-bar"><i style="width:' + Math.round((it.a / maxA) * 100) + '%;background:' + headColor + '"></i></span>' +
        '<span class="ai-val">' + U.pct(it.a, 1) + '<small>c ' + U.fmt(it.c, 1) + '</small></span>';
      (function (idx) {
        el.addEventListener("click", function () { self.actions.inspectToken && self.actions.inspectToken(idx); });
      })(it.j);
      box.appendChild(el);
    }
    if (p < T - 1) {
      var fut = document.createElement("div");
      fut.className = "attn-item masked";
      fut.innerHTML = '<span class="ai-name">' + esc(this.trace.tokens[p + 1]) + '<small>future</small></span><span class="ai-bar"><i style="width:0%"></i></span><span class="ai-val">−∞</span>';
      box.appendChild(fut);
    }
    if (!box.children.length) box.innerHTML = '<div class="mini-note">no past tokens to attend to</div>';
  };

  UI.prototype.drawEmbedNeighbors = function () {
    if (!this.el.embedNeighbors || !this.trace || !this.model) return;
    var box = this.el.embedNeighbors;
    var norms = this.el.embedNorms;
    box.innerHTML = "";
    var pid = this.trace.ids[this.trace.player];
    var D = CFG.dModel;
    var E = this.model.W.E;
    var p = this.trace.player;
    var e = this.sliceVec(this.trace.embed.tok, p, D);
    var pos = this.sliceVec(this.trace.embed.pos, p, D);
    var x0 = this.sliceVec(this.trace.embed.x0, p, D);
    if (norms) norms.textContent = "‖E‖ " + U.fmt(U.norm(e), 2) + " · ‖P‖ " + U.fmt(U.norm(pos), 2) + " · ‖x₀‖ " + U.fmt(U.norm(x0), 2);
    var pv = [];
    var pn = 0;
    for (var d = 0; d < D; d++) { var v = E[pid * D + d]; pv.push(v); pn += v * v; }
    pn = Math.sqrt(pn) || 1;
    var sims = [];
    for (var i = 0; i < this.trace.vocab.length; i++) {
      if (i === pid) continue;
      var dot = 0, n = 0;
      for (var j = 0; j < D; j++) { var w = E[i * D + j]; dot += pv[j] * w; n += w * w; }
      sims.push({ id: i, sim: dot / (pn * (Math.sqrt(n) || 1)) });
    }
    sims.sort(function (a, b) { return b.sim - a.sim; });
    var you = document.createElement("div");
    you.className = "embed-item you";
    you.innerHTML = '<span class="ei-name">' + esc(this.trace.tokens[this.trace.player]) + '</span><span class="ei-bar"><i style="width:100%"></i></span><span class="ei-val">you</span>';
    box.appendChild(you);
    var maxSim = sims.length ? sims[0].sim : 1;
    for (var k = 0; k < Math.min(14, sims.length); k++) {
      var it = sims[k];
      var el = document.createElement("div");
      el.className = "embed-item";
      el.title = "token " + this.trace.vocab[it.id] + " · cosine similarity " + it.sim.toFixed(4);
      var w2 = Math.max(0, it.sim) / (Math.max(1e-6, maxSim) || 1);
      el.innerHTML = '<span class="ei-name">' + esc(this.trace.vocab[it.id]) + '</span>' +
        '<span class="ei-bar"><i style="width:' + Math.round(w2 * 100) + '%"></i></span>' +
        '<span class="ei-val">' + it.sim.toFixed(2) + '</span>';
      box.appendChild(el);
    }
  };

  UI.prototype.drawBars32 = function (ctx, canvas, vec, head, color) {
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,16,0.7)";
    ctx.fillRect(0, 0, w, h);
    var base = head * CFG.dHead;
    var max = 1e-6;
    for (var i = 0; i < CFG.dHead; i++) max = Math.max(max, Math.abs(vec[base + i]));
    var bw = w / CFG.dHead, mid = h / 2;
    for (var j = 0; j < CFG.dHead; j++) {
      var v = vec[base + j] / max;
      var bh = Math.abs(v) * (mid - 3);
      ctx.fillStyle = color;
      ctx.fillRect(j * bw, v >= 0 ? mid - bh : mid, Math.max(1, bw - 0.6), Math.max(1, bh));
    }
    ctx.strokeStyle = "rgba(143,180,230,0.15)";
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
  };

  UI.prototype.drawQKVHud = function () {
    if (!this.el.qkvHud || this.stage !== "layer" || this.phase !== "qkv" || !this.trace) return;
    var l = Math.min(this.currentLayer, this.trace.layers.length - 1);
    var layer = this.trace.layers[l], p = this.trace.player;
    var q = this.sliceVec(layer.q, p, CFG.dModel);
    var k = this.sliceVec(layer.k, p, CFG.dModel);
    var v = this.sliceVec(layer.v, p, CFG.dModel);
    this.el.qkvHeadLabel.textContent = (this.activeHead + 1) + " · " + CFG.HEAD_NAMES[this.activeHead];
    this.drawBars32(this.qkvCtx.q, this.el.qkvQ, q, this.activeHead, "#5ff3ff");
    this.drawBars32(this.qkvCtx.k, this.el.qkvK, k, this.activeHead, "#ff4fd8");
    this.drawBars32(this.qkvCtx.v, this.el.qkvV, v, this.activeHead, "#ffc857");
    function normHead(vec, head) {
      var s = 0;
      for (var i = 0; i < CFG.dHead; i++) { var x = vec[head * CFG.dHead + i]; s += x * x; }
      return Math.sqrt(s);
    }
    this.el.qkvQNorm.textContent = U.fmt(normHead(q, this.activeHead), 1);
    this.el.qkvKNorm.textContent = U.fmt(normHead(k, this.activeHead), 1);
    this.el.qkvVNorm.textContent = U.fmt(normHead(v, this.activeHead), 1);
  };

  UI.prototype.drawFFNHud = function () {
    if (!this.el.ffnHud || this.stage !== "layer" || this.phase !== "ffn" || !this.trace) return;
    var l = Math.min(this.currentLayer, this.trace.layers.length - 1);
    var layer = this.trace.layers[l], p = this.trace.player;
    var off = p * CFG.dFf;
    var act = [];
    for (var i = 0; i < CFG.dFf; i++) act.push({ i: i, pre: layer.hidden[off + i], post: layer.gelu[off + i] });
    act.sort(function (a, b) { return b.post - a.post; });
    var max = act[0].post || 1;
    var html = "";
    for (var k = 0; k < 6; k++) {
      html += '<div class="ffn-neuron"><span class="fn-id">#' + act[k].i + '</span><span class="fn-bar"><i style="width:' + Math.round((act[k].post / max) * 100) + '%"></i></span><b>' + U.fmt(act[k].post, 2) + '</b></div>';
    }
    var active = 0;
    for (var j = 0; j < CFG.dFf; j++) if (layer.gelu[off + j] > 0.001) active++;
    var mNorm = 0, yNorm = 0;
    for (var dn = 0; dn < CFG.dModel; dn++) {
      mNorm += layer.ln2[off + dn] * layer.ln2[off + dn];
      yNorm += layer.ffnOut[off + dn] * layer.ffnOut[off + dn];
    }
    html += '<div class="mini-note">m = LN(x_mid) ‖m‖ ' + U.fmt(Math.sqrt(mNorm), 2) + ' · ' + active + ' / ' + CFG.dFf + ' active · max GELU ' + U.fmt(max, 2) + '</div>';
    html += '<div class="mini-note">65,536 W₁ + 65,536 W₂ weights drawn · ‖y‖ ' + U.fmt(Math.sqrt(yNorm), 2) + ' · x_out = x_mid + y</div>';
    this.el.ffnTop.innerHTML = html;
  };

  UI.prototype.beatLabel = function (b) {
    if (!b) return "";
    if (b.stage === "layer") {
      var ph = this.phaseFor(b.phase);
      return "Layer " + (b.layer + 1) + " · " + (ph ? ph.name : b.phase);
    }
    if (b.stage === "embed_matrix") return "Embedding matrix";
    if (b.stage === "embed_space") return "Embedding space";
    if (b.stage === "embed_position") return "Position";
    return STAGE_LABEL[b.stage] || b.stage;
  };

  UI.prototype.updateContinue = function () {
    var s = this.lastState;
    if (!s || !this.el.continueBtn) return;
    var show = s.started && !s.ended && s.stage !== "final" && s.stage !== "epilogue";
    this.el.continueBar = this.el.continueBar || document.getElementById("continue-bar");
    if (this.el.continueBar) this.el.continueBar.style.display = show ? "flex" : "none";
    var auto = !!s.auto;
    this.auto = auto;
    var modeText = auto ? "AUTO" : "GUIDED";
    if (this.el.modeBtn) {
      this.el.modeBtn.textContent = modeText;
      this.el.modeBtn.classList.toggle("auto", auto);
    }
    if (this.el.autoBtn) {
      this.el.autoBtn.textContent = "Auto: " + (auto ? "on" : "off");
      this.el.autoBtn.classList.toggle("auto", auto);
    }
    if (this.el.titleMode) {
      this.el.titleMode.textContent = "Pace: " + (auto ? "auto" : "guided");
      this.el.titleMode.setAttribute("aria-pressed", auto ? "true" : "false");
    }
    if (!show) return;
    var next = s.beats && s.beats[s.beatIndex + 1];
    var txt = next ? "Continue → " + this.beatLabel(next) : "Continue";
    if (this.el.continueBtn.textContent !== txt) this.el.continueBtn.textContent = txt;
    var ready = (s.phaseT || 0) >= 0.86;
    this.el.continueBtn.classList.toggle("ready", ready);
    if (this.el.skipLayerBtn) {
      this.el.skipLayerBtn.style.opacity = s.stage === "layer" ? "1" : "0.5";
    }
    if (this.el.overviewBtn) {
      this.el.overviewBtn.textContent = s.overview ? "Stage view" : "All at once";
      this.el.overviewBtn.classList.toggle("auto", !!s.overview);
    }
  };

  UI.prototype.setOverview = function (on) {
    if (this.el.overviewBtn) {
      this.el.overviewBtn.textContent = on ? "Stage view" : "All at once";
      this.el.overviewBtn.classList.toggle("auto", !!on);
    }
  };

  UI.prototype.showChallenge = function (trace, layer, head) {
    if (!this.el.challenge) return;
    this.el.challenge.classList.remove("hidden");
    this.el.challengeHead.textContent = "H" + (head + 1) + " · " + CFG.HEAD_NAMES[head];
    this.el.challengeResult.textContent = "";
    this.el.challengeOptions.innerHTML = "";
    for (var j = 0; j <= trace.player; j++) {
      var b = document.createElement("button");
      b.className = "challenge-opt";
      b.dataset.index = String(j);
      b.textContent = (j === trace.player ? "you · " : "") + trace.tokens[j];
      b.addEventListener("click", (function (idx) {
        return function () { this.actions.guessAttention && this.actions.guessAttention(idx); };
      })(j).bind(this));
      this.el.challengeOptions.appendChild(b);
    }
  };

  UI.prototype.setChallengeResult = function (correct, answerIndex, pct, guessedIndex) {
    if (!this.el.challenge) return;
    var opts = this.el.challengeOptions.querySelectorAll(".challenge-opt");
    for (var i = 0; i < opts.length; i++) {
      var idx = parseInt(opts[i].dataset.index, 10);
      opts[i].classList.toggle("correct", idx === answerIndex);
      opts[i].classList.toggle("wrong", guessedIndex !== undefined && idx === guessedIndex && !correct);
    }
    this.el.challengeResult.textContent = correct
      ? "✓ correct · " + this.trace.tokens[answerIndex] + " gets " + U.pct(pct, 1) + " of head " + (this.activeHead + 1) + "."
      : "answer · " + this.trace.tokens[answerIndex] + " gets " + U.pct(pct, 1) + " of head " + (this.activeHead + 1) + ".";
  };

  UI.prototype.hideChallenge = function () {
    if (this.el.challenge) this.el.challenge.classList.add("hidden");
  };

  UI.prototype.updateResonance = function (n) {
    if (this.el.metricResonance) this.el.metricResonance.textContent = String(n || 0);
  };

  UI.prototype.setTemperature = function (t) {
    this.temperature = t;
    if (this.el.temperature) this.el.temperature.value = String(t);
    if (this.el.tempValue) this.el.tempValue.textContent = Number(t).toFixed(2);
  };

  UI.prototype.updatePhaseBar = function () {
    var total = this.stage === "layer" ? CFG.LAYER_PHASES.length : 1;
    var ph = this.phaseFor(this.phase);
    var idx = 0;
    for (var i = 0; i < CFG.LAYER_PHASES.length; i++) if (CFG.LAYER_PHASES[i].id === this.phase) idx = i;
    var frac = this.stage === "layer" ? (idx + this.phaseT) / total : 0;
    this.el.phaseBarFill.style.width = Math.round(frac * 100) + "%";
    var dots = this.el.phaseBarDots.querySelectorAll("i");
    for (var d = 0; d < dots.length; d++) dots[d].classList.toggle("active", this.stage === "layer" && d === idx);
  };

  UI.prototype.updatePlayerRow = function () {
    if (!this.trace) return;
    var tr = this.trace;
    var self = this;
    // no-op; the player row is also visible in the panel
  };

  UI.prototype.updateMetrics = function () {
    if (!this.trace) return;
    var tr = this.trace;
    var l = Math.min(this.currentLayer, tr.layers.length - 1);
    var layer = tr.layers[l];
    var p = tr.player;
    var x = layer.xOut;
    var norm = 0, mean = 0;
    for (var d = 0; d < CFG.dModel; d++) { var v = x[p * CFG.dModel + d]; norm += v * v; mean += v; }
    norm = Math.sqrt(norm);
    mean /= CFG.dModel;
    var varr = 0;
    for (var d2 = 0; d2 < CFG.dModel; d2++) { var dv = x[p * CFG.dModel + d2] - mean; varr += dv * dv; }
    varr /= CFG.dModel;
    var ent = layer.attnEntropy[p * CFG.nHeads + this.activeHead];
    this.el.metricNorm.textContent = U.fmt(norm, 2);
    this.el.metricVar.textContent = U.fmt(Math.sqrt(varr), 2);
    this.el.metricEntropy.textContent = U.fmt(ent, 2) + " nats";
  };

  UI.prototype.drawAttention = function () {
    if (!this.trace || !this.attentionCtx) return;
    var tr = this.trace;
    var c = this.attentionCanvas;
    var ctx = this.attentionCtx;
    var T = tr.T;
    var size = c.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(3,6,16,0.85)";
    ctx.fillRect(0, 0, size, size);
    var pad = 4;
    var cell = (size - pad * 2) / T;
    var head = this.activeHead;
    var p = tr.player;
    var layer = tr.layers[Math.min(this.currentLayer, tr.layers.length - 1)];
    var mode = this.attnView;
    var scores = layer.scores;
    var weights = layer.weights;
    var minS = 1e6, maxS = -1e6, maxW = 1e-6;
    for (var i = 0; i < T; i++) for (var j = 0; j <= i; j++) {
      var sv = scores[(head * T + i) * T + j];
      if (sv < minS) minS = sv;
      if (sv > maxS) maxS = sv;
      maxW = Math.max(maxW, weights[(head * T + i) * T + j]);
    }
    for (var r = 0; r < T; r++) {
      for (var col = 0; col < T; col++) {
        var x = pad + col * cell, y = pad + r * cell;
        if (col > r) {
          ctx.fillStyle = mode === "mask" ? "rgba(141,123,255,0.16)" : "rgba(255,255,255,0.025)";
        } else if (mode === "mask") {
          ctx.fillStyle = "rgba(95,243,255,0.75)";
        } else if (mode === "scores") {
          var s = scores[(head * T + r) * T + col];
          var t = (s - minS) / (maxS - minS || 1);
          var cc = U.heatColor(0.08 + t * 0.9);
          ctx.fillStyle = "rgb(" + cc[0] + "," + cc[1] + "," + cc[2] + ")";
        } else {
          var w = weights[(head * T + r) * T + col] / maxW;
          var cc2 = U.heatColor(0.1 + Math.pow(w, 0.55) * 0.9);
          ctx.fillStyle = "rgb(" + cc2[0] + "," + cc2[1] + "," + cc2[2] + ")";
        }
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, cell - 1), Math.max(1, cell - 1));
      }
    }
    if (p < T) {
      ctx.strokeStyle = mode === "mask" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(pad, pad + p * cell, cell * T, cell);
    }
    ctx.strokeStyle = "rgba(95,243,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + T * cell);
    ctx.lineTo(pad + T * cell, pad);
    ctx.stroke();
    ctx.font = "9px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.75)";
    ctx.fillText(mode === "scores" ? "score" : mode === "mask" ? "mask" : "α", pad + 3, size - 7);
    ctx.textAlign = "right";
    ctx.fillText("H" + (head + 1), size - 4, size - 7);
    ctx.textAlign = "left";
  };

  UI.prototype.tick = function (state) {
    this.lastState = state;
    this.phaseT = state.phaseT || 0;
    this.currentLayer = state.layer === undefined ? this.currentLayer : state.layer;
    this.stage = state.stage || this.stage;
    this.phase = state.phase || this.phase;
    this.updatePhaseBar();
    this.el.progressBar.style.width = Math.round((state.progress || 0) * 100) + "%";
    var now = performance.now();
    if (!this._lastMetrics || now - this._lastMetrics > 120) {
      this._lastMetrics = now;
      this.updateMetrics();
      this.drawVectorStrip();
      this.drawNormSpark();
    }
    this.updateContinue();
    this.updateResonance(state.resonance || 0);
    if (this.panelKind && this.panelKind !== "codex" && this.panelKind !== "help" && this.panelKind !== "help") {
      if (now - this.lastDraw > 380) { this.lastDraw = now; this.renderPanel(); }
    }
  };

  /* ── panels ────────────────────────────────────────────────────────── */

  UI.prototype.setTabs = function (tabs, active) {
    var self = this;
    this.el.panelTabs.innerHTML = "";
    for (var i = 0; i < tabs.length; i++) {
      var b = document.createElement("button");
      b.className = "panel-tab" + (tabs[i].id === active ? " active" : "");
      b.dataset.tab = tabs[i].id;
      b.textContent = tabs[i].label;
      this.el.panelTabs.appendChild(b);
    }
  };

  UI.prototype.openPanel = function (kind, tab) {
    this.panelKind = kind;
    this.panelTab = tab || (kind === "math" ? "vector" : kind === "weights" ? "q" : null);
    this.el.panel.classList.remove("hidden");
    this.renderPanel();
  };

  UI.prototype.closePanel = function () {
    this.panelKind = null;
    this.el.panel.classList.add("hidden");
  };

  UI.prototype.togglePanel = function (kind) {
    if (this.panelKind === kind) this.closePanel();
    else this.openPanel(kind);
  };

  UI.prototype.renderPanel = function () {
    var kind = this.panelKind;
    if (!kind) return;
    var scroll = this.el.panelBody ? this.el.panelBody.scrollTop : 0;
    if (kind === "math") {
      var tabs = [
        { id: "vector", label: "Vector" }, { id: "attention", label: "Attention" },
        { id: "ffn", label: "FFN" }, { id: "residual", label: "Residual" }, { id: "logits", label: "Logits" },
      ];
      this.el.panelTitle.textContent = "MATH MONITOR";
      this.setTabs(tabs, this.panelTab);
      this.renderMathPanel(this.panelTab);
    } else if (kind === "weights") {
      var wtabs = [
        { id: "q", label: "W_Q" }, { id: "k", label: "W_K" }, { id: "v", label: "W_V" }, { id: "o", label: "W_O" },
        { id: "w1", label: "W₁" }, { id: "w2", label: "W₂" }, { id: "ln", label: "LN" },
      ];
      this.el.panelTitle.textContent = "WEIGHTS";
      this.setTabs(wtabs, this.panelTab);
      this.renderWeightsPanel(this.panelTab);
    } else if (kind === "dims") {
      this.el.panelTitle.textContent = "DIMENSIONS";
      this.setTabs([{ id: "dims", label: "128-d" }], "dims");
      this.renderDimsPanel();
    } else if (kind === "codex") {
      this.el.panelTitle.textContent = "CODEX";
      this.setTabs([{ id: "codex", label: "Math & sources" }], "codex");
      this.renderCodex();
    } else if (kind === "help") {
      this.el.panelTitle.textContent = "HOW IT WORKS";
      this.setTabs([{ id: "help", label: "Controls & concepts" }], "help");
      this.renderHelp();
    } else if (kind === "inspect") {
      this.el.panelTitle.textContent = "TOKEN INSPECTOR";
      this.setTabs([{ id: "inspect", label: "Token" }], "inspect");
      this.renderInspect(this.inspectIndex);
    }
    if (this.el.panelBody) this.el.panelBody.scrollTop = scroll;
  };

  UI.prototype.zeroPoint = function () {
    if (!this.trace) return null;
    var l = Math.min(this.currentLayer, this.trace.layers.length - 1);
    var p = this.trace.player;
    return { layer: this.trace.layers[l], l: l, p: p };
  };

  UI.prototype.renderMathPanel = function (tab) {
    var z = this.zeroPoint();
    if (!z) { this.el.panelBody.innerHTML = '<p class="muted">No trace yet.</p>'; return; }
    var layer = z.layer, p = z.p, l = z.l, tr = this.trace;
    var D = CFG.dModel, H = CFG.nHeads, T = tr.T;
    var body = this.el.panelBody;
    if (tab === "vector") {
      var x = [], ln = [];
      for (var d = 0; d < D; d++) { x.push(layer.xIn[p * D + d]); ln.push(layer.ln1[p * D + d]); }
      var nX = U.norm(x), nLn = U.norm(ln);
      var mean = U.mean(x), varr = U.variance(x, mean);
      var qh = [], kh = [], vh = [];
      for (var d2 = 0; d2 < CFG.dHead; d2++) {
        qh.push(layer.q[p * D + this.activeHead * CFG.dHead + d2]);
        kh.push(layer.k[p * D + this.activeHead * CFG.dHead + d2]);
        vh.push(layer.v[p * D + this.activeHead * CFG.dHead + d2]);
      }
      body.innerHTML = '<h3>Layer ' + (l + 1) + ' · the player vector</h3>' +
        '<p>This is the residual stream for <b>“' + esc(tr.tokens[p]) + '”</b> at position ' + p + '. The numbers below are the actual values used by the forward pass.</p>' +
        '<div class="eq">x_in        ‖x‖ = ' + U.fmt(nX) + '   mean = ' + U.fmt(mean) + '   σ² = ' + U.fmt(varr) + '\n' +
        'LN(x)       ‖·‖ = ' + U.fmt(nLn) + '   mean ≈ ' + U.fmt(U.mean(ln)) + '   σ² ≈ ' + U.fmt(U.variance(ln)) + '\n' +
        'Q head ' + (this.activeHead + 1) + '   ‖q‖ = ' + U.fmt(U.norm(qh)) + '\n' +
        'K head ' + (this.activeHead + 1) + '   ‖k‖ = ' + U.fmt(U.norm(kh)) + '\n' +
        'V head ' + (this.activeHead + 1) + '   ‖v‖ = ' + U.fmt(U.norm(vh)) + '</div>' +
        '<h4>residual vector · 128 dimensions</h4>' +
        '<div class="dim-grid" id="math-dims"></div>' +
        '<div class="legend"><span><i class="swatch" style="background:#ff4fd8"></i>negative</span><span><i class="swatch" style="background:#0a1020"></i>zero</span><span><i class="swatch" style="background:#5ff3ff"></i>positive</span></div>' +
        '<h4>LayerNorm, dimension by dimension</h4>' +
        '<canvas id="ln-before-after" class="big-canvas" width="560" height="150"></canvas>' +
        '<p class="muted">Top: the raw residual x_in. Bottom: LN(x_in) = γ ⊙ (x−μ)/√(σ²+ε) + β. The lens and the residual-stream bars show the same transform; the residual stream itself is not changed.</p>' +
        '<h4>head subspaces</h4>' +
        '<table><tr><th>head</th><th>dims</th><th>‖q‖</th><th>‖k‖</th><th>‖v‖</th></tr>';
      for (var h = 0; h < H; h++) {
        var q = [], k = [], v = [];
        for (var d3 = 0; d3 < CFG.dHead; d3++) {
          q.push(layer.q[p * D + h * CFG.dHead + d3]);
          k.push(layer.k[p * D + h * CFG.dHead + d3]);
          v.push(layer.v[p * D + h * CFG.dHead + d3]);
        }
        body.innerHTML += '<tr><td>H' + (h + 1) + ' · ' + CFG.HEAD_NAMES[h] + '</td><td>' + (h * CFG.dHead) + '–' + ((h + 1) * CFG.dHead - 1) + '</td><td>' + U.fmt(U.norm(q)) + '</td><td>' + U.fmt(U.norm(k)) + '</td><td>' + U.fmt(U.norm(v)) + '</td></tr>';
      }
      body.innerHTML += '</table>';
      this.fillDimGrid("math-dims", x);
      this.drawLNBars("ln-before-after", x, ln);
    } else if (tab === "attention") {
      var scores = layer.scores;
      body.innerHTML = '<h3>Attention · head ' + (this.activeHead + 1) + ' · ' + CFG.HEAD_NAMES[this.activeHead] + '</h3>' +
        '<p>Every past token gets a score from the dot product of the player\'s query with that token\'s key. The causal mask sets future scores to −∞. Softmax normalizes the remaining scores into a budget of attention.</p>' +
        '<div class="eq">s_j = (q · k_j) / √' + CFG.dHead + '\nα_j = exp(s_j − max) / Σ_i exp(s_i − max)\nz = Σ_j α_j · v_j</div>' +
        '<h4>player row · exact numbers</h4>' +
        '<table><tr><th>j</th><th>token</th><th>score</th><th>α</th><th>‖v_j‖</th><th>‖α_j·v_j‖</th><th>α bar</th></tr>';
      var maxW = 1e-6;
      var sumA = 0, futureMax = 0;
      for (var jm = 0; jm <= p; jm++) { maxW = Math.max(maxW, layer.weights[(this.activeHead * T + p) * T + jm]); sumA += layer.weights[(this.activeHead * T + p) * T + jm]; }
      for (var jf = p + 1; jf < T; jf++) futureMax = Math.max(futureMax, Math.abs(layer.weights[(this.activeHead * T + p) * T + jf]));
      for (var j2 = 0; j2 < T; j2++) {
        var w = j2 <= p ? layer.weights[(this.activeHead * T + p) * T + j2] : 0;
        var sc = j2 <= p ? scores[(this.activeHead * T + p) * T + j2] : null;
        var vn = 0;
        for (var vd = 0; vd < CFG.dHead; vd++) {
          var vv = layer.v[j2 * CFG.dModel + this.activeHead * CFG.dHead + vd];
          vn += vv * vv;
        }
        vn = Math.sqrt(vn);
        var bar = "";
        var bars = Math.round((w / maxW) * 18);
        for (var b = 0; b < bars; b++) bar += "█";
        body.innerHTML += '<tr><td>' + j2 + '</td><td>' + esc(tr.tokens[j2]) + '</td><td>' + (sc === null ? "−∞" : U.fmt(sc, 3)) + '</td><td>' + U.pct(w, 2) + '</td><td>' + U.fmt(vn, 2) + '</td><td class="good">' + U.fmt(w * vn, 2) + '</td><td class="good">' + bar + '</td></tr>';
      }
      body.innerHTML += '</table>' +
        '<div class="eq">NUMERIC CHECKS · Σ α = ' + sumA.toFixed(9) + ' · max future α = ' + futureMax.toFixed(9) + ' · scores finite for j ≤ i' + '</div>' +
        '<h4>all four heads · softmax α</h4>' +
        '<canvas id="attn-all" class="big-canvas" width="560" height="560"></canvas>' +
        '<p class="muted">The same player row under all four heads. Each head owns a different 32-dimensional slice of the residual stream. The bright outline is the selected head; all four are always computed in parallel.</p>' +
        '<h4>the three matrices · one head</h4>' +
        '<div class="attn-matrix-row">' +
        '<div><div class="micro-label">raw scores · QKᵀ/√d</div><canvas id="attn-scores" class="big-canvas" width="300" height="300"></canvas></div>' +
        '<div><div class="micro-label">causal mask · allowed</div><canvas id="attn-mask" class="big-canvas" width="300" height="300"></canvas></div>' +
        '<div><div class="micro-label">softmax · α</div><canvas id="attn-alpha" class="big-canvas" width="300" height="300"></canvas></div>' +
        '</div>' +
        '<p class="muted">Rows are queries, columns are keys. The upper-right triangle is the future: −∞ before softmax, exactly 0 after. The player row is outlined in white. Hover the tables for the exact values.</p>' +
        '<h4>the weighted sum · z = Σ α_j v_j</h4>' +
        '<canvas id="mix-canvas" class="big-canvas" width="560" height="260"></canvas>' +
        '<p class="muted">Arrows are the value vectors v_j of the past tokens, scaled by their attention weight α_j and projected to 2D. Head-to-tail they sum to z. The white arrow is the resulting head output. The projection is only for the eye; the norm table above is exact in 32 dimensions.</p>';
      this.drawAllHeads("attn-all", layer, p, tr.T);
      this.drawAttnMatrix("attn-scores", layer, this.activeHead, p, tr.T, "scores");
      this.drawAttnMatrix("attn-mask", layer, this.activeHead, p, tr.T, "mask");
      this.drawAttnMatrix("attn-alpha", layer, this.activeHead, p, tr.T, "alpha");
      this.drawValueAddition("mix-canvas", layer, this.activeHead, p, tr.T);
    } else if (tab === "ffn") {
      var off = p * CFG.dFf;
      var act = [];
      for (var i = 0; i < CFG.dFf; i++) act.push({ i: i, pre: layer.hidden[off + i], post: layer.gelu[off + i] });
      act.sort(function (a, b) { return b.post - a.post; });
      var sum = 0;
      for (var i2 = 0; i2 < CFG.dFf; i2++) sum += layer.gelu[off + i2];
      body.innerHTML = '<h3>Feed-forward · 128 → 512 → 128</h3>' +
        '<p>The vector is lifted into a wider space, passed through GELU, and projected back. The 512 intermediate values are the neurons. The result is added to the residual stream.</p>' +
        '<div class="eq">h_pre = W₁ · LN(x) + b₁      h_pre ∈ ℝ^512\nh = GELU(h_pre)\ny = W₂ · h + b₂                y ∈ ℝ^128\nx ← x + y</div>' +
        '<h4>the actual flow · input → hidden → output</h4>' +
        '<canvas id="ffn-flow" class="big-canvas" width="600" height="300"></canvas>' +
        '<p class="muted">Left: the 128 values of LN(x). Middle: the top 20 hidden neurons, sized and coloured by their GELU activation. Right: the 128 output values y. The lines are the strongest W₁ and W₂ connections of the top 12 neurons.</p>' +
        '<h4>one neuron, opened</h4>' +
        '<canvas id="ffn-neuron" class="big-canvas" width="600" height="220"></canvas>' +
        '<p class="muted">The strongest neuron. Left: its 128 W₁ weights, the row that reads the input. Right: its 128 W₂ weights, the column that writes to the output. The neuron computes GELU(w₁ · LN(x) + b₁) and contributes that scalar times its W₂ column.</p>' +
        '<h4>top active neurons</h4>' +
        '<table><tr><th>neuron</th><th>pre-activation</th><th>GELU</th><th>share</th></tr>';
      for (var k = 0; k < 18; k++) {
        var share = sum ? (act[k].post / sum) * 100 : 0;
        body.innerHTML += '<tr><td>' + act[k].i + '</td><td>' + U.fmt(act[k].pre, 3) + '</td><td class="good">' + U.fmt(act[k].post, 3) + '</td><td>' + U.pct(share / 100, 1) + '</td></tr>';
      }
      body.innerHTML += '</table>' +
        '<div class="eq">Σ GELU = ' + U.fmt(sum, 2) + '   ·   max = ' + U.fmt(act[0].post, 3) + '   ·   active (>0) = ' + act.filter(function (a) { return a.post > 0.001; }).length + ' / ' + CFG.dFf + '</div>' +
        this.ffnChecks(layer, p) +
        '<p class="muted">GELU(x) = 0.5x(1 + tanh(√(2/π)(x + 0.044715x³))). The tanh form is the one GPT-2 uses; it is within a few thousandths of the exact erf form.</p>';
      this.drawFFNFlow("ffn-flow", layer, p);
      this.drawFFNNeuron("ffn-neuron", layer, p);
    } else if (tab === "residual") {
      var ledger = tr.ledger;
      body.innerHTML = '<h3>The residual ledger</h3>' +
        '<p>The residual stream is a sum. The initial embedding is written once; every attention head and every FFN writes by addition. This table is the player token\'s exact decomposition.</p>' +
        '<div class="eq">x_final = x₀ + Σ_l Σ_h head(l,h) + Σ_l attn_bias(l) + Σ_l ffn(l)</div>' +
        '<table><tr><th>write</th><th>kind</th><th>‖·‖</th><th>mean</th></tr>';
      var maxNorm = 1e-6;
      for (var li = 0; li < ledger.length; li++) maxNorm = Math.max(maxNorm, U.norm(ledger[li].vector));
      for (var li2 = 0; li2 < ledger.length; li2++) {
        var item = ledger[li2];
        var nn = U.norm(item.vector);
        var bars = Math.round((nn / maxNorm) * 18);
        var bar2 = "";
        for (var bb = 0; bb < bars; bb++) bar2 += "▮";
        body.innerHTML += '<tr><td>' + esc(item.label) + '</td><td>' + item.kind + '</td><td>' + U.fmt(nn, 2) + '</td><td class="good">' + bar2 + '</td></tr>';
      }
      body.innerHTML += '</table>' +
        '<div class="eq">Σ ledger = ' + U.fmt(U.norm(tr.playerResidual), 2) + '   ·   max reconstruction error = ' + U.fmt(tr.ledgerError, 6) + '</div>' +
        '<p class="muted">Because every write is additive, the stream never forgets an earlier contribution; later layers can read it but cannot erase it.</p>';
    } else if (tab === "logits") {
      var top = U.topK(tr.final.probs, 22);
      body.innerHTML = '<h3>Unembedding · the probability sky</h3>' +
        '<p>The final LayerNorm output is multiplied by the tied token-embedding matrix. The logits are scaled and passed through softmax. Temperature changes the sharpness of the distribution.</p>' +
        '<div class="eq">logits = E · LN(x₆) · ' + U.fmt(tr.final.logitScale, 2) + '\np = softmax(logits / T)</div>' +
        '<table><tr><th>#</th><th>token</th><th>logit</th><th>p</th><th>bar</th></tr>';
      for (var ti = 0; ti < top.length; ti++) {
        var t = top[ti];
        var bars2 = Math.round((t.value / (top[0].value || 1)) * 22);
        var bar3 = "";
        for (var b3 = 0; b3 < bars2; b3++) bar3 += "█";
        body.innerHTML += '<tr><td>' + (ti + 1) + '</td><td>' + esc(tr.vocab[t.index]) + '</td><td>' + U.fmt(tr.final.logits[t.index], 3) + '</td><td>' + U.pct(t.value, 2) + '</td><td class="good">' + bar3 + '</td></tr>';
      }
      body.innerHTML += '</table><p class="muted">This is a hand-built model: the attention and FFN weights are seeded, structured synthetic matrices, not a pretrained checkpoint. The arithmetic is exact; the text is not a trained continuation.</p>';
    }
  };

  UI.prototype.fillDimGrid = function (id, vec) {
    var el = document.getElementById(id);
    if (!el) return;
    var max = 1e-6;
    for (var i = 0; i < vec.length; i++) max = Math.max(max, Math.abs(vec[i]));
    var html = "";
    for (var d = 0; d < vec.length; d++) {
      var v = vec[d] / max;
      var t = v >= 0 ? 0.45 + Math.abs(v) * 0.55 : 0.45 - Math.abs(v) * 0.55;
      var c = U.heatColor(t);
      html += '<div class="dim-cell" title="dim ' + d + ' = ' + U.fmt(vec[d], 4) + '" style="background:rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')"></div>';
    }
    el.innerHTML = html;
  };

  UI.prototype.drawAttentionBig = function (id, weights, head, p, T) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height, pad = 8;
    var cell = (w - pad * 2) / T;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var max = 1e-6;
    for (var i = 0; i < T; i++) for (var j = 0; j <= i; j++) max = Math.max(max, weights[(head * T + i) * T + j]);
    for (var r = 0; r < T; r++) {
      for (var col = 0; col < T; col++) {
        var x = pad + col * cell, y = pad + r * cell;
        if (col > r) ctx.fillStyle = "#05070e";
        else {
          var v = weights[(head * T + r) * T + col] / max;
          var cc = U.heatColor(0.08 + Math.pow(v, 0.5) * 0.92);
          ctx.fillStyle = "rgb(" + cc[0] + "," + cc[1] + "," + cc[2] + ")";
        }
        ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad + p * cell, cell * T, cell);
    ctx.strokeStyle = "rgba(95,243,255,0.25)";
    ctx.beginPath(); ctx.moveTo(pad, pad + T * cell); ctx.lineTo(pad + T * cell, pad); ctx.stroke();
  };

  UI.prototype.drawLNBars = function (id, x, ln) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    function maxAbs(a) { var m = 1e-6; for (var i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i])); return m; }
    var m1 = maxAbs(x), m2 = maxAbs(ln);
    function row(arr, m, y0, label) {
      var bw = w / arr.length;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath(); ctx.moveTo(0, y0 + 30); ctx.lineTo(w, y0 + 30); ctx.stroke();
      for (var i = 0; i < arr.length; i++) {
        var v = arr[i] / m;
        var bh = Math.abs(v) * 26;
        ctx.fillStyle = v >= 0 ? "rgba(95,243,255,0.82)" : "rgba(255,79,216,0.82)";
        ctx.fillRect(i * bw, v >= 0 ? y0 + 30 - bh : y0 + 30, Math.max(1, bw - 0.5), Math.max(1, bh));
      }
      ctx.fillStyle = "rgba(233,243,255,0.65)";
      ctx.font = "8px 'SF Mono', monospace";
      ctx.fillText(label, 4, y0 + 10);
    }
    row(x, m1, 8, "x_in · raw residual");
    row(ln, m2, 82, "LN(x_in) · mean 0, variance 1");
  };

  UI.prototype.drawAllHeads = function (id, layer, p, T) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var gap = 12, panelW = (w - gap) / 2, panelH = (h - gap) / 2;
    for (var head = 0; head < CFG.nHeads; head++) {
      var ox = (head % 2) * (panelW + gap), oy = Math.floor(head / 2) * (panelH + gap);
      var pad = 24, cell = (panelW - pad * 2) / T;
      var maxW = 1e-6;
      for (var i = 0; i < T; i++) for (var j = 0; j <= i; j++) maxW = Math.max(maxW, layer.weights[(head * T + i) * T + j]);
      for (var r = 0; r < T; r++) {
        for (var col = 0; col < T; col++) {
          var x = ox + pad + col * cell, y = oy + pad + r * cell;
          if (col > r) ctx.fillStyle = "#05070e";
          else {
            var ww = layer.weights[(head * T + r) * T + col] / maxW;
            var cc = U.heatColor(0.08 + Math.pow(ww, 0.5) * 0.92);
            ctx.fillStyle = "rgb(" + cc[0] + "," + cc[1] + "," + cc[2] + ")";
          }
          ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, cell - 0.6), Math.max(1, cell - 0.6));
        }
      }
      ctx.strokeStyle = head === this.activeHead ? CFG.HEAD_CSS[head] : "rgba(255,255,255,0.12)";
      ctx.lineWidth = head === this.activeHead ? 2 : 1;
      ctx.strokeRect(ox + 0.5, oy + 0.5, panelW - 1, panelH - 1);
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + pad, oy + pad + p * cell, cell * T, cell);
      ctx.fillStyle = CFG.HEAD_CSS[head];
      ctx.font = "600 11px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("H" + (head + 1) + " · " + CFG.HEAD_NAMES[head], ox + pad, oy + 16);
    }
  };

  UI.prototype.drawAttnMatrix = function (id, layer, head, p, T, mode) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height, pad = 46;
    var cell = (w - pad * 2) / T;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var minS = 1e6, maxS = -1e6, maxW = 1e-6;
    for (var i = 0; i < T; i++) for (var j = 0; j <= i; j++) {
      var sv = layer.scores[(head * T + i) * T + j];
      if (sv < minS) minS = sv;
      if (sv > maxS) maxS = sv;
      maxW = Math.max(maxW, layer.weights[(head * T + i) * T + j]);
    }
    for (var r = 0; r < T; r++) {
      for (var col = 0; col < T; col++) {
        var x = pad + col * cell, y = pad + r * cell;
        if (col > r) {
          ctx.fillStyle = mode === "mask" ? "rgba(141,123,255,0.22)" : "#05070e";
        } else if (mode === "mask") {
          ctx.fillStyle = "rgba(95,243,255,0.78)";
        } else if (mode === "scores") {
          var s = layer.scores[(head * T + r) * T + col];
          var t = (s - minS) / (maxS - minS || 1);
          var cc = U.heatColor(0.08 + t * 0.92);
          ctx.fillStyle = "rgb(" + cc[0] + "," + cc[1] + "," + cc[2] + ")";
        } else {
          var ww = layer.weights[(head * T + r) * T + col] / maxW;
          var cc2 = U.heatColor(0.08 + Math.pow(ww, 0.5) * 0.92);
          ctx.fillStyle = "rgb(" + cc2[0] + "," + cc2[1] + "," + cc2[2] + ")";
        }
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, cell - 1), Math.max(1, cell - 1));
      }
    }
    // Row/column token labels.
    ctx.font = "8px 'SF Mono', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(233,243,255,0.62)";
    for (var rl = 0; rl < T; rl++) {
      var txt = this.trace.tokens[rl];
      if (txt.length > 8) txt = txt.slice(0, 7) + "…";
      ctx.fillStyle = rl === p ? "#ffffff" : "rgba(233,243,255,0.55)";
      ctx.fillText(txt, pad - 4, pad + rl * cell + cell / 2);
    }
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (var cl = 0; cl < T; cl++) {
      var t2 = this.trace.tokens[cl];
      if (t2.length > 8) t2 = t2.slice(0, 7) + "…";
      ctx.save();
      ctx.translate(pad + cl * cell + cell / 2, pad - 4);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "rgba(233,243,255,0.55)";
      ctx.fillText(t2, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad + p * cell, cell * T, cell);
    ctx.strokeStyle = "rgba(95,243,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + T * cell);
    ctx.lineTo(pad + T * cell, pad);
    ctx.stroke();
    ctx.fillStyle = "rgba(233,243,255,0.5)";
    ctx.font = "9px 'SF Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("query ↓", 4, h - 6);
    ctx.textAlign = "right";
    ctx.fillText("key →", w - 4, h - 6);
  };

  UI.prototype.linearProj = function (vec, head) {
    var x = 0, y = 0;
    for (var d = 0; d < CFG.dHead; d++) {
      var v = vec[head * CFG.dHead + d];
      var a = (d + 1) * 2.399963;
      x += v * Math.cos(a);
      y += v * Math.sin(a * 1.13);
    }
    return [x, y];
  };

  UI.prototype.arrow = function (ctx, x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width || 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1);
    var s = 6;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4));
    ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  };

  UI.prototype.drawValueAddition = function (id, layer, head, p, T) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var items = [];
    for (var j = 0; j <= p; j++) {
      var a = layer.weights[(head * T + p) * T + j];
      if (a < 0.004) continue;
      var v = [];
      for (var d = 0; d < CFG.dHead; d++) v.push(layer.v[j * CFG.dModel + head * CFG.dHead + d]);
      var pr = this.linearProj(v, 0);
      items.push({ j: j, a: a, x: pr[0] * a, y: pr[1] * a });
    }
    items.sort(function (a, b) { return b.a - a.a; });
    items = items.slice(0, 6);
    var max = 1e-6;
    var sx = 0, sy = 0;
    for (var i = 0; i < items.length; i++) { sx += items[i].x; sy += items[i].y; max = Math.max(max, Math.abs(items[i].x), Math.abs(items[i].y)); }
    var scale = Math.min((w * 0.36) / (max || 1), (h * 0.7) / (max || 1));
    var ox = 60, oy = h / 2;
    var cx = ox, cy = oy;
    var colors = ["#ffc857", "#5ff3ff", "#ff4fd8", "#6bffb0", "#8d7bff", "#ffb36b"];
    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var nx = cx + it.x * scale;
      var ny = cy - it.y * scale;
      this.arrow(ctx, cx, cy, nx, ny, colors[k % colors.length], 1.4 + it.a * 2.2);
      ctx.fillStyle = colors[k % colors.length];
      ctx.font = "9px 'SF Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(this.trace.tokens[it.j] + "  " + (it.a * 100).toFixed(1) + "%", nx + 5, ny - 4);
      cx = nx; cy = ny;
    }
    this.arrow(ctx, ox, oy, cx, cy, "#ffffff", 2.4);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("z = Σ α·v", 14, 20);
    ctx.fillStyle = "rgba(233,243,255,0.5)";
    ctx.font = "9px 'SF Mono', monospace";
    ctx.fillText("2D projection of the 32-d head vectors", 14, 35);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.moveTo(w - 10, 10); ctx.lineTo(w - 10, h - 10); ctx.stroke();
  };

  UI.prototype.ffnChecks = function (layer, p) {
    var wl = this.model.W.layers[Math.min(this.currentLayer, CFG.nLayers - 1)];
    var D = CFG.dModel, F = CFG.dFf, off = p * D, foff = p * F;
    var pre = new Float64Array(F), gelu = new Float64Array(F), y = new Float64Array(D);
    var maxPre = 0, maxGelu = 0, maxY = 0, maxRes = 0;
    for (var n = 0; n < F; n++) {
      var s = wl.b1[n];
      for (var d = 0; d < D; d++) s += wl.w1[n * D + d] * layer.ln2[off + d];
      pre[n] = s;
      gelu[n] = U.gelu(s);
      maxPre = Math.max(maxPre, Math.abs(pre[n] - layer.hidden[foff + n]));
      maxGelu = Math.max(maxGelu, Math.abs(gelu[n] - layer.gelu[foff + n]));
    }
    for (var o = 0; o < D; o++) {
      var sy = wl.b2[o];
      for (var n2 = 0; n2 < F; n2++) sy += wl.w2[o * F + n2] * gelu[n2];
      y[o] = sy;
      maxY = Math.max(maxY, Math.abs(y[o] - layer.ffnOut[off + o]));
      maxRes = Math.max(maxRes, Math.abs((layer.xMid[off + o] + y[o]) - layer.xOut[off + o]));
    }
    return '<div class="eq">NUMERIC CHECKS · max|W₁m+b₁ − trace| = ' + U.fmt(maxPre, 8) +
      ' · max|GELU − trace| = ' + U.fmt(maxGelu, 8) +
      ' · max|W₂h+b₂ − trace| = ' + U.fmt(maxY, 8) +
      ' · max|(x_mid+y) − x_out| = ' + U.fmt(maxRes, 8) + '</div>';
  };

  UI.prototype.drawFFNFlow = function (id, layer, p) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var D = CFG.dModel, F = CFG.dFf, off = p * D, foff = p * F;
    var wl = this.model.W.layers[Math.min(this.currentLayer, CFG.nLayers - 1)];
    var input = [], output = [];
    var maxI = 1e-6, maxO = 1e-6;
    for (var d = 0; d < D; d++) {
      input.push(layer.ln2[off + d]);
      output.push(layer.ffnOut[off + d]);
      maxI = Math.max(maxI, Math.abs(layer.ln2[off + d]));
      maxO = Math.max(maxO, Math.abs(layer.ffnOut[off + d]));
    }
    var top = [];
    for (var n = 0; n < F; n++) top.push({ n: n, a: layer.gelu[foff + n], pre: layer.hidden[foff + n] });
    top.sort(function (a, b) { return b.a - a.a; });
    var topN = top.slice(0, 20);
    var maxA = topN[0].a || 1;
    var topY = 38, botY = h - 22;
    function yAt(i, count) { return topY + (i / Math.max(1, count - 1)) * (botY - topY); }
    var xIn = 50, xH = w / 2, xOut = w - 50;
    // connections (behind)
    for (var k = 0; k < Math.min(12, topN.length); k++) {
      var nn = topN[k].n;
      var bestIn = 0, bestInW = 0;
      for (var di = 0; di < D; di++) { var ww1 = Math.abs(wl.w1[nn * D + di]); if (ww1 > bestInW) { bestInW = ww1; bestIn = di; } }
      var bestOut = 0, bestOutW = 0;
      for (var do_ = 0; do_ < D; do_++) { var ww2 = Math.abs(wl.w2[do_ * F + nn]); if (ww2 > bestOutW) { bestOutW = ww2; bestOut = do_; } }
      var a = topN[k].a / maxA;
      var col = "rgba(255,200,87," + (0.12 + a * 0.55) + ")";
      ctx.strokeStyle = col;
      ctx.lineWidth = 0.7 + a * 1.4;
      ctx.beginPath();
      ctx.moveTo(xIn + 24, yAt(bestIn, D));
      ctx.lineTo(xH, yAt(k, topN.length));
      ctx.lineTo(xOut - 24, yAt(bestOut, D));
      ctx.stroke();
    }
    // input bars
    for (var ii = 0; ii < D; ii++) {
      var v = input[ii] / maxI;
      var bh = Math.max(1, Math.abs(v) * 14);
      ctx.fillStyle = v >= 0 ? "rgba(95,243,255,0.8)" : "rgba(255,79,216,0.8)";
      ctx.fillRect(xIn - Math.abs(v) * 24, yAt(ii, D) - bh / 2, Math.max(1, Math.abs(v) * 24), bh);
    }
    // hidden neurons
    for (var kk = 0; kk < topN.length; kk++) {
      var a2 = topN[kk].a / maxA;
      var r = 2 + a2 * 7;
      var col2 = U.heatColor(0.3 + a2 * 0.7);
      ctx.fillStyle = "rgb(" + col2[0] + "," + col2[1] + "," + col2[2] + ")";
      ctx.beginPath(); ctx.arc(xH, yAt(kk, topN.length), r, 0, Math.PI * 2); ctx.fill();
      if (kk < 6) {
        ctx.fillStyle = "rgba(255,200,87,0.9)";
        ctx.font = "8px 'SF Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText("#" + topN[kk].n, xH + r + 3, yAt(kk, topN.length) + 3);
      }
    }
    // output bars
    for (var oo = 0; oo < D; oo++) {
      var vo = output[oo] / maxO;
      var bh2 = Math.max(1, Math.abs(vo) * 14);
      ctx.fillStyle = vo >= 0 ? "rgba(255,200,87,0.85)" : "rgba(141,123,255,0.85)";
      ctx.fillRect(xOut, yAt(oo, D) - bh2 / 2, Math.max(1, Math.abs(vo) * 24), bh2);
    }
    ctx.fillStyle = "rgba(233,243,255,0.75)";
    ctx.font = "600 10px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LN(x) · 128", xIn, 18);
    ctx.fillText("512 hidden · top 20", xH, 18);
    ctx.fillText("y · 128", xOut, 18);
    ctx.fillStyle = "rgba(233,243,255,0.45)";
    ctx.font = "8px 'SF Mono', monospace";
    ctx.fillText("strongest W₁ / W₂ connections of the top 12 neurons", xH, h - 6);
  };

  UI.prototype.drawFFNNeuron = function (id, layer, p) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var D = CFG.dModel, F = CFG.dFf, foff = p * F;
    var wl = this.model.W.layers[Math.min(this.currentLayer, CFG.nLayers - 1)];
    var best = 0, bestA = -1;
    for (var n = 0; n < F; n++) { if (layer.gelu[foff + n] > bestA) { bestA = layer.gelu[foff + n]; best = n; } }
    var half = w / 2;
    var maxW1 = 1e-6, maxW2 = 1e-6;
    for (var d = 0; d < D; d++) { maxW1 = Math.max(maxW1, Math.abs(wl.w1[best * D + d])); maxW2 = Math.max(maxW2, Math.abs(wl.w2[d * F + best])); }
    // W1 row
    for (var i = 0; i < D; i++) {
      var v = wl.w1[best * D + i] / maxW1;
      var x = 20 + (i / D) * (half - 40);
      var bh = Math.abs(v) * (h - 70);
      ctx.fillStyle = v >= 0 ? "rgba(95,243,255,0.8)" : "rgba(255,79,216,0.8)";
      ctx.fillRect(x, h / 2 - bh / 2, Math.max(1, (half - 40) / D - 0.5), bh);
    }
    // W2 column
    for (var o = 0; o < D; o++) {
      var v2 = wl.w2[o * F + best] / maxW2;
      var x2 = half + 20 + (o / D) * (half - 40);
      var bh2 = Math.abs(v2) * (h - 70);
      ctx.fillStyle = v2 >= 0 ? "rgba(255,200,87,0.8)" : "rgba(141,123,255,0.8)";
      ctx.fillRect(x2, h / 2 - bh2 / 2, Math.max(1, (half - 40) / D - 0.5), bh2);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.fillStyle = "rgba(233,243,255,0.8)";
    ctx.font = "600 10px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("neuron #" + best + " · W₁ row · reads the input", 14, 18);
    ctx.textAlign = "right";
    ctx.fillText("W₂ column · writes to the output", w - 14, 18);
    ctx.textAlign = "center";
    ctx.font = "8px 'SF Mono', monospace";
    ctx.fillStyle = "rgba(233,243,255,0.5)";
    ctx.fillText("pre " + U.fmt(layer.hidden[foff + best], 3) + "   ·   GELU " + U.fmt(layer.gelu[foff + best], 3) + "   ·   GELU(w₁·LN(x)+b₁) × W₂[:,n] is this neuron's write", w / 2, h - 6);
  };

  UI.prototype.renderWeightsPanel = function (tab) {
    if (!this.model) { this.el.panelBody.innerHTML = '<p class="muted">Model not ready.</p>'; return; }
    var l = Math.min(this.currentLayer, CFG.nLayers - 1);
    var layer = this.model.W.layers[l];
    var D = CFG.dModel;
    var name = tab, W = null, rows = 0, cols = 0, title = "";
    if (tab === "q") { W = layer.wq; rows = D; cols = D; title = "W_Q"; }
    else if (tab === "k") { W = layer.wk; rows = D; cols = D; title = "W_K"; }
    else if (tab === "v") { W = layer.wv; rows = D; cols = D; title = "W_V"; }
    else if (tab === "o") { W = layer.wo; rows = D; cols = D; title = "W_O"; }
    else if (tab === "w1") { W = layer.w1; rows = CFG.dFf; cols = D; title = "W₁"; }
    else if (tab === "w2") { W = layer.w2; rows = D; cols = CFG.dFf; title = "W₂"; }
    if (tab === "ln") {
      var g = layer.ln1Gamma, b = layer.ln1Beta;
      this.el.panelBody.innerHTML = '<h3>LayerNorm ' + (l + 1) + '</h3><p>Pre-LN normalizes each token vector before attention and before the FFN. The learned gain γ and bias β are shown below.</p>' +
        '<div class="eq">LN(x) = γ ⊙ (x − μ)/√(σ² + ε) + β\nε = ' + CFG.lnEps + '</div>' +
        '<h4>γ</h4><canvas id="ln-g" class="big-canvas" width="560" height="90"></canvas>' +
        '<h4>β</h4><canvas id="ln-b" class="big-canvas" width="560" height="90"></canvas>';
      this.drawBars("ln-g", g, -0.1, 1.1);
      this.drawBars("ln-b", b, -0.1, 0.1);
      return;
    }
    var stats = this.matrixStats(W, rows, cols);
    this.el.panelBody.innerHTML = '<h3>' + title + ' · layer ' + (l + 1) + '</h3>' +
      '<p>These are the actual weights used in the forward pass. The matrix is ' + rows + ' × ' + cols + '. Each head owns a 32-dimensional slice of the 128-dimensional residual stream; the rotations within each slice are seeded and orthogonal.</p>' +
      '<div class="weight-stats"><span>min <b>' + U.fmt(stats.min, 3) + '</b></span><span>max <b>' + U.fmt(stats.max, 3) + '</b></span><span>mean <b>' + U.fmt(stats.mean, 4) + '</b></span><span>std <b>' + U.fmt(stats.std, 4) + '</b></span><span>‖W‖<sub>F</sub> <b>' + U.fmt(stats.norm, 2) + '</b></span></div>' +
      '<canvas id="weight-canvas" class="big-canvas" width="600" height="300"></canvas>' +
      '<div id="weight-hover" class="eq">hover the matrix to read a cell</div>';
    this.drawMatrix("weight-canvas", W, rows, cols, stats.maxAbs);
    this.bindWeightHover("weight-canvas", W, rows, cols);
  };

  UI.prototype.matrixStats = function (W, rows, cols) {
    var min = Infinity, max = -Infinity, sum = 0, sum2 = 0, norm = 0, maxAbs = 1e-6;
    for (var i = 0; i < W.length; i++) {
      var v = W[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v; sum2 += v * v; norm += v * v;
      if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
    }
    var n = W.length;
    var mean = sum / n;
    return { min: min, max: max, mean: mean, std: Math.sqrt(sum2 / n - mean * mean), norm: Math.sqrt(norm), maxAbs: maxAbs };
  };

  UI.prototype.drawMatrix = function (id, W, rows, cols, maxAbs) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    var cw = w / cols, ch = h / rows;
    for (var r = 0; r < rows; r++) {
      for (var col = 0; col < cols; col++) {
        var v = W[r * cols + col] / maxAbs;
        var t = v >= 0 ? 0.5 + Math.pow(v, 0.55) * 0.5 : 0.5 - Math.pow(-v, 0.55) * 0.5;
        var cc = U.heatColor(t);
        ctx.fillStyle = "rgb(" + cc[0] + "," + cc[1] + "," + cc[2] + ")";
        ctx.fillRect(col * cw, r * ch, Math.max(1, cw), Math.max(1, ch));
      }
    }
  };

  UI.prototype.bindWeightHover = function (id, W, rows, cols) {
    var c = document.getElementById(id);
    var out = document.getElementById("weight-hover");
    if (!c || !out) return;
    c.onmousemove = function (e) {
      var rect = c.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var col = Math.min(cols - 1, Math.floor(x * cols));
      var row = Math.min(rows - 1, Math.floor(y * rows));
      var v = W[row * cols + col];
      out.textContent = "W[" + row + "][" + col + "] = " + U.fmt(v, 6) + "   ·   row " + row + " is an output dimension, column " + col + " is an input dimension";
    };
    c.onmouseleave = function () { out.textContent = "hover the matrix to read a cell"; };
  };

  UI.prototype.drawBars = function (id, arr, min, max) {
    var c = document.getElementById(id);
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#02040a"; ctx.fillRect(0, 0, w, h);
    var n = arr.length, bw = w / n;
    var mid = h / 2;
    for (var i = 0; i < n; i++) {
      var v = (arr[i] - min) / (max - min);
      var bh = Math.max(1, Math.abs(v - 0.5) * h);
      ctx.fillStyle = v >= 0.5 ? "rgba(95,243,255,0.85)" : "rgba(255,79,216,0.85)";
      ctx.fillRect(i * bw, v >= 0.5 ? mid - bh : mid, Math.max(1, bw - 0.5), bh);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
  };

  UI.prototype.renderDimsPanel = function () {
    var z = this.zeroPoint();
    if (!z) { this.el.panelBody.innerHTML = '<p class="muted">No trace yet.</p>'; return; }
    var vec = [];
    for (var d = 0; d < CFG.dModel; d++) vec.push(z.layer.xOut[z.p * CFG.dModel + d]);
    var max = 1e-6, sum = 0;
    for (var i = 0; i < vec.length; i++) { max = Math.max(max, Math.abs(vec[i])); sum += vec[i]; }
    var mean = sum / vec.length;
    var varr = 0;
    for (var i2 = 0; i2 < vec.length; i2++) varr += (vec[i2] - mean) * (vec[i2] - mean);
    varr /= vec.length;
    var top = vec.map(function (v, i) { return { i: i, v: v }; }).sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); }).slice(0, 16);
    this.el.panelBody.innerHTML = '<h3>The 128-dimensional present</h3>' +
      '<p>This is the player token\'s residual state after layer ' + (z.l + 1) + '. Every cell is one dimension. The vector is exactly 128 numbers; the 3D world shows a projection, but the numbers here are complete.</p>' +
      '<div class="eq">‖x‖ = ' + U.fmt(U.norm(vec), 3) + '   mean = ' + U.fmt(mean, 3) + '   σ = ' + U.fmt(Math.sqrt(varr), 3) + '   max|x| = ' + U.fmt(max, 3) + '</div>' +
      '<div class="dim-grid" id="dims-grid"></div>' +
      '<div class="legend"><span><i class="swatch" style="background:#ff4fd8"></i>negative</span><span><i class="swatch" style="background:#0a1020"></i>zero</span><span><i class="swatch" style="background:#5ff3ff"></i>positive</span></div>' +
      '<h4>largest dimensions</h4><table><tr><th>dim</th><th>value</th><th>bar</th></tr>';
    for (var k = 0; k < top.length; k++) {
      var bars = Math.round((Math.abs(top[k].v) / max) * 18);
      var bar = "";
      for (var b = 0; b < bars; b++) bar += "▮";
      this.el.panelBody.innerHTML += '<tr><td>' + top[k].i + '</td><td>' + U.fmt(top[k].v, 4) + '</td><td class="good">' + bar + '</td></tr>';
    }
    this.el.panelBody.innerHTML += '</table>';
    this.fillDimGrid("dims-grid", vec);
  };

  UI.prototype.renderInspect = function (index) {
    var tr = this.trace;
    if (!tr || index === undefined) { this.el.panelBody.innerHTML = '<p class="muted">Click a token in the scene.</p>'; return; }
    var l = Math.min(this.currentLayer, tr.layers.length - 1);
    var layer = tr.layers[l], p = tr.player, T = tr.T, D = CFG.dModel;
    var role = index === p ? "player" : index < p ? "past" : "future";
    var w = index <= p ? layer.weights[(this.activeHead * T + p) * T + index] : 0;
    var x = [], k = [], v = [];
    for (var d = 0; d < D; d++) x.push(layer.xOut[index * D + d]);
    for (var d2 = 0; d2 < CFG.dHead; d2++) {
      k.push(layer.k[index * D + this.activeHead * CFG.dHead + d2]);
      v.push(layer.v[index * D + this.activeHead * CFG.dHead + d2]);
    }
    this.el.panelBody.innerHTML = '<h3>“' + esc(tr.tokens[index]) + '” · position ' + index + '</h3>' +
      '<div class="eq">role        ' + role + '\ntoken id    ' + tr.ids[index] + '\n‖x_out‖     ' + U.fmt(U.norm(x), 3) + '\nattention α ' + (index > p ? "masked (future)" : U.pct(w, 3)) + '\n‖k_head‖    ' + U.fmt(U.norm(k), 3) + '\n‖v_head‖    ' + U.fmt(U.norm(v), 3) + '</div>' +
      '<p>' + (index > p
        ? 'This token lies in the future. The causal mask subtracts infinity from its score, so its attention weight is exactly zero. You can see it, but you cannot attend to it.'
        : index === p
          ? 'This is you. Self-attention lets the token read its own value vector; the weight is part of the same softmax budget.'
          : 'This token is in the past. Its value vector is mixed into yours in proportion to α. Its key is compared with your query; its value is what you receive.') + '</p>' +
      '<h4>its 128-dimensional state</h4><div class="dim-grid" id="inspect-dims"></div>';
    this.fillDimGrid("inspect-dims", x);
  };

  UI.prototype.renderHelp = function () {
    this.el.panelBody.innerHTML = '<h3>How to move</h3>' +
      '<ul>' +
      '<li><kbd>drag</kbd> look around in first person. The camera stays on the player token.</li>' +
      '<li><kbd>V</kbd> orbit view: pull back and circle the current token.</li>' +
      '<li><kbd>1</kbd>–<kbd>4</kbd> switch attention head. The beams and panels follow.</li>' +
      '<li><kbd>SPACE</kbd> pause or resume the cinematic timeline.</li>' +
      '<li><kbd>N</kbd> jump to the next phase. <kbd>R</kbd> replay.</li>' +
      '<li><kbd>M</kbd> math monitor · <kbd>W</kbd> weight inspector · <kbd>D</kbd> dimension inspector · <kbd>C</kbd> codex.</li>' +
      '<li><kbd>Q</kbd> cycle quality. <kbd>S</kbd> sound. <kbd>ESC</kbd> close this panel.</li>' +
      '</ul>' +
      '<h3>What you are seeing</h3>' +
      '<p>Each gold token is in your past and can be attended to. Each violet token is in your future and is masked. The beams are the attention weights of the selected head. The central pillar is the residual stream. The FFN chamber is the wide 512-dimensional hidden layer.</p>' +
      '<p>The 3D positions of token vectors are a PCA projection. Similarity is the angle between the full 128-dimensional directions, measured by the cosine: a small angle means similar, not Euclidean nearness. The numbers in the monitors are the full values. The equations are the ones the code actually evaluates.</p>';
  };

  UI.prototype.renderCodex = function () {
    this.el.panelBody.innerHTML = '<h3>What is actually running</h3>' +
      '<p>This is a decoder-only transformer with pre-LayerNorm, four causal attention heads, GELU feed-forward layers, and a tied unembedding. It has 6 layers, d_model = 128, d_head = 32, d_ff = 512, and a 258-token vocabulary. The forward pass is exact JavaScript arithmetic: every number in the monitors is the value used by the model.</p>' +
      '<p>The token directions are a PCA projection of real model2vec <i>potion-base-8M</i> static embeddings. The attention and MLP weights are seeded, structured synthetic matrices built for interpretability: each head owns a 32-dimensional slice of the residual stream and uses orthogonal rotations of that slice. The unembedding is tied to the token embedding. No pretrained transformer checkpoint is used. The <b>arithmetic</b> is exact; the <b>language</b> is not a trained continuation.</p>' +
      '<h4>0 · It is all directions</h4>' +
      '<div class="eq">cos θ(a,b) = (a · b)/(‖a‖‖b‖)\nsmall angle  ⇔  large cosine  ⇔  similar direction</div>' +
      '<p>A token embedding is a direction in 128-dimensional space. The residual stream is a sum of directions. Attention mixes value directions. The FFN bends the direction through a 512-dimensional hidden space and back. The game\'s 3D clouds are PCA projections of these directions: they are maps for the eye. The exact similarity is the angle between the full 128-dimensional vectors, shown as <b>cos θ</b> in the embedding list. Visual nearness in the projection is only a hint; the angle is the truth.</p>' +
      '<h4>1 · The residual stream</h4>' +
      '<div class="eq">x_i⁰ = E[token_i] + P_i\nx_i^{l+1} = x_i^l + Attn^l(LN(x_i^l)) + MLP^l(LN(·))</div>' +
      '<p>The residual stream is additive. Attention and the MLP read from it and write into it, but they never replace it. The ledger panel shows the decomposition for the player token; the reconstruction error is near machine precision.</p>' +
      '<h4>2 · Causal self-attention</h4>' +
      '<div class="eq">a_i = LN(x_i)\nq_i = W_Q a_i,  k_i = W_K a_i,  v_i = W_V a_i\ns_ij = (q_i · k_j) / √d_head,  j ≤ i\nα_ij = softmax_j(s_ij)\nz_i = Σ_j α_ij v_j\nattn_i = W_O z_i + b_O</div>' +
      '<p>The mask is the only arrow of time. A token at position i can read positions 0…i, never i+1…T−1. The upper-right triangle of the attention matrix is exactly zero. Multi-head attention splits the 128-dimensional vector into four 32-dimensional subspaces and concatenates the four outputs before W_O.</p>' +
      '<h4>3 · LayerNorm</h4>' +
      '<div class="eq">μ = (1/d) Σ x_i\nσ² = (1/d) Σ (x_i − μ)²\nLN(x) = γ ⊙ (x − μ)/√(σ² + ε) + β</div>' +
      '<p>Pre-LN is applied before attention and before the FFN. It removes the scale of the residual stream while keeping its direction, so each sublayer sees a well-conditioned vector even as the stream grows.</p>' +
      '<h4>4 · The feed-forward layer</h4>' +
      '<div class="eq">h = GELU(W₁ · LN(x) + b₁),   h ∈ ℝ^512\ny = W₂ · h + b₂,               y ∈ ℝ^128\nx ← x + y</div>' +
      '<p>GELU is a smooth gate. The tanh approximation used here is the one in GPT-2: 0.5x(1 + tanh(√(2/π)(x + 0.044715x³))). The hidden layer is four times wider than the residual stream. In a trained model, these neurons often respond to features rather than single dimensions; this model shows the exact activation pattern it computes.</p>' +
      '<h4>5 · Unembedding and sampling</h4>' +
      '<div class="eq">logits = E · LN(x_L) · s\np = softmax(logits / T)</div>' +
      '<p>The token-embedding matrix is reused as the unembedding (weight tying). Temperature T scales the logits: low T sharpens the sky, high T flattens it. The game offers the top-k tokens; choosing one appends it to the sequence and runs a new forward pass.</p>' +
      '<h4>6 · What is projected</h4>' +
      '<p>The 3D scene cannot show 128 axes directly. Token constellations and vector glyphs use a PCA projection of the actual vectors. The monitors show the full values; the projection is a guide for the eye, not a replacement for the numbers.</p>' +
      '<h4>Sources</h4>' +
      '<p class="codex-sources">' +
      'Vaswani et al., <i>Attention Is All You Need</i> (2017). <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener">arXiv:1706.03762</a><br>' +
      'Elhage et al., <i>A Mathematical Framework for Transformer Circuits</i> (2021). <a href="https://transformer-circuits.pub/2021/framework/index.html" target="_blank" rel="noopener">transformer-circuits.pub</a><br>' +
      'Ba, Kiros & Hinton, <i>Layer Normalization</i> (2016). <a href="https://arxiv.org/abs/1607.06450" target="_blank" rel="noopener">arXiv:1607.06450</a><br>' +
      'Hendrycks & Gimpel, <i>Gaussian Error Linear Units (GELUs)</i> (2016). <a href="https://arxiv.org/abs/1606.08415" target="_blank" rel="noopener">arXiv:1606.08415</a><br>' +
      'Radford et al., <i>Language Models are Unsupervised Multitask Learners</i> (2019). <a href="https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" target="_blank" rel="noopener">GPT-2 paper</a><br>' +
      'model2vec / potion-base-8M, the source of the static token directions. <a href="https://huggingface.co/minishlab/potion-base-8M" target="_blank" rel="noopener">Hugging Face</a>' +
      '</p>';
  };

  UI.prototype.showEpilogue = function (title, text, token) {
    this.el.epilogue.classList.remove("hidden");
    this.el.epilogueTitle.textContent = title;
    this.el.epilogueText.textContent = text;
    this.el.epilogueToken.textContent = token;
    this.el.hud.classList.add("hud-hidden");
  };

  UI.prototype.hideEpilogue = function () {
    this.el.epilogue.classList.add("hidden");
    this.el.hud.classList.remove("hud-hidden");
  };

  TEGO.UI = UI;
})(typeof globalThis !== "undefined" ? globalThis : this);
