/* TOKEN / EGO — a tiny generative score. Web Audio only, no files. */
(function (root) {
  "use strict";
  var TEGO = (root.TEGO = root.TEGO || {});

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.ready = false;
    this.muted = false;
    this.pad = null;
    this.drone = null;
    this.noise = null;
    this.base = 55;
  }

  AudioEngine.prototype.init = function () {
    if (this.ready) return true;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
    } catch (e) {
      return false;
    }
    var ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.0;

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(3.4, 2.6);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.28;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);

    this.dry = ctx.createGain();
    this.dry.gain.value = 0.8;
    this.dry.connect(this.master);

    this.buildDrone();
    this.buildPad();
    this.noise = this.makeNoise(2.0);

    this.ready = true;
    this.fadeMaster(0.22, 2.0);
    return true;
  };

  AudioEngine.prototype.makeImpulse = function (seconds, decay) {
    var ctx = this.ctx;
    var rate = ctx.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var data = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  };

  AudioEngine.prototype.makeNoise = function (seconds) {
    var ctx = this.ctx;
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  };

  AudioEngine.prototype.buildDrone = function () {
    var ctx = this.ctx;
    var g = ctx.createGain();
    g.gain.value = 0.0;
    var filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 240;
    filt.Q.value = 0.7;
    var o1 = ctx.createOscillator();
    var o2 = ctx.createOscillator();
    var o3 = ctx.createOscillator();
    o1.type = "sine"; o1.frequency.value = this.base;
    o2.type = "triangle"; o2.frequency.value = this.base * 1.5 + 0.12;
    o3.type = "sine"; o3.frequency.value = this.base * 0.5;
    var g2 = ctx.createGain(); g2.gain.value = 0.35;
    var g3 = ctx.createGain(); g3.gain.value = 0.22;
    o1.connect(filt);
    o2.connect(g2); g2.connect(filt);
    o3.connect(g3); g3.connect(filt);
    filt.connect(g);
    g.connect(this.dry);
    g.connect(this.reverb);
    o1.start(); o2.start(); o3.start();
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    lfo.frequency.value = 0.035;
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(filt.frequency);
    lfo.start();
    this.drone = { gain: g, filter: filt, o1: o1, o2: o2, o3: o3, lfo: lfo };
    g.gain.setTargetAtTime(0.085, ctx.currentTime, 2.0);
  };

  AudioEngine.prototype.buildPad = function () {
    var ctx = this.ctx;
    var g = ctx.createGain();
    g.gain.value = 0.0;
    var filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 1200;
    filt.Q.value = 0.4;
    var freqs = [220, 277.18, 329.63, 440];
    var oscs = [];
    for (var i = 0; i < freqs.length; i++) {
      var o = ctx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = freqs[i];
      o.detune.value = (i - 1.5) * 7;
      var og = ctx.createGain();
      og.gain.value = 0.10 / (i + 1);
      o.connect(og);
      og.connect(filt);
      o.start();
      oscs.push(o);
    }
    filt.connect(g);
    g.connect(this.dry);
    g.connect(this.reverb);
    var lfo = ctx.createOscillator();
    var lg = ctx.createGain();
    lfo.frequency.value = 0.06;
    lg.gain.value = 0.012;
    lfo.connect(lg);
    lg.connect(g.gain);
    lfo.start();
    g.gain.setTargetAtTime(0.035, ctx.currentTime, 3.0);
    this.pad = { gain: g, filter: filt, oscs: oscs, lfo: lfo };
  };

  AudioEngine.prototype.fadeMaster = function (value, time) {
    if (!this.ready) return;
    var now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.muted ? 0 : value, now, time || 0.3);
  };

  AudioEngine.prototype.setMuted = function (m) {
    this.muted = !!m;
    if (this.ready) this.fadeMaster(this.muted ? 0 : 0.22, 0.35);
  };

  AudioEngine.prototype.resume = function () {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  };

  AudioEngine.prototype.ping = function (freq, gain, pan, type) {
    if (!this.ready || this.muted) return;
    var ctx = this.ctx;
    var now = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.82), now + 1.6);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.03), now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    if (p) {
      p.pan.value = pan === undefined ? 0 : Math.max(-1, Math.min(1, pan));
      o.connect(g); g.connect(p); p.connect(this.dry); p.connect(this.reverb);
    } else {
      o.connect(g); g.connect(this.dry); g.connect(this.reverb);
    }
    o.start(now);
    o.stop(now + 2.3);
  };

  AudioEngine.prototype.whoosh = function (gain, dur) {
    if (!this.ready || this.muted || !this.noise) return;
    var ctx = this.ctx;
    var now = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = this.noise;
    var filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.Q.value = 1.2;
    filt.frequency.setValueAtTime(160, now);
    filt.frequency.exponentialRampToValueAtTime(2200, now + (dur || 0.8));
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.02), now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (dur || 0.8));
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(filt); filt.connect(g);
    if (pan) { pan.pan.value = -0.25; g.connect(pan); pan.connect(this.dry); pan.connect(this.reverb); }
    else { g.connect(this.dry); g.connect(this.reverb); }
    src.start(now);
    src.stop(now + (dur || 0.8) + 0.05);
  };

  AudioEngine.prototype.chord = function (freqs, gain) {
    for (var i = 0; i < freqs.length; i++) {
      this.ping(freqs[i], gain || 0.025, (i - (freqs.length - 1) / 2) * 0.35, "sine");
    }
  };

  AudioEngine.prototype.setLayer = function (l) {
    if (!this.ready) return;
    var now = this.ctx.currentTime;
    var base = 55 * Math.pow(2, (l || 0) / 12);
    this.base = base;
    if (this.drone) {
      this.drone.o1.frequency.setTargetAtTime(base, now, 0.8);
      this.drone.o2.frequency.setTargetAtTime(base * 1.5 + 0.12, now, 0.8);
      this.drone.o3.frequency.setTargetAtTime(base * 0.5, now, 0.8);
      this.drone.filter.frequency.setTargetAtTime(180 + (l || 0) * 42, now, 0.8);
    }
    if (this.pad) {
      var freqs = [220, 277.18, 329.63, 440];
      for (var i = 0; i < this.pad.oscs.length; i++) {
        this.pad.oscs[i].frequency.setTargetAtTime(freqs[i] * Math.pow(2, (l || 0) / 12 / 2), now, 1.0);
      }
      this.pad.filter.frequency.setTargetAtTime(900 + (l || 0) * 110, now, 1.0);
    }
  };

  AudioEngine.prototype.cue = function (kind, data) {
    if (!this.ready || this.muted) return;
    if (kind === "start") {
      this.whoosh(0.025, 1.2);
      this.chord([110, 164.81, 220], 0.02);
    } else if (kind === "tokenize") {
      this.ping(880, 0.018, -0.2, "triangle");
    } else if (kind === "embed") {
      this.chord([220, 277.18, 329.63, 440], 0.016);
    } else if (kind === "ln") {
      this.ping(1320, 0.012, 0, "sine");
    } else if (kind === "qkv") {
      this.ping(440, 0.016, -0.4, "triangle");
      this.ping(660, 0.012, 0.4, "sine");
    } else if (kind === "attn") {
      var weights = data && data.weights;
      if (weights) {
        var idx = [];
        for (var i = 0; i < weights.length; i++) if (weights[i] > 0.03) idx.push([i, weights[i]]);
        idx.sort(function (a, b) { return b[1] - a[1]; });
        for (var k = 0; k < Math.min(6, idx.length); k++) {
          var t = idx[k];
          var f = 330 * Math.pow(2, (t[0] % 12) / 12);
          this.ping(f, 0.010 + t[1] * 0.022, (t[0] / Math.max(1, weights.length)) * 1.6 - 0.8, k % 2 ? "sine" : "triangle");
        }
      }
    } else if (kind === "mix") {
      this.whoosh(0.018, 1.3);
    } else if (kind === "ffn") {
      this.whoosh(0.02, 1.8);
      this.ping(110, 0.018, 0, "sine");
    } else if (kind === "final") {
      this.chord([261.63, 329.63, 392, 523.25], 0.02);
      this.whoosh(0.016, 1.6);
    } else if (kind === "epilogue") {
      this.chord([130.81, 196, 261.63], 0.022);
    } else if (kind === "choose") {
      this.ping(1046.5, 0.02, 0, "sine");
    }
  };

  TEGO.AudioEngine = AudioEngine;
})(typeof globalThis !== "undefined" ? globalThis : this);
