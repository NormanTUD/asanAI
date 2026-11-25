(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function manifoldScene(root, api) {
    var DE = api.lang === "de";
    var V = window.LearnSysVisuals;
    var el = document.createElement("div");
    el.className = "ls-manifold-scene";
    el.innerHTML = '<div class="ls-dual-manifolds" data-tip="' + (DE ? "Zwei Punktwolken mit Vietoris–Rips-Kanten; ziehe zum Drehen und fahre über einen Punkt für sein Wort." : "Two point clouds with Vietoris–Rips edges; drag to rotate and hover a point for its word.") + '"><canvas class="ls-canvas" role="img" data-tip="' + (DE ? "Die englische und die japanische Wolke; die Ausrichtung wird besser, wenn sie sich decken." : "The English and Japanese clouds; alignment improves as they overlap.") + '"></canvas></div>' +
      '<p class="ls-vr-note" data-tip="' + (DE ? "Die Ausrichtung steigt, wenn die japanische Wolke auf der englischen liegt." : "Alignment rises as the Japanese cloud sits on the English one.") + '">' + (DE ? "Vietoris–Rips: Punkte sind verbunden, wenn ihr Abstand unter der Schwelle liegt. Drehe und verschiebe die japanische Wolke, bis sie auf der englischen liegt. Fahre über einen Punkt, um das Wort zu sehen." : "Vietoris–Rips: points are connected when their distance is below the threshold. Rotate and translate the Japanese cloud until it sits on the English one. Hover a point to see its word.") + '</p>' +
      '<div class="ls-manifold-controls">' +
        '<label class="ls-range" data-tip="' + (DE ? "Dreht die japanische Wolke um die senkrechte Achse." : "Yaw rotates the Japanese cloud around the vertical axis.") + '">' + (DE ? "Drehung" : "Yaw") + ' <input type="range" class="ls-manifold-rotate" min="-180" max="180" step="1" value="62"><output>62°</output></label>' +
        '<label class="ls-range" data-tip="' + (DE ? "Kippt die japanische Wolke um die Blickachse." : "Roll tilts the Japanese cloud around the viewing axis.") + '">' + (DE ? "Rotation" : "Roll") + ' <input type="range" class="ls-manifold-roll" min="-180" max="180" step="1" value="26"><output>26°</output></label>' +
        '<label class="ls-range" data-tip="' + (DE ? "Verschiebt die japanische Wolke auf die englische zu." : "Translation slides the Japanese cloud toward the English one.") + '">' + (DE ? "Verschiebung" : "Translation") + ' <input type="range" class="ls-manifold-shift" min="-0.2" max="2.4" step="0.01" value="1.8"><output>1.80</output></label>' +
        '<button type="button" class="ls-btn ls-btn--primary ls-btn--tiny ls-manifold-find" data-tip="' + (DE ? "Animiert die Wolke zur besten Ausrichtung." : "Animate the cloud to the best alignment.") + '">' + (DE ? "Übersetzung finden" : "Find translation") + '</button>' +
      '</div>' +
      '<div class="ls-manifold-readout" aria-live="polite" data-tip="' + (DE ? "Ausrichtung, aktuelle Drehung und Verschiebung sowie das überfahrene Wort." : "Alignment score, current rotation and translation, and the hovered word.") + '"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-dual-manifolds");
    var canvas = el.querySelector("canvas");
    var rotateEl = el.querySelector(".ls-manifold-rotate");
    var rotateOut = rotateEl.nextElementSibling;
    var rollEl = el.querySelector(".ls-manifold-roll");
    var rollOut = rollEl.nextElementSibling;
    var shiftEl = el.querySelector(".ls-manifold-shift");
    var shiftOut = shiftEl.nextElementSibling;
    var findBtn = el.querySelector(".ls-manifold-find");
    var readout = el.querySelector(".ls-manifold-readout");
    var C = api.colors();
    var size = null, ctx = null, yaw = -0.62, pitch = 0.44, zoom = 1, drag = null;
    var angle = 62, roll = 26, shift = 1.8;
    var found = false, finding = false, findRaf = 0;
    var hover = null;
    var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var N = 7, COUNT = N * N;
    var PAIRS = [
      ["bank", "銀行"], ["river", "川"], ["money", "お金"], ["water", "水"], ["city", "都市"],
      ["cat", "猫"], ["dog", "犬"], ["bird", "鳥"], ["fish", "魚"], ["horse", "馬"],
      ["cow", "牛"], ["tree", "木"], ["flower", "花"], ["fire", "火"], ["earth", "土"],
      ["air", "空気"], ["sun", "太陽"], ["moon", "月"], ["star", "星"], ["sky", "空"],
      ["sea", "海"], ["mountain", "山"], ["house", "家"], ["road", "道"], ["car", "車"],
      ["train", "電車"], ["ship", "船"], ["book", "本"], ["word", "言葉"], ["language", "言語"],
      ["friend", "友達"], ["family", "家族"], ["child", "子供"], ["mother", "母"], ["father", "父"],
      ["hand", "手"], ["eye", "目"], ["heart", "心"], ["bread", "パン"], ["apple", "りんご"],
      ["milk", "牛乳"], ["tea", "お茶"], ["coffee", "コーヒー"], ["morning", "朝"], ["night", "夜"],
      ["day", "日"], ["year", "年"], ["time", "時間"], ["light", "光"]
    ];
    var ANCHORS = [8, 14, 22, 30, 40];
    var WORDS = new Array(COUNT);
    ANCHORS.forEach(function (idx, k) { WORDS[idx] = PAIRS[k]; });
    var rest = PAIRS.slice(5), ri = 0;
    for (var wi = 0; wi < COUNT; wi++) if (!WORDS[wi]) WORDS[wi] = rest[ri++];
    function rng(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    var base = [];
    var source = [], targetLocal = [];
    var jitterS = [], jitterT = [];
    (function build() {
      for (var iu = 0; iu < N; iu++) {
        for (var iv = 0; iv < N; iv++) {
          var u = -1 + 2 * iu / (N - 1), v = -1 + 2 * iv / (N - 1);
          base.push([u * 1.15, v * 0.88, 0.56 * (u * u - v * v) + 0.07 * Math.sin(2.2 * u + 0.4) * Math.cos(2.0 * v - 0.2)]);
        }
      }
      var rs = rng(17), rt = rng(41);
      base.forEach(function (p) {
        jitterS.push([(rs() - 0.5) * 0.024, (rs() - 0.5) * 0.024, (rs() - 0.5) * 0.030]);
        jitterT.push([(rt() - 0.5) * 0.034, (rt() - 0.5) * 0.034, (rt() - 0.5) * 0.042]);
      });
      base.forEach(function (p, i) {
        source.push([p[0] + jitterS[i][0], p[1] + jitterS[i][1], p[2] + jitterS[i][2]]);
        targetLocal.push([p[0] + jitterT[i][0], p[1] + jitterT[i][1], p[2] + jitterT[i][2]]);
      });
    })();
    function rotateY(p, a) {
      var c = Math.cos(a), s = Math.sin(a);
      return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    }
    function rotateZ(p, a) {
      var c = Math.cos(a), s = Math.sin(a);
      return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
    }
    function targetPoints() {
      var a = V.rad(angle), r = V.rad(roll), out = [];
      for (var i = 0; i < targetLocal.length; i++) {
        var p = rotateY(rotateZ(targetLocal[i], r), a);
        out.push([p[0] + shift, p[1], p[2]]);
      }
      return out;
    }
    function edges(pts, radius) {
      var out = [];
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var a = pts[i], b = pts[j];
          if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= radius) out.push([i, j]);
        }
      }
      return out;
    }
    var sourceEdges = edges(source, 0.48);
    var targetEdges = edges(targetLocal, 0.48);
    var cam = [0, 0, 0];
    function centroid(pts) {
      var s = [0, 0, 0];
      pts.forEach(function (p) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; });
      return [s[0] / pts.length, s[1] / pts.length, s[2] / pts.length];
    }
    function project(p) {
      var q = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
      return V.project(q, yaw, pitch, Math.min(size.w * 0.19, size.h * 0.33) * zoom, size.w / 2, size.h / 2);
    }
    var faces = [];
    for (var fu = 0; fu < N - 1; fu++) {
      for (var fv = 0; fv < N - 1; fv++) {
        faces.push([fu * N + fv, fu * N + fv + 1, (fu + 1) * N + fv + 1, (fu + 1) * N + fv]);
      }
    }
    function drawFaces(ctx, pts, faceList, col) {
      var fs = faceList.map(function (f) {
        var q = f.map(function (i) { return project(pts[i]); });
        return { p: q, z: (q[0].z + q[1].z + q[2].z + q[3].z) / 4 };
      }).sort(function (a, b) { return a.z - b.z; });
      fs.forEach(function (f) {
        ctx.fillStyle = V.alpha(col, 0.06);
        ctx.beginPath();
        ctx.moveTo(f.p[0].x, f.p[0].y);
        ctx.lineTo(f.p[1].x, f.p[1].y);
        ctx.lineTo(f.p[2].x, f.p[2].y);
        ctx.lineTo(f.p[3].x, f.p[3].y);
        ctx.closePath();
        ctx.fill();
      });
    }
    function drawCloud(ctx, pts, edgeList, col) {
      var projected = pts.map(function (p) { return project(p); });
      var es = edgeList.map(function (e) {
        var a = projected[e[0]], b = projected[e[1]];
        return { a: a, b: b, z: (a.z + b.z) / 2 };
      }).sort(function (a, b) { return a.z - b.z; });
      es.forEach(function (e) {
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.07 + 0.18 * (1 - (e.z + 1) / 2);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      var ps = pts.map(function (p, i) { return { i: i, q: projected[i] }; }).sort(function (a, b) { return a.q.z - b.q.z; });
      ps.forEach(function (o) {
        var r = 2.4 + Math.max(0, 1 - (o.q.z + 1) / 2) * 1.2;
        ctx.beginPath();
        ctx.arc(o.q.x, o.q.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      return projected;
    }
    function drawLabelAt(pts, i, text, color, align, alpha) {
      var q = project(pts[i]);
      var dx = align === "right" ? -9 : 9;
      V.label(ctx, text, q.x + dx, q.y - 9, {
        font: '700 ' + Math.max(11, api.font("canvas-sm") + 1) + 'px "Open Sans", sans-serif',
        color: color, align: align, alpha: alpha
      });
    }
    function score() {
      var rs = 1 - Math.min(1, Math.abs(angle) / 62);
      var rr = 1 - Math.min(1, Math.abs(roll) / 26);
      var ss = 1 - Math.min(1, Math.abs(shift) / 1.8);
      return Math.round((rs + rr + ss) / 3 * 100);
    }
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      var w = size.w, h = size.h;
      var tPts = targetPoints();
      var sc = centroid(source), tc = centroid(tPts);
      cam = [(sc[0] + tc[0]) / 2, (sc[1] + tc[1]) / 2, (sc[2] + tc[2]) / 2];
      ctx.clearRect(0, 0, w, h);
      var bg = ctx.createRadialGradient(w * 0.5, h * 0.44, 8, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bg.addColorStop(0, V.alpha(C.paper2, 0.94));
      bg.addColorStop(1, V.alpha(C.paper, 0));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      V.grid(ctx, w, h, C, 32, 0.13);
      drawFaces(ctx, source, faces, C.blue);
      drawFaces(ctx, tPts, faces, C.green);
      drawCloud(ctx, source, sourceEdges, C.blue);
      drawCloud(ctx, tPts, targetEdges, C.green);
      var aligned = score() / 100;
      var combined = aligned > 0.70;
      ANCHORS.forEach(function (idx, ai) {
        if (hover && hover.index === idx) return;
        var pair = WORDS[idx];
        if (combined) {
          var a = project(source[idx]);
          var b = project(tPts[idx]);
          var mx = (a.x + b.x) / 2;
          var my = (a.y + b.y) / 2 + (ai % 2 ? 9 : -9);
          V.tokenChip(ctx, pair[0] + " · " + pair[1], mx, my, C.gold, C, {
            size: Math.max(10, api.font("canvas-sm") + 1),
            align: "center",
            fill: V.alpha(C.gold, 0.12),
            width: 1.1
          });
        } else {
          drawLabelAt(source, idx, pair[0], C.blue, "right", 0.92);
          drawLabelAt(tPts, idx, pair[1], C.green, "left", 0.92);
        }
      });
      if (hover) {
        var pair = WORDS[hover.index];
        var sp = source[hover.index], tp = tPts[hover.index];
        var a = project(sp), b = project(tp);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = V.alpha(C.gold, 0.85);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(a.x, a.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.stroke();
        drawLabelAt(source, hover.index, pair[0], C.blue, "right", 1);
        drawLabelAt(tPts, hover.index, pair[1], C.green, "left", 1);
      }
      V.heading(ctx, DE ? "Englisch" : "English", 14, 16, C.muted, 10, 1);
      V.heading(ctx, DE ? "Japanisch" : "Japanese", w - 14, 16, C.muted, 10, 1);
      canvas.setAttribute("aria-label", DE
        ? "Zwei Punktwolken mit Vietoris–Rips-Kanten. Drehe und verschiebe die japanische Wolke, bis sie auf der englischen liegt. Ausrichtung " + score() + " Prozent."
        : "Two point clouds with Vietoris–Rips edges. Rotate and translate the Japanese cloud until it sits on the English one. Alignment " + score() + " percent.");
      updateReadout();
    }
    function updateReadout() {
      var pair = hover ? WORDS[hover.index] : null;
      readout.innerHTML = '<span><b>' + (DE ? "Ausrichtung" : "alignment") + '</b> <span class="ls-manifold-value">' + score() + '%</span></span>' +
        '<span><b>' + (DE ? "Drehung" : "yaw") + '</b> <span class="ls-manifold-value">' + Math.round(angle) + '°</span></span>' +
        '<span><b>' + (DE ? "Rotation" : "roll") + '</b> <span class="ls-manifold-value">' + Math.round(roll) + '°</span></span>' +
        '<span><b>' + (DE ? "Verschiebung" : "translation") + '</b> <span class="ls-manifold-value">' + V.fmt(shift) + '</span></span>' +
        (pair ? '<span class="ls-manifold-word"><b>' + (DE ? "Wort" : "word") + '</b> ' + api.esc(pair[0]) + ' · ' + api.esc(pair[1]) + '</span>' : '<span class="ls-manifold-hint">' + (DE ? "Fahre über einen Punkt." : "Hover a point.") + '</span>');
    }
    function updateButton() {
      findBtn.textContent = found ? (DE ? "Übersetzung gefunden" : "Translation found") : (DE ? "Übersetzung finden" : "Find translation");
    }
    function setAngle(v) {
      stopFind();
      angle = Math.max(-180, Math.min(180, parseFloat(v) || 0));
      rotateEl.value = String(angle);
      rotateOut.textContent = Math.round(angle) + "°";
      found = score() >= 92;
      updateButton();
      draw();
    }
    function setShift(v) {
      stopFind();
      shift = Math.max(-0.2, Math.min(2.4, parseFloat(v) || 0));
      shiftEl.value = String(shift);
      shiftOut.textContent = V.fmt(shift);
      found = score() >= 92;
      updateButton();
      draw();
    }
    function setRoll(v) {
      stopFind();
      roll = Math.max(-180, Math.min(180, parseFloat(v) || 0));
      rollEl.value = String(roll);
      rollOut.textContent = Math.round(roll) + "°";
      found = score() >= 92;
      updateButton();
      draw();
    }
    function stopFind() {
      finding = false;
      if (findRaf) cancelAnimationFrame(findRaf);
      findRaf = 0;
    }
    var INITIAL_ANGLE = 62, INITIAL_ROLL = 26, INITIAL_SHIFT = 1.8;
    function animateTo(ta, tr, ts) {
      stopFind();
      if (reduced) {
        angle = ta; roll = tr; shift = ts;
        rotateEl.value = String(angle); rotateOut.textContent = Math.round(angle) + "°";
        rollEl.value = String(roll); rollOut.textContent = Math.round(roll) + "°";
        shiftEl.value = String(shift); shiftOut.textContent = V.fmt(shift);
        found = score() >= 92;
        updateButton(); draw();
        return;
      }
      finding = true;
      var a0 = angle, r0 = roll, s0 = shift, t0 = performance.now(), dur = 920;
      function step(now) {
        if (!finding) return;
        var u = Math.min(1, (now - t0) / dur);
        var e = V.ease(u);
        angle = a0 + (ta - a0) * e;
        roll = r0 + (tr - r0) * e;
        shift = s0 + (ts - s0) * e;
        rotateEl.value = String(angle);
        rollEl.value = String(roll);
        shiftEl.value = String(shift);
        rotateOut.textContent = Math.round(angle) + "°";
        rollOut.textContent = Math.round(roll) + "°";
        shiftOut.textContent = V.fmt(shift);
        draw();
        if (u < 1) findRaf = requestAnimationFrame(step);
        else {
          finding = false; findRaf = 0;
          angle = ta; roll = tr; shift = ts;
          rotateEl.value = String(angle); rotateOut.textContent = Math.round(angle) + "°";
          rollEl.value = String(roll); rollOut.textContent = Math.round(roll) + "°";
          shiftEl.value = String(shift); shiftOut.textContent = V.fmt(shift);
          found = score() >= 92;
          updateButton(); draw();
        }
      }
      findRaf = requestAnimationFrame(step);
    }
    function find() { animateTo(0, 0, 0); }
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function nearest(mx, my) {
      var best = null, bd = 16 * 16;
      function test(pts, side) {
        for (var i = 0; i < pts.length; i++) {
          var q = project(pts[i]);
          var d = (q.x - mx) * (q.x - mx) + (q.y - my) * (q.y - my);
          if (d < bd) { bd = d; best = { side: side, index: i }; }
        }
      }
      test(source, "en");
      test(targetPoints(), "jp");
      return best;
    }
    canvas.addEventListener("pointerdown", function (e) {
      drag = pointer(e);
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("pointermove", function (e) {
      var p = pointer(e);
      if (drag) {
        yaw += (p.x - drag.x) * 0.008;
        pitch = Math.max(-1.2, Math.min(1.2, pitch + (p.y - drag.y) * 0.006));
        drag = p;
        draw();
        return;
      }
      var h = nearest(p.x, p.y);
      if ((h && (!hover || h.side !== hover.side || h.index !== hover.index)) || (!h && hover)) {
        hover = h;
        canvas.style.cursor = h ? "pointer" : "grab";
        draw();
      }
    });
    canvas.addEventListener("pointerup", function () { drag = null; canvas.style.cursor = hover ? "pointer" : "grab"; });
    canvas.addEventListener("pointercancel", function () { drag = null; });
    canvas.addEventListener("pointerleave", function () { if (hover) { hover = null; draw(); } });
    core.canvasTip(canvas, function (x, y) {
      var h = nearest(x, y);
      if (!h) return "";
      var pair = WORDS[h.index];
      var sp = source[h.index], tp = targetPoints()[h.index];
      return (h.side === "en" ? (DE ? "Englisch: " : "English: ") + pair[0] : (DE ? "Japanisch: " : "Japanese: ") + pair[1]) +
        " · (" + sp.map(function (v) { return Number(v).toFixed(1); }).join(", ") + ") ↔ (" + tp.map(function (v) { return Number(v).toFixed(1); }).join(", ") + "). " +
        (DE ? "Ausrichtung " + score() + "%. Ziehen dreht die Wolke; die Regler verschieben sie." : "Alignment " + score() + "%. Drag to rotate the cloud; the sliders translate it.");
    });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoom = Math.max(0.62, Math.min(2.2, zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
      draw();
    }, { passive: false });
    rotateEl.addEventListener("input", function () { setAngle(rotateEl.value); });
    rollEl.addEventListener("input", function () { setRoll(rollEl.value); });
    shiftEl.addEventListener("input", function () { setShift(shiftEl.value); });
    findBtn.addEventListener("click", find);
    function resize() { size = api.fit(canvas, stage); draw(); }
    window.addEventListener("resize", resize);
    window.addEventListener("tm:theme", function () { C = api.colors(); draw(); });
    function nextInternal() {
      if (finding) return true;
      if (found) return false;
      find();
      return true;
    }
    function prevInternal() {
      var atInitial = Math.abs(angle - INITIAL_ANGLE) < 0.5 &&
        Math.abs(roll - INITIAL_ROLL) < 0.5 &&
        Math.abs(shift - INITIAL_SHIFT) < 0.01;
      if (finding || !atInitial) {
        animateTo(INITIAL_ANGLE, INITIAL_ROLL, INITIAL_SHIFT);
        return true;
      }
      return false;
    }
    canvas.__lsManifold = {
      pairs: WORDS,
      point: function (side, i) { var pts = side === "jp" ? targetPoints() : source; var q = project(pts[i]); return { x: q.x, y: q.y }; },
      score: score,
      get hover() { return hover; },
      get angle() { return angle; },
      get roll() { return roll; },
      get shift() { return shift; }
    };
    updateButton();
    resize();
    return {
      update: function () {},
      next: nextInternal,
      prev: prevInternal,
      hasNext: function () { return finding || !found; },
      hasPrev: function () {
        return finding ||
          Math.abs(angle - INITIAL_ANGLE) >= 0.5 ||
          Math.abs(roll - INITIAL_ROLL) >= 0.5 ||
          Math.abs(shift - INITIAL_SHIFT) >= 0.01;
      },
      onKey: function (e) { return api.util.arrowKey(e, nextInternal, prevInternal); },
      resize: resize,
      pause: function () { stopFind(); },
      resume: function () { draw(); },
      destroy: function () { stopFind(); window.removeEventListener("resize", resize); el.remove(); }
    };
  }

  core.register("manifold", manifoldScene);
})();
