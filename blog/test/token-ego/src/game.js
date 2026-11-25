/* TOKEN / EGO — the director, input, and game loop. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});
  var U = TEGO.U;
  var CFG = TEGO.CFG;

  function Game() {
    this.model = null;
    this.scene = null;
    this.ui = null;
    this.audio = null;
    this.lastTime = 0;
    this.finalTimer = null;
    this.dragging = false;
    this.down = { x: 0, y: 0, t: 0, moved: 0, lastX: 0, lastY: 0 };
    this.flashTimer = null;
    this.state = {
      promptIndex: 0,
      playerIndex: TEGO.PROMPTS[0].player,
      sequence: TEGO.PROMPTS[0].tokens.slice(),
      trace: null,
      stage: "intro",
      layer: 0,
      phase: "intro",
      phaseT: 0,
      beatIndex: 0,
      beats: [],
      progress: 0,
      activeHead: 0,
      started: false,
      paused: false,
      auto: false,
      ended: false,
      awaitingChoice: false,
      finalReady: false,
      chosenId: null,
      chosenToken: null,
      finalProbs: null,
      temperature: 1,
      resonance: 0,
      challenge: null,
      overview: false,
      quality: "high",
      sound: true,
      orbit: false,
    };
    this._loop = this.loop.bind(this);
    this._onKey = this.onKey.bind(this);
    this._onResize = this.onResize.bind(this);
  }

  Game.prototype.boot = async function () {
    var self = this;
    try {
      var q = new URLSearchParams(root.location.search);
      if (q.has("mute")) this.state.sound = false;
      var pi = parseInt(q.get("prompt") || "0", 10);
      if (!isFinite(pi) || pi < 0 || pi >= TEGO.PROMPTS.length) pi = 0;
      var pr = TEGO.PROMPTS[pi];
      var player = q.has("player") ? parseInt(q.get("player"), 10) : pr.player;
      if (!isFinite(player) || player < 0 || player >= pr.tokens.length) player = pr.player;
      this.state.promptIndex = pi;
      this.state.playerIndex = player;
      this.state.sequence = pr.tokens.slice();

      this.ui = new TEGO.UI();
      this.actions = {
        selectPrompt: function (idx) { self.selectPrompt(idx); },
        selectPlayer: function (idx) { self.selectPlayer(idx); },
        setHead: function (h) { self.setHead(h); },
        start: function () { self.startJourney(); },
        toggleSound: function () { self.toggleSound(); },
        continueToken: function () { self.continueToken(); },
        replay: function () { self.replay(); },
        next: function () { self.nextBeat(); },
        toggleAuto: function () { self.toggleAuto(); },
        skipLayer: function () { self.skipLayer(); },
        jumpLayer: function (l) { self.jumpLayer(l); },
        setTemperature: function (t) { self.setTemperature(t); },
        inspectToken: function (i) { self.inspectToken(i); },
        deepDive: function () { self.openInternals(); },
        toggleOverview: function () { self.toggleOverview(); },
        guessAttention: function (i) { self.guessAttention(i); },
      };
      this.ui.init(this.actions);
      this.ui.setPrompt(pi, player);

      this.ui.setLoading("reading token directions…", 0.08);
      await sleep(20);
      this.model = TEGO.Model.create();
      this.ui.setModel(this.model);
      this.ui.setLoading("constructing 6 layers · 4 heads · 512-wide FFN…", 0.32);
      await sleep(20);
      this.ui.setLoading("running the first forward pass…", 0.52);
      await sleep(20);
      this.state.trace = this.model.run(this.state.sequence, this.state.playerIndex);
      this.state.finalProbs = this.state.trace.final.probs;
      this.ui.setTrace(this.state.trace);
      await sleep(20);

      this.ui.setLoading("building the tower…", 0.72);
      await sleep(20);
      this.scene = new TEGO.SceneRig(document.getElementById("gl"));
      this.scene.setModel(this.model);
      if (q.has("cleanffn")) {
        ["ffnW1Points","ffnW1Top","ffnW2Points","ffnW2Top","ffnEntry","ffnExit","ffnInputLabel","ffnW1Label","ffnHiddenLabel","ffnW2Label","ffnOutputLabel"].forEach(function (k) {
          if (self.scene[k]) self.scene[k].visible = false;
        });
      }
      this.ui.setLoading("lighting the residual stream…", 0.9);
      await sleep(20);
      this.scene.setTrace(this.state.trace);
      this.scene.setStage("intro", 0, "intro", 0);
      this.ui.setStage("intro", 0, "intro", 0);
      this.ui.setLoading("one last breath…", 1.0);
      await sleep(140);

      this.audio = new TEGO.AudioEngine();
      this.setupInput();
      this.ui.hideLoading();
      this.ui.showTitle();
      this.ui.setSound(this.state.sound);
      this.ui.setQuality(this.state.quality);
      this.state.beats = this.buildBeats();

      this.lastTime = performance.now();
      requestAnimationFrame(this._loop);

      root.__TEGO__ = {
        game: this,
        get scene() { return self.scene; },
        get ui() { return self.ui; },
        get model() { return self.model; },
        setBeat: function (i) { self.setBeat(i); },
        chooseToken: function (id) { self.chooseToken(id); },
        setHead: function (h) { self.setHead(h); },
        state: this.state,
      };

      // A small deterministic entry point for screenshots and debugging.
      if (q.has("autostart")) {
        this.startJourney();
        if (q.has("head")) this.setHead(parseInt(q.get("head"), 10) || 0);
        if (q.has("beat")) this.setBeat(parseInt(q.get("beat"), 10) || 0);
        if (q.has("paused")) this.state.paused = true;
      }
      if (q.has("orbit")) this.toggleOrbit();
      if (q.has("overview")) this.toggleOverview();
      if (q.has("guess")) {
        var gq = parseInt(q.get("guess"), 10);
        setTimeout(function () { self.guessAttention(isFinite(gq) ? gq : 0); }, 1200);
      }
      if (q.has("panel")) this.runPanelTour();
      if (q.has("finaltest")) this.runFinalTest();
      if (q.has("tour")) this.runTour();
      if (q.has("debugstate")) {
        setInterval(function () {
          var d = document.getElementById("error-debug");
          if (!d) return;
          d.textContent = JSON.stringify({
            stage: self.state.stage, layer: self.state.layer, phase: self.state.phase,
            beatIndex: self.state.beatIndex, beats: self.state.beats.length,
            next: self.state.beats[self.state.beatIndex + 1] || null,
            auto: self.state.auto, started: self.state.started, ended: self.state.ended,
            lastStateBeats: self.ui.lastState ? self.ui.lastState.beats.length : -1,
            lastStateBeat: self.ui.lastState ? self.ui.lastState.beatIndex : -1,
          });
        }, 400);
      }
    } catch (err) {
      console.error(err);
      if (this.ui) {
        this.ui.hideLoading();
        this.ui.showError("TOKEN/EGO could not start.\n\n" + (err && err.stack ? err.stack : String(err)));
      } else {
        var box = document.getElementById("error-box");
        box.classList.remove("hidden");
        box.textContent = String(err && err.stack ? err.stack : err);
      }
    }
  };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  Game.prototype.runFinalTest = function () {
    var self = this;
    this.state.paused = true;
    this.setBeat(this.state.beats.length - 1);
    setTimeout(function () {
      var top = U.topK(self.state.trace.final.probs, 1);
      self.chooseToken(top[0].index);
      setTimeout(function () {
        self.continueToken();
        setTimeout(function () {
          self.ui.openPanel("math", "residual");
          setTimeout(function () {
            document.title = "FINALTEST DONE";
          }, 500);
        }, 500);
      }, 500);
    }, 3000);
  };

  Game.prototype.runPanelTour = function () {
    var self = this;
    var tests = [
      ["math", "vector"], ["math", "attention"], ["math", "ffn"], ["math", "residual"], ["math", "logits"],
      ["weights", "q"], ["weights", "k"], ["weights", "v"], ["weights", "o"], ["weights", "w1"], ["weights", "w2"], ["weights", "ln"],
      ["dims", null], ["codex", null], ["help", null], ["inspect", null],
    ];
    if (this.ui && this.state.trace) this.ui.inspectIndex = this.state.trace.player;
    var i = 0;
    function step() {
      if (i >= tests.length) {
        self.ui.closePanel();
        document.title = "PANELS DONE";
        return;
      }
      var t = tests[i++];
      try {
        self.ui.openPanel(t[0], t[1]);
      } catch (err) {
        document.title = "PANEL ERROR " + t[0] + "/" + t[1];
        var d = document.getElementById("error-debug");
        if (d) d.textContent = (err && err.stack) ? err.stack : String(err);
        return;
      }
      if (i % 3 === 0 && self.state.trace) self.ui.setHead(i % CFG.nHeads);
      setTimeout(step, 90);
    }
    setTimeout(step, 140);
  };

  Game.prototype.runTour = function () {
    var self = this;
    this.state.paused = true;
    var beats = this.state.beats;
    var i = 0;
    function step() {
      if (i < beats.length) {
        self.setBeat(i++);
        if (i % 7 === 0) self.ui.setHead(i % CFG.nHeads);
        setTimeout(step, 70);
      } else {
        self.setBeat(beats.length - 1);
        setTimeout(function () {
          var top = U.topK(self.state.trace.final.probs, 1);
          self.chooseToken(top[0].index);
          setTimeout(function () {
            self.continueToken();
            setTimeout(function () {
              self.scene.setOrbit(true);
              self.ui.openPanel("math", "residual");
              setTimeout(function () {
                self.ui.closePanel();
                document.title = "TOUR DONE";
              }, 300);
            }, 300);
          }, 350);
        }, 2900);
      }
    }
    setTimeout(step, 120);
  };

  Game.prototype.buildBeats = function () {
    var b = [];
    b.push({ stage: "tokenize", duration: 5.6 });
    b.push({ stage: "embed_matrix", duration: 6.0 });
    b.push({ stage: "embed_space", duration: 9.0 });
    b.push({ stage: "embed_position", duration: 7.0 });
    for (var l = 0; l < CFG.nLayers; l++) {
      for (var p = 0; p < CFG.LAYER_PHASES.length; p++) {
        var ph = CFG.LAYER_PHASES[p];
        b.push({ stage: "layer", layer: l, phase: ph.id, duration: ph.duration });
      }
    }
    b.push({ stage: "final", duration: 7.0 });
    return b;
  };

  Game.prototype.firstLayerBeat = function () {
    for (var i = 0; i < this.state.beats.length; i++) if (this.state.beats[i].stage === "layer") return i;
    return 2;
  };

  Game.prototype.setBeat = function (i) {
    var beats = this.state.beats;
    if (!beats.length) return;
    i = U.clamp(i, 0, beats.length - 1);
    var prev = beats[this.state.beatIndex];
    var b = beats[i];
    this.state.beatIndex = i;
    this.state.phaseT = 0;
    this.state.stage = b.stage;
    this.state.layer = b.layer === undefined ? this.state.layer : b.layer;
    this.state.phase = b.phase || b.stage;
    this.state.awaitingChoice = false;
    this.state.finalReady = false;
    this.state.progress = i / beats.length;

    clearTimeout(this.finalTimer);

    var stageChanged = !prev || prev.stage !== b.stage || prev.layer !== b.layer;
    if (stageChanged) this.ui.flash(220);
    if (b.stage !== "layer" && this.state.overview) {
      this.state.overview = false;
      this.scene.overview = false;
      this.ui.setOverview(false);
    }

    this.scene.setStage(b.stage, this.state.layer, b.phase || b.stage, 0);
    this.ui.setStage(b.stage, this.state.layer, b.phase || b.stage, 0);
    this.ui.setTrace(this.state.trace);
    if (prev && prev.stage === "layer" && prev.phase === "write2" && b.stage === "layer" && b.layer > prev.layer) {
      this.state.resonance += 1;
      this.ui.updateResonance(this.state.resonance);
      this.audio.chord([261.63, 329.63, 392], 0.016);
      this.ui.toast("Layer " + (prev.layer + 1) + " complete · resonance +1", 1800);
    }
    if (b.stage === "layer" && b.phase === "attn") {
      this.startAttentionChallenge();
    } else {
      this.state.challenge = null;
      this.ui.hideChallenge();
    }

    if (b.stage === "layer") {
      this.audio.setLayer(this.state.layer);
      if (b.phase === "qkv") this.scene.updateQKV();
      if (b.phase === "ffn") this.scene.updateFFN();
      var cue = {
        ln1: "ln", qkv: "qkv", attn: "attn", mix: "mix",
        write: "mix", ffn: "ffn", write2: "ln",
      }[b.phase] || "ln";
      var payload = null;
      if (b.phase === "attn") {
        payload = { weights: TEGO.Model.getAttention(this.state.trace, this.state.layer, this.state.activeHead, this.state.trace.player) };
      }
      this.audio.cue(cue, payload);
    } else if (b.stage === "tokenize") {
      this.audio.cue("tokenize");
    } else if (b.stage === "embed_matrix" || b.stage === "embed_space" || b.stage === "embed_position") {
      this.audio.cue("embed");
      if (b.stage === "embed_space") this.audio.ping(880, 0.012, -0.3, "sine");
      if (b.stage === "embed_position") this.audio.chord([220, 329.63, 440], 0.014);
    } else if (b.stage === "final") {
      var self = this;
      this.state.finalProbs = U.softmax(this.state.trace.final.logits, this.state.temperature);
      if (this.scene.setSkyProbs) this.scene.setSkyProbs(this.state.finalProbs);
      if (this.ui.setTemperature) this.ui.setTemperature(this.state.temperature);
      this.audio.cue("final");
      this.finalTimer = setTimeout(function () {
        if (self.state.stage !== "final" || self.state.ended) return;
        self.state.finalReady = true;
        self.state.awaitingChoice = true;
        self.state.auto = false;
        self.ui.setCaption("Choose a next token: click a star in the probability sky, or press Enter for the top token.", "top-k from the actual softmax · temperature 1.0");
        self.ui.toast("The sky is live. Click a star, or press Enter for the top token.", 5200);
      }, 2600);
    }
  };

  Game.prototype.nextBeat = function () {
    if (this.state.ended) return;
    if (this.state.challenge && !this.state.challenge.guessed && this.state.stage === "layer" && this.state.phase === "attn") {
      this.revealChallenge();
      return;
    }
    if (this.state.awaitingChoice) {
      var probs = this.state.finalProbs || this.state.trace.final.probs;
      var top = U.topK(probs, 1);
      if (top.length) this.chooseToken(top[0].index);
      return;
    }
    var b = this.state.beats[this.state.beatIndex];
    if (!b) return;
    if (b.stage === "final") {
      this.state.awaitingChoice = true;
      this.state.finalReady = true;
      this.state.auto = false;
      this.ui.setCaption("Choose a next token: click a star in the probability sky, or press Enter for the top token.", "top-k from the actual softmax · temperature 1.0");
      return;
    }
    if (this.state.beatIndex + 1 >= this.state.beats.length) return;
    this.setBeat(this.state.beatIndex + 1);
  };

  Game.prototype.startJourney = function () {
    if (this.state.started) return;
    if (this.state.sound) {
      this.audio.init();
      this.audio.resume();
      this.audio.setMuted(false);
    }
    this.state.started = true;
    this.state.ended = false;
    this.state.paused = false;
    this.state.overview = false;
    this.state.chosenId = null;
    this.state.chosenToken = null;
    this.state.awaitingChoice = false;
    this.ui.hideTitle();
    this.ui.hideEpilogue();
    this.ui.flash(420);
    this.state.beats = this.buildBeats();
    this.setBeat(0);
    this.audio.cue("start");
  };

  Game.prototype.selectPrompt = function (pi) {
    if (this.state.started) return;
    pi = U.clamp(pi, 0, TEGO.PROMPTS.length - 1);
    var pr = TEGO.PROMPTS[pi];
    this.state.promptIndex = pi;
    this.state.playerIndex = pr.player;
    this.state.sequence = pr.tokens.slice();
    this.state.trace = this.model.run(this.state.sequence, this.state.playerIndex);
    this.state.finalProbs = this.state.trace.final.probs;
    this.scene.setTrace(this.state.trace);
    this.scene.setStage("intro", 0, "intro", 0);
    this.ui.setPrompt(pi, pr.player);
    this.ui.setTrace(this.state.trace);
    this.ui.setStage("intro", 0, "intro", 0);
  };

  Game.prototype.selectPlayer = function (idx) {
    if (this.state.started) return;
    if (idx < 0 || idx >= this.state.sequence.length) return;
    this.state.playerIndex = idx;
    this.state.trace = this.model.run(this.state.sequence, this.state.playerIndex);
    this.state.finalProbs = this.state.trace.final.probs;
    this.scene.setTrace(this.state.trace);
    this.scene.setStage("intro", 0, "intro", 0);
    this.ui.setPrompt(this.state.promptIndex, idx);
    this.ui.setTrace(this.state.trace);
    this.ui.setStage("intro", 0, "intro", 0);
  };

  Game.prototype.setHead = function (h) {
    h = U.clamp(h, 0, CFG.nHeads - 1);
    this.state.activeHead = h;
    this.scene.setActiveHead(h);
    this.ui.setHead(h);
    if (this.state.stage === "layer") {
      var w = TEGO.Model.getAttention(this.state.trace, this.state.layer, h, this.state.trace.player);
      this.audio.cue("attn", { weights: w });
    }
    this.ui.toast("Head " + (h + 1) + " · " + CFG.HEAD_NAMES[h], 1100);
    if (this.state.stage === "layer" && this.state.phase === "attn" && this.state.challenge && !this.state.challenge.guessed) {
      this.startAttentionChallenge();
    }
  };

  Game.prototype.startAttentionChallenge = function () {
    if (!this.state.trace || this.state.stage !== "layer" || this.state.phase !== "attn") return;
    var l = this.state.layer, h = this.state.activeHead;
    var T = this.state.trace.T, p = this.state.trace.player;
    var layer = this.state.trace.layers[l];
    var best = 0, bestA = -1;
    for (var j = 0; j <= p; j++) {
      var a = layer.weights[(h * T + p) * T + j];
      if (a > bestA) { bestA = a; best = j; }
    }
    this.state.challenge = { answer: best, guessed: false, correct: false, head: h, layer: l, pct: bestA };
    this.ui.showChallenge(this.state.trace, l, h);
  };

  Game.prototype.guessAttention = function (index) {
    var c = this.state.challenge;
    if (!c || c.guessed) return;
    c.guessed = true;
    c.correct = index === c.answer;
    if (c.correct) {
      this.state.resonance += 1;
      this.ui.updateResonance(this.state.resonance);
      this.audio.chord([523.25, 659.25, 783.99], 0.018);
      this.ui.toast("Correct · the beam and the budget agree. Resonance +1.", 1800);
    } else {
      this.audio.ping(220, 0.012, 0, "sine");
      this.ui.toast("Not quite. The brightest beam is the answer.", 1600);
    }
    this.ui.setChallengeResult(c.correct, c.answer, c.pct, index);
  };

  Game.prototype.revealChallenge = function () {
    var c = this.state.challenge;
    if (!c || c.guessed) return;
    c.guessed = true;
    c.correct = false;
    this.ui.setChallengeResult(false, c.answer, c.pct, undefined);
    this.ui.toast("The answer is highlighted. Continue again to advance.", 1600);
  };

  Game.prototype.chooseToken = function (id) {
    if (this.state.stage !== "final" || this.state.ended || id === undefined || id === null) return;
    if (!this.state.trace || !this.state.trace.final) return;
    this.state.chosenId = id;
    this.state.chosenToken = this.state.trace.vocab[id];
    this.state.resonance += 1;
    this.ui.updateResonance(this.state.resonance);
    this.state.ended = true;
    this.state.awaitingChoice = false;
    this.state.auto = false;
    clearTimeout(this.finalTimer);
    var p = (this.state.finalProbs ? this.state.finalProbs[id] : this.state.trace.final.probs[id]);
    this.scene.setStage("epilogue", CFG.nLayers - 1, "epilogue", 0);
    this.ui.setStage("epilogue", CFG.nLayers - 1, "epilogue", 0);
    this.ui.showEpilogue(
      "You were the wave.",
      "The model's next token is “" + this.state.chosenToken + "”, with probability " + U.pct(p, 2) + ". You were the token that made it possible. No memory was written; no gradient flowed. The weights stayed still.",
      "next token: “" + this.state.chosenToken + "” · p = " + U.pct(p, 2)
    );
    this.audio.cue("choose");
    this.ui.flash(320);
    this.audio.cue("epilogue");
  };

  Game.prototype.continueToken = function () {
    if (!this.state.chosenId && this.state.chosenId !== 0) return;
    var token = this.state.trace.vocab[this.state.chosenId];
    this.state.sequence.push(token);
    while (this.state.sequence.length > CFG.maxSeq) this.state.sequence.shift();
    this.state.playerIndex = this.state.sequence.length - 1;
    this.state.trace = this.model.run(this.state.sequence, this.state.playerIndex);
    this.state.finalProbs = this.state.trace.final.probs;
    this.scene.setTrace(this.state.trace);
    this.ui.setTrace(this.state.trace);
    this.ui.hideEpilogue();
    this.ui.flash(360);
    this.state.started = true;
    this.state.ended = false;
    this.state.paused = false;
    this.state.overview = false;
    this.state.chosenId = null;
    this.state.chosenToken = null;
    this.state.awaitingChoice = false;
    this.state.finalReady = false;
    this.state.beats = this.buildBeats();
    this.setBeat(this.firstLayerBeat());
    this.ui.toast("You are now token #" + this.state.playerIndex + ": “" + token + "”. The next forward pass begins.", 2800);
    this.audio.cue("start");
  };

  Game.prototype.replay = function () {
    clearTimeout(this.finalTimer);
    var pr = TEGO.PROMPTS[this.state.promptIndex];
    this.state.sequence = pr.tokens.slice();
    this.state.playerIndex = pr.player;
    this.state.trace = this.model.run(this.state.sequence, this.state.playerIndex);
    this.state.finalProbs = this.state.trace.final.probs;
    this.state.temperature = 1;
    this.ui.setTemperature(1);
    this.scene.setTrace(this.state.trace);
    this.scene.setStage("intro", 0, "intro", 0);
    this.ui.setTrace(this.state.trace);
    this.ui.setPrompt(this.state.promptIndex, this.state.playerIndex);
    this.ui.setStage("intro", 0, "intro", 0);
    this.ui.hideEpilogue();
    this.ui.showTitle();
    this.state.started = false;
    this.state.ended = false;
    this.state.paused = false;
    this.state.auto = false;
    this.state.chosenId = null;
    this.state.chosenToken = null;
    this.state.awaitingChoice = false;
    this.state.finalReady = false;
    this.state.beatIndex = 0;
    this.state.progress = 0;
    this.ui.flash(220);
  };

  Game.prototype.toggleAuto = function () {
    this.state.auto = !this.state.auto;
    this.ui.toast(this.state.auto ? "Auto-play on · the descent will advance by itself" : "Guided mode · press Space or Continue at each step", 1800);
    if (this.ui) this.ui.updateContinue();
  };

  Game.prototype.skipLayer = function () {
    if (!this.state.started || this.state.ended) return;
    var beats = this.state.beats;
    var currentLayer = this.state.stage === "layer" ? this.state.layer : -1;
    for (var i = this.state.beatIndex + 1; i < beats.length; i++) {
      if (beats[i].stage === "layer" && beats[i].layer > currentLayer && beats[i].phase === "ln1") {
        this.setBeat(i); this.ui.toast("Skipped to layer " + (beats[i].layer + 1), 1400); return;
      }
      if (beats[i].stage === "final") { this.setBeat(i); return; }
    }
    this.setBeat(beats.length - 1);
  };

  Game.prototype.jumpLayer = function (layer) {
    if (!this.state.started || this.state.ended) return;
    var beats = this.state.beats;
    for (var i = 0; i < beats.length; i++) {
      if (beats[i].stage === "layer" && beats[i].layer === layer && beats[i].phase === "ln1") {
        this.setBeat(i);
        this.ui.flash(220);
        return;
      }
    }
  };

  Game.prototype.openInternals = function () {
    var tab = "vector";
    if (this.state.stage === "layer") {
      if (this.state.phase === "attn" || this.state.phase === "mix" || this.state.phase === "write") tab = "attention";
      else if (this.state.phase === "ffn" || this.state.phase === "ffn_w1" || this.state.phase === "ffn_gelu" || this.state.phase === "ffn_w2") tab = "ffn";
      else if (this.state.phase === "ln1" || this.state.phase === "qkv") tab = "vector";
      else tab = "residual";
    } else if (this.state.stage === "final") {
      tab = "logits";
    } else if (this.state.stage === "embed_space" || this.state.stage === "embed_position") {
      tab = "vector";
    }
    this.state.paused = true;
    this.ui.openPanel("math", tab);
    this.ui.toast("Paused for the deep dive · P resumes", 1800);
  };

  Game.prototype.inspectToken = function (index) {
    if (!this.state.trace) return;
    this.ui.inspectIndex = index;
    this.ui.openPanel("inspect");
  };

  Game.prototype.setTemperature = function (t) {
    if (!this.state.trace || !this.state.trace.final) return;
    this.state.temperature = t;
    this.state.finalProbs = U.softmax(this.state.trace.final.logits, t);
    if (this.ui.setTemperature) this.ui.setTemperature(t);
    if (this.scene.setSkyProbs) this.scene.setSkyProbs(this.state.finalProbs);
    var self = this;
    clearTimeout(this._tempTimer);
    this._tempTimer = setTimeout(function () {
      if (self.scene.setSkyProbs) self.scene.setSkyProbs(self.state.finalProbs);
    }, 90);
  };

  Game.prototype.toggleOverview = function () {
    if (!this.state.started || this.state.ended) return;
    if (this.state.stage !== "layer") { this.ui.toast("All-at-once is a view of a transformer layer. Continue to a layer first.", 1800); return; }
    this.state.overview = !this.state.overview;
    this.scene.setOverview(this.state.overview);
    this.ui.setOverview(this.state.overview);
    this.ui.toast(this.state.overview ? "All at once · all four heads + the FFN chamber + the residual braid" : "Back to the stage view", 2200);
  };

  Game.prototype.togglePause = function () {
    if (!this.state.started || this.state.ended) return;
    this.state.paused = !this.state.paused;
    this.ui.toast(this.state.paused ? "Paused · drag to look, N to step" : "Resumed", 1400);
  };

  Game.prototype.toggleOrbit = function () {
    this.state.orbit = !this.state.orbit;
    this.scene.setOrbit(this.state.orbit);
    this.ui.toast(this.state.orbit ? "Orbit view · drag to circle, wheel to zoom" : "Ego view · you are the token", 1600);
  };

  Game.prototype.toggleSound = function () {
    this.state.sound = !this.state.sound;
    if (this.state.sound) {
      this.audio.init();
      this.audio.resume();
    }
    this.audio.setMuted(!this.state.sound);
    this.ui.setSound(this.state.sound);
    if (this.state.sound) this.audio.cue("tokenize");
  };

  Game.prototype.cycleQuality = function () {
    var order = ["low", "medium", "high"];
    var i = order.indexOf(this.state.quality);
    this.state.quality = order[(i + 1) % order.length];
    this.scene.setQuality(this.state.quality);
    this.ui.setQuality(this.state.quality);
    this.ui.toast("Quality: " + this.state.quality, 1400);
  };

  Game.prototype.handleClick = function (x, y) {
    if (this.state.stage === "final" && this.state.finalReady) {
      var pick = this.scene.pickSky(x, y);
      if (pick) { this.chooseToken(pick.index); return; }
    }
    if (this.state.stage === "layer") {
      var tok = this.scene.pickToken(x, y);
      if (tok) {
        if (this.state.challenge && !this.state.challenge.guessed && this.state.phase === "attn") {
          this.guessAttention(tok.index);
        } else {
          this.ui.inspectIndex = tok.index;
          this.ui.openPanel("inspect");
        }
      }
    }
  };

  Game.prototype.setupInput = function () {
    var self = this;
    var canvas = document.getElementById("gl");

    canvas.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      self.dragging = true;
      self.down.x = e.clientX;
      self.down.y = e.clientY;
      self.down.lastX = e.clientX;
      self.down.lastY = e.clientY;
      self.down.t = performance.now();
      self.down.moved = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });

    canvas.addEventListener("pointermove", function (e) {
      if (!self.dragging) return;
      var dx = e.clientX - self.down.lastX;
      var dy = e.clientY - self.down.lastY;
      self.down.lastX = e.clientX;
      self.down.lastY = e.clientY;
      self.down.moved += Math.abs(dx) + Math.abs(dy);
      self.scene.drag(dx, dy);
    });

    function endDrag(e) {
      if (!self.dragging) return;
      self.dragging = false;
      var dt = performance.now() - self.down.t;
      var moved = self.down.moved;
      if (dt < 520 && moved < 8) self.handleClick(e.clientX, e.clientY);
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", function () { self.dragging = false; });
    canvas.addEventListener("pointerleave", function () { self.dragging = false; });

    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.scene.wheel(e.deltaY);
    }, { passive: false });

    root.addEventListener("keydown", this._onKey);
    root.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", function () {
      self.lastTime = performance.now();
    });
  };

  Game.prototype.onResize = function () {
    if (this.scene) this.scene.resize();
  };

  Game.prototype.onKey = function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    var k = e.key;
    if (k === " " || k === "Spacebar") {
      e.preventDefault();
      this.nextBeat();
      return;
    }
    if (k === "p" || k === "P") { e.preventDefault(); this.togglePause(); return; }
    if (k === "n" || k === "N") { e.preventDefault(); this.nextBeat(); return; }
    if (k === "a" || k === "A") { e.preventDefault(); this.toggleAuto(); return; }
    if (k === "o" || k === "O") { e.preventDefault(); this.toggleOverview(); return; }
    if (k === "1" || k === "2" || k === "3" || k === "4") { this.setHead(parseInt(k, 10) - 1); return; }
    if (k === "m" || k === "M") { this.ui.togglePanel("math"); return; }
    if (k === "w" || k === "W") { this.ui.togglePanel("weights"); return; }
    if (k === "d" || k === "D") { this.ui.togglePanel("dims"); return; }
    if (k === "c" || k === "C") { this.ui.togglePanel("codex"); return; }
    if (k === "h" || k === "H" || k === "?") { this.ui.togglePanel("help"); return; }
    if (k === "v" || k === "V") { this.toggleOrbit(); return; }
    if (k === "q" || k === "Q") { this.cycleQuality(); return; }
    if (k === "s" || k === "S") { this.toggleSound(); return; }
    if (k === "r" || k === "R") { this.replay(); return; }
    if (k === "Escape") {
      if (this.ui.panelKind) this.ui.closePanel();
      else if (!document.getElementById("epilogue").classList.contains("hidden")) this.continueToken();
      return;
    }
    if (k === "Enter") {
      if (this.state.stage === "final" && this.state.finalReady && !this.state.ended) {
        var probs = this.state.finalProbs || this.state.trace.final.probs;
        var top = U.topK(probs, 1)[0];
        this.chooseToken(top.index);
      } else if (this.state.ended) {
        this.continueToken();
      } else {
        this.nextBeat();
      }
      return;
    }
  };

  Game.prototype.update = function (dt) {
    var s = this.state;
    var realDt = Math.min(0.05, dt);
    if (s.started && !s.paused && !s.ended) {
      var b = s.beats[s.beatIndex];
      if (b) {
        s.phaseT = Math.min(1, s.phaseT + realDt / (b.duration * (s.auto ? 2.8 : 1.0)));
        if (s.auto && s.phaseT >= 1) this.nextBeat();
      }
    }
    if (s.started && s.beats.length) {
      s.progress = Math.min(1, (s.beatIndex + Math.min(1, s.phaseT)) / s.beats.length);
    } else {
      s.progress = 0;
    }
    this.scene.update(realDt, s);
    this.ui.tick(s);
    this.scene.render();
  };

  Game.prototype.loop = function (now) {
    var dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (!document.hidden) this.update(dt);
    requestAnimationFrame(this._loop);
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      var game = new Game();
      root.__TEGO_GAME__ = game;
      game.boot();
    });
  }

  TEGO.Game = Game;
})(typeof globalThis !== "undefined" ? globalThis : this);
