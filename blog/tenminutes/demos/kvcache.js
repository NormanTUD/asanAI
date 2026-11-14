(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function kvcacheScene(root, api) {
    var DE = api.lang === "de";
    var el = document.createElement("div");
    el.className = "ls-kv-scene";
    el.innerHTML = '<div class="ls-kv-stage"><canvas class="ls-canvas" role="img"></canvas></div>' +
      '<div class="ls-scene-row"><label class="ls-range">' + (DE ? "Kontext" : "Context") + ' <input type="range" class="ls-kv-tokens" min="512" max="32768" step="512" value="4096"><output>4096</output></label>' +
        '<label class="ls-range">' + (DE ? "Schichten" : "Layers") + ' <input type="range" class="ls-kv-layers" min="12" max="96" step="4" value="32"><output>32</output></label>' +
        '<label class="ls-range">Heads <input type="range" class="ls-kv-heads" min="12" max="128" step="4" value="32"><output>32</output></label>' +
        '<label class="ls-range">Head-Dim <input type="range" class="ls-kv-dim" min="64" max="128" step="64" value="128"><output>128</output></label>' +
      '</div>' +
      '<div class="ls-kv-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-kv-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-kv-readout");
    var tokensEl = el.querySelector(".ls-kv-tokens");
    var layersEl = el.querySelector(".ls-kv-layers");
    var headsEl = el.querySelector(".ls-kv-heads");
    var dimEl = el.querySelector(".ls-kv-dim");
    var tokens = 4096, layers = 32, heads = 32, dim = 128, size = null, ctx = null;
    var C = api.colors();
    function gb(bytes) { return bytes / 1e9; }
    function cacheGB() { return gb(tokens * layers * heads * dim * 2 * 2); }
    function weightGB() { return 14; }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var w = size.w, h = size.h, pad = 28;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      var total = 24;
      var cache = cacheGB(), weights = weightGB();
      var y = h * 0.36;
      ctx.fillStyle = C.line; ctx.fillRect(pad, y, w - pad * 2, 26);
      var cw = Math.min(1, cache / total) * (w - pad * 2);
      var ww = Math.min(1, weights / total) * (w - pad * 2);
      ctx.save();
      ctx.beginPath(); ctx.rect(pad, y, w - pad * 2, 26); ctx.clip();
      ctx.fillStyle = C.green; ctx.fillRect(pad, y, ww, 26);
      ctx.fillStyle = C.gold; ctx.fillRect(pad + ww, y, cw, 26);
      ctx.restore();
      ctx.strokeStyle = C.lineStrong; ctx.strokeRect(pad, y, w - pad * 2, 26);
      ctx.fillStyle = C.ink; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif'; ctx.textAlign = "left";
      ctx.fillText(DE ? "24 GB GPU" : "24 GB GPU", pad, y - 14);
      ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
      ctx.fillStyle = C.green; ctx.fillText(DE ? "Gewichte " + weights.toFixed(1) + " GB" : "weights " + weights.toFixed(1) + " GB", pad, y + 44);
      ctx.fillStyle = C.gold; ctx.fillText("KV-Cache " + cache.toFixed(1) + " GB", pad + ww + 8, y + 44);
      var fits = cache + weights <= total;
      ctx.fillStyle = fits ? C.green : C.coral;
      ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
      ctx.fillText(fits ? (DE ? "passt" : "fits") : (DE ? "passt nicht" : "does not fit"), pad, h - 24);
      updateReadout();
    }
    function updateReadout() {
      var cache = cacheGB(), total = cache + weightGB();
      readout.innerHTML = '<span><b>KV</b> ' + cache.toFixed(1) + ' GB</span><span><b>' + (DE ? "Gewichte" : "weights") + '</b> ' + weightGB().toFixed(1) + ' GB</span><span><b>' + (DE ? "gesamt" : "total") + '</b> ' + total.toFixed(1) + ' GB / 24 GB</span>';
    }
    function sync() { tokens = parseInt(tokensEl.value, 10); layers = parseInt(layersEl.value, 10); heads = parseInt(headsEl.value, 10); dim = parseInt(dimEl.value, 10); [tokensEl,layersEl,headsEl,dimEl].forEach(function (x) { x.nextElementSibling.textContent = x.value; }); draw(); }
    [tokensEl,layersEl,headsEl,dimEl].forEach(function (x) { x.addEventListener("input", sync); });
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    resize();
    return { update: function () {}, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  core.register("kvcache", kvcacheScene);
})();
