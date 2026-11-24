(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  function takeawayScene(root, api) {
    var DE = api.lang === "de";
    var esc = api.esc || function (s) { return String(s == null ? "" : s); };
    function L(de, en) { return DE ? de : en; }

    var STATIONS = [
      {
        chip: L("Text", "Text"),
        tag: L("Eingabe", "Input"),
        title: L("Der Text", "The text"),
        body: L("Der Text ist zuerst nur eine Zeichenfolge. Das Modell sieht keine Wörter, sondern eine Folge, die es zerlegen und in Zahlen übersetzen muss.", "The text starts as a string of characters. The model sees no words, only a sequence it must split and translate into numbers."),
        simple: L("Alles beginnt als Text.", "Everything starts as text.")
      },
      {
        chip: L("Tokens", "Tokens"),
        tag: L("Zerlegen", "Split"),
        title: L("Die Tokens", "The tokens"),
        body: L("Der Text wird in Tokens zerlegt; jedes Token bekommt eine ID. Ein Token ist oft ein Wortstück, kein ganzes Wort. Aus einem Satz werden wenige Bausteine.", "The text is split into tokens; each token gets an ID. A token is often a word piece, not a whole word. A sentence becomes a few building blocks."),
        simple: L("Ein Token ist ein Stück Text.", "A token is a piece of text.")
      },
      {
        chip: L("Vektoren", "Vectors"),
        tag: L("Geometrie", "Geometry"),
        title: L("Die Vektoren", "The vectors"),
        body: L("Jede ID wird zu einem gelernten Vektor. Ähnliche Bedeutungen werden zu ähnlichen Richtungen; Bedeutung wird Geometrie. Abstand und Winkel tragen Information.", "Each ID becomes a learned vector. Similar meanings become similar directions; meaning becomes geometry. Distance and angle carry information."),
        simple: L("Bedeutung wird zu Richtung.", "Meaning becomes direction.")
      },
      {
        chip: L("Attention", "Attention"),
        tag: L("Mischen", "Mix"),
        title: L("Die Attention", "Attention"),
        body: L("Jedes Token schaut auf frühere Tokens und mischt deren Information. Der Kontext entsteht, indem Beziehungen gewichtet werden; die Query entscheidet, worauf es ankommt.", "Each token looks at earlier tokens and mixes their information. Context emerges by weighting relations; the query decides what matters."),
        simple: L("Attention ist ein gewichteter Blick zurück.", "Attention is a weighted look back.")
      },
      {
        chip: L("FFN", "FFN"),
        tag: L("Verschieben", "Shift"),
        title: L("Das FFN", "The FFN"),
        body: L("Das FFN verändert jeden Vektor; der Residualstrom addiert die Änderung, statt den Vektor zu ersetzen. Tiefe entsteht aus vielen kleinen Verschiebungen.", "The FFN changes each vector; the residual stream adds the change instead of replacing the vector. Depth comes from many small shifts."),
        simple: L("Das FFN verschiebt, der Residualstrom trägt.", "The FFN shifts; the residual stream carries.")
      },
      {
        chip: L("Verteilung", "Distribution"),
        tag: L("Ausgabe", "Output"),
        title: L("Die Verteilung", "The distribution"),
        body: L("Am Ende steht eine Wahrscheinlichkeit für jedes mögliche nächste Token. Temperatur formt die Verteilung, aber sie macht die Antwort nicht wahr. Prüfen bleibt deine Aufgabe.", "At the end there is a probability for every possible next token. Temperature shapes the distribution, but it does not make the answer true. Checking remains your job."),
        simple: L("Vorhersage ist keine Wahrheit.", "Prediction is not truth.")
      }
    ];

    var el = document.createElement("div");
    el.className = "ls-tk2";
    var chips = STATIONS.map(function (s, i) {
      return '<button type="button" class="ls-tk2-chip' + (i === 0 ? " is-on" : "") + '" data-tk2-station="' + i + '" role="tab" aria-selected="' + (i === 0) + '"><span>0' + (i + 1) + '</span>' + esc(s.chip) + '</button>';
    }).join("");
    el.innerHTML =
      '<div class="ls-tk2-hero">' +
        '<div class="ls-tk2-head"><span class="ls-tk2-kicker">' + L("Die ganze Reise", "The whole journey") + '</span><b>' + L("Vom Zeichen zur Wirkung", "From sign to impact") + '</b><span class="ls-tk2-sub">' + L("Klick eine Station oder geh mit Weiter durch die Reise; zieh an der Temperatur.", "Click a station or walk through with Next; drag the temperature.") + '</span></div>' +
        '<div class="ls-tk2-stage"><canvas class="ls-tk2-canvas" role="img" data-tip="' + L("Die sechs Stationen und der Residualstrom; klick eine Station für die Erklärung.", "The six stations and the residual stream; click a station for the explanation.") + '"></canvas></div>' +
        '<div class="ls-tk2-chips" role="tablist" aria-label="' + L("Stationen", "Stations") + '">' + chips + '</div>' +
        '<div class="ls-tk2-controls">' +
          '<label class="ls-tk2-temp"><span>' + L("Temperatur", "Temperature") + '</span><input type="range" data-tk2-temp min="0.2" max="1.8" step="0.1" value="0.8"><output>0.8</output></label>' +
          '<span class="ls-tk2-hint">' + L("Weiter → nächste Station", "Next → next station") + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="ls-tk2-detail" data-tk2-detail></div>';
    root.appendChild(el);

    var canvas = el.querySelector(".ls-tk2-canvas");
    var stage = el.querySelector(".ls-tk2-stage");
    var chipEls = Array.prototype.slice.call(el.querySelectorAll("[data-tk2-station]"));
    var detailEl = el.querySelector("[data-tk2-detail]");
    var tempEl = el.querySelector("[data-tk2-temp]");
    var tempOut = tempEl ? tempEl.nextElementSibling : null;
    var C = api.colors();
    var reduce = !!api.reducedMotion;
    var active = 0, temp = 0.8, activeSince = performance.now();
    var size = null, ctx = null, raf = 0, start = performance.now(), paused = false;
    var particles = [];
    for (var p = 0; p < 34; p++) {
      particles.push({ x: Math.random(), y: Math.random(), vx: 0.006 + Math.random() * 0.012, vy: 0.003 + Math.random() * 0.008, r: 0.8 + Math.random() * 1.8, c: [C.blue, C.green, C.gold, C.lilac][p % 4] });
    }

    function roundRect(c, x, y, w, h, r) {
      var rr = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    }
    function font(px, weight) { return (weight || 600) + " " + Math.max(9, Math.round(px)) + 'px "Open Sans", sans-serif'; }
    function serif(px, weight) { return (weight || 600) + " " + Math.max(15, Math.round(px)) + 'px "Iowan Old Style", Georgia, serif'; }
    function dot(c, x, y, r, color) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
    function arrow(c, x1, y1, x2, y2, color, width) {
      c.strokeStyle = color; c.fillStyle = color; c.lineWidth = width || 1.4;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      var a = Math.atan2(y2 - y1, x2 - x1);
      c.beginPath(); c.moveTo(x2, y2);
      c.lineTo(x2 - Math.cos(a - 0.38) * 7, y2 - Math.sin(a - 0.38) * 7);
      c.lineTo(x2 - Math.cos(a + 0.38) * 7, y2 - Math.sin(a + 0.38) * 7);
      c.closePath(); c.fill();
    }
    function softmax(logits, t) {
      var m = Math.max.apply(null, logits);
      var e = logits.map(function (l) { return Math.exp((l - m) / t); });
      var s = e.reduce(function (a, b) { return a + b; }, 0);
      return e.map(function (x) { return x / s; });
    }

    function background(w, h, t) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(18,117,172,.055)");
      g.addColorStop(0.55, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(201,162,39,.07)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      particles.forEach(function (p) {
        var x = ((p.x + t * p.vx) % 1) * w;
        var y = ((p.y + t * p.vy) % 1) * h;
        ctx.globalAlpha = 0.10;
        dot(ctx, x, y, p.r, p.c);
      });
      ctx.globalAlpha = 1;
    }
    function panelBox(p) {
      roundRect(ctx, p.x, p.y, p.w, p.h, 16);
      ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.10;
      var g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      g.addColorStop(0, C.blue); g.addColorStop(1, "rgba(255,255,255,0)");
      roundRect(ctx, p.x, p.y, p.w, p.h * 0.5, 16);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
    function stationLabel(p) {
      ctx.fillStyle = C.petrol;
      ctx.font = font(api.font("canvas-sm") * 0.92, 700);
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("0" + (active + 1) + " · " + STATIONS[active].tag.toUpperCase(), p.x + 16, p.y + 12);
    }

    function drawText(p, t) {
      var cx = p.x + p.w / 2, cy = p.y + p.h * 0.58;
      var sentence = L("Es war einmal ein", "Once upon a time");
      var last = L("ein", "time");
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = serif(api.font("canvas") * 1.55, 600);
      var all = ctx.measureText(sentence).width;
      var lw = ctx.measureText(last).width;
      roundRect(ctx, cx + all / 2 - lw - 7, cy - 20, lw + 14, 40, 8);
      ctx.fillStyle = C.green; ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = C.ink; ctx.fillText(sentence, cx, cy);
      ctx.fillStyle = C.green; ctx.fillText(last, cx + all / 2 - lw / 2, cy);
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 3);
      ctx.fillStyle = C.green; ctx.fillRect(cx + all / 2 + 9, cy - 14, 2, 28);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.muted; ctx.font = font(api.font("canvas-sm") * 0.8, 600);
      ctx.fillText(L("eine Zeichenfolge – noch keine Bedeutung", "a string of characters – no meaning yet"), cx, cy + 42);
    }
    function drawTokens(p, t) {
      var words = ["Es", "war", "einmal", "ein"];
      var ids = ["1043", "288", "610", "42"];
      var colors = [C.green, C.blue, C.gold, C.lilac];
      var pad = 20, gap = 8;
      var cw = (p.w - pad * 2 - gap * (words.length - 1)) / words.length;
      var cy = p.y + p.h * 0.52;
      words.forEach(function (word, i) {
        var x = p.x + pad + i * (cw + gap);
        var lift = i === 2 ? -5 : 0;
        roundRect(ctx, x, cy - 24 + lift, cw, 48, 9);
        ctx.fillStyle = C.paper; ctx.fill();
        ctx.strokeStyle = colors[i]; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = colors[i]; ctx.font = font(api.font("canvas") * 1.05, 700);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(word, x + cw / 2, cy + lift);
        ctx.fillStyle = C.muted; ctx.font = font(api.font("canvas-sm") * 0.72, 600);
        ctx.fillText("#" + ids[i], x + cw / 2, cy + 34 + lift);
      });
      ctx.fillStyle = C.muted; ctx.font = font(api.font("canvas-sm") * 0.8, 600);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(L("Token = Wortstück + ID", "token = word piece + ID"), p.x + p.w / 2, cy + 48);
    }
    function drawVectors(p, t) {
      var cx = p.x + p.w * 0.42, cy = p.y + p.h * 0.56;
      var R = Math.min(p.w * 0.3, p.h * 0.34);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      var words = [
        { label: L("König", "king"), v: [0.55, 0.25], c: C.petrol },
        { label: L("Königin", "queen"), v: [0.55, 0.48], c: C.green },
        { label: L("Hund", "dog"), v: [-0.42, -0.32], c: C.gold }
      ];
      words.forEach(function (w) {
        var x = cx + w.v[0] * R, y = cy - w.v[1] * R;
        arrow(ctx, cx, cy, x, y, w.c, 1.5);
        dot(ctx, x, y, 4, w.c);
        ctx.fillStyle = w.c; ctx.font = font(api.font("canvas-sm") * 0.82, 700);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(w.label, x + 7, y - 5);
      });
      ctx.fillStyle = C.muted; ctx.font = font(api.font("canvas-sm") * 0.78, 600);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(L("Richtung und Abstand tragen Bedeutung", "direction and distance carry meaning"), p.x + p.w / 2, p.y + p.h - 22);
    }
    function drawAttention(p, t) {
      var n = 6, pad = 34;
      var cy = p.y + p.h * 0.68;
      var step = (p.w - pad * 2) / (n - 1);
      var xs = [];
      for (var i = 0; i < n; i++) xs.push(p.x + pad + i * step);
      var weights = [0.10, 0.18, 0.34, 0.16, 0.52, 1];
      ctx.lineCap = "round";
      for (var j = 0; j < n - 1; j++) {
        ctx.strokeStyle = C.blue;
        ctx.globalAlpha = 0.16 + weights[j] * 0.55;
        ctx.lineWidth = 1 + weights[j] * 3.2;
        ctx.beginPath();
        ctx.moveTo(xs[n - 1], cy - 10);
        ctx.quadraticCurveTo((xs[n - 1] + xs[j]) / 2, cy - 52 - j * 5, xs[j], cy - 10);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      xs.forEach(function (x, i) {
        var isQ = i === n - 1;
        dot(ctx, x, cy, isQ ? 7 : 5, isQ ? C.gold : C.petrol);
        ctx.fillStyle = isQ ? C.gold : C.petrol;
        ctx.font = font(api.font("canvas-sm") * 0.78, 700);
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(isQ ? "q" : "k", x, cy + 12);
      });
      ctx.fillStyle = C.muted; ctx.font = font(api.font("canvas-sm") * 0.78, 600);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(L("q schaut zurück und gewichtet die Keys", "q looks back and weights the keys"), p.x + p.w / 2, p.y + p.h - 22);
    }
    function drawFFN(p, t) {
      var cx = p.x + p.w / 2, cy = p.y + p.h * 0.48;
      var dx = Math.min(110, p.w * 0.18);
      var left = [-26, 0, 26], right = [-30, 0, 30];
      left.forEach(function (ly) {
        right.forEach(function (ry) {
          ctx.strokeStyle = C.lilac;
          ctx.globalAlpha = 0.10 + 0.03 * ((ly + ry + 60) % 3);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx - dx, cy + ly); ctx.lineTo(cx + dx, cy + ry); ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
      left.forEach(function (y) { dot(ctx, cx - dx, cy + y, 5, C.blue); });
      right.forEach(function (y) { dot(ctx, cx + dx, cy + y, 5, C.green); });
      arrow(ctx, cx - dx + 10, cy, cx + dx - 10, cy, C.green, 2);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx - dx, cy + 48);
      ctx.quadraticCurveTo(cx, cy + 78, cx + dx, cy + 48);
      ctx.stroke();
      arrow(ctx, cx + dx - 12, cy + 58, cx + dx, cy + 48, C.gold, 2);
      ctx.fillStyle = C.gold; ctx.font = font(api.font("canvas-sm") * 0.82, 700);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("+ x  " + L("Residualstrom", "residual stream"), cx, cy + 82);
    }
    function drawDistribution(p, t) {
      var names = DE ? ["Katze", "Hund", "Maus", "Pferd", "…"] : ["cat", "dog", "mouse", "horse", "…"];
      var probs = softmax([2.2, 3.4, 1.0, 0.6, 0.4], temp);
      var chosen = 1;
      var pad = 24, gap = 8;
      var bw = (p.w - pad * 2 - gap * (names.length - 1)) / names.length;
      var bottom = p.y + p.h - 34;
      var top = p.y + 58;
      var maxH = Math.max(34, bottom - top);
      var maxP = Math.max.apply(null, probs);
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillStyle = C.soft; ctx.font = font(api.font("canvas") * 0.9, 600);
      var prefix = L("Es war einmal ein", "Once upon a time a");
      ctx.fillText(prefix, p.x + pad, p.y + 34);
      var pw = ctx.measureText(prefix).width;
      ctx.fillStyle = C.green; ctx.font = font(api.font("canvas") * 0.98, 700);
      ctx.fillText(names[chosen], p.x + pad + pw + 5, p.y + 34);
      probs.forEach(function (prob, i) {
        var bh = Math.max(4, maxH * (prob / maxP));
        var x = p.x + pad + i * (bw + gap);
        var y = bottom - bh;
        roundRect(ctx, x, y, bw, bh, 5);
        ctx.fillStyle = i === chosen ? C.green : [C.blue, C.petrol, C.lilac, C.gold][i % 4];
        ctx.globalAlpha = i === chosen ? 0.92 : 0.42;
        ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = i === chosen ? C.green : C.muted;
        ctx.font = font(api.font("canvas-sm") * 0.76, 700);
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(Math.round(prob * 100) + "%", x + bw / 2, y - 5);
        ctx.fillStyle = i === chosen ? C.petrol : C.muted;
        ctx.font = font(api.font("canvas-sm") * 0.72, 600);
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(names[i], x + bw / 2, bottom + 8);
      });
      var badge = "T = " + temp.toFixed(1);
      ctx.font = font(api.font("canvas-sm") * 0.78, 700);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = C.gold;
      ctx.fillText(badge, p.x + p.w - pad, p.y + 24);
      ctx.fillStyle = C.muted;
      ctx.textAlign = "left";
      ctx.fillText(L("nächstes Token", "next token"), p.x + pad, p.y + 24);
    }
    var VISUALS = [drawText, drawTokens, drawVectors, drawAttention, drawFFN, drawDistribution];

    function gateX(i, w) { return 40 + i * (w - 80) / 5; }
    function drawRiver(w, y, t) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = C.petrol; ctx.globalAlpha = 0.07; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.bezierCurveTo(w * 0.33, y - 12, w * 0.66, y + 12, w - 40, y); ctx.stroke();
      ctx.globalAlpha = 0.20; ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.bezierCurveTo(w * 0.33, y - 12, w * 0.66, y + 12, w - 40, y); ctx.stroke();
      ctx.globalAlpha = 0.42; ctx.strokeStyle = C.gold; ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 12]); ctx.lineDashOffset = -t * 34;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.bezierCurveTo(w * 0.33, y - 12, w * 0.66, y + 12, w - 40, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      var ox = 40 + ((t * 0.075) % 1) * (w - 80);
      var oy = y - Math.sin((ox - 40) / (w - 80) * Math.PI) * 6;
      ctx.save();
      var glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 18);
      glow.addColorStop(0, "rgba(201,162,39,.42)"); glow.addColorStop(1, "rgba(201,162,39,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ox, oy, 18, 0, Math.PI * 2); ctx.fill();
      dot(ctx, ox, oy, 4.2, C.gold);
      ctx.globalAlpha = 0.18; dot(ctx, ox - 10, oy, 2.6, C.gold); dot(ctx, ox - 18, oy, 1.6, C.gold);
      ctx.globalAlpha = 1; ctx.restore();
    }
    function drawGates(w, y, t) {
      var labels = DE ? ["Text", "Token", "Vektor", "Attention", "FFN", "Verteilung"] : ["Text", "Token", "Vector", "Attention", "FFN", "Distribution"];
      for (var i = 0; i < 6; i++) {
        var x = gateX(i, w), on = i === active;
        var pulse = on ? 1 + 0.06 * Math.sin(t * 3.2) : 1;
        if (on) {
          ctx.save();
          var halo = ctx.createRadialGradient(x, y, 2, x, y, 34 * pulse);
          halo.addColorStop(0, "rgba(201,162,39,.30)"); halo.addColorStop(1, "rgba(201,162,39,0)");
          ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, 34 * pulse, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        ctx.beginPath(); ctx.arc(x, y, (on ? 19 : 15) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = C.paper; ctx.fill();
        ctx.strokeStyle = on ? C.gold : C.lineStrong; ctx.lineWidth = on ? 2.4 : 1.3; ctx.stroke();
        ctx.fillStyle = on ? C.gold : C.petrol;
        ctx.font = font(api.font("canvas-sm") * 0.86, 700);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("0" + (i + 1), x, y + 1);
        if (w > 560) {
          ctx.fillStyle = on ? C.gold : C.muted;
          ctx.font = font(api.font("canvas-sm") * 0.78, on ? 700 : 600);
          ctx.textBaseline = "top";
          ctx.fillText(labels[i], x, y + 26);
        }
      }
    }
    function drawResidual(w, y, t) {
      if (y > size.h - 12) return;
      ctx.save();
      ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.32; ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 50, y); ctx.stroke();
      ctx.setLineDash([]);
      arrow(ctx, w - 56, y, w - 40, y, C.gold, 1.4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.gold; ctx.font = font(api.font("canvas-sm") * 0.72, 700);
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(L("Residualstrom: trägt x durch alle Blöcke", "residual stream: carries x through all blocks"), w / 2, y - 5);
      ctx.restore();
    }

    function draw(now) {
      if (!size || !ctx || size.w < 40 || size.h < 40) return;
      var w = size.w, h = size.h;
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      background(w, h, t);
      var panel = { x: 16, y: 14, w: w - 32, h: Math.max(160, h * 0.55) };
      panelBox(panel);
      stationLabel(panel);
      ctx.save();
      ctx.globalAlpha = Math.min(1, (now - activeSince) / 260);
      VISUALS[active](panel, t);
      ctx.restore();
      var riverY = Math.max(panel.y + panel.h + 40, h * 0.72);
      drawRiver(w, riverY, t);
      drawGates(w, riverY, t);
      drawResidual(w, riverY + 42, t);
      ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.20; ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(gateX(active, w), panel.y + panel.h); ctx.lineTo(gateX(active, w), riverY - 18); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    function fit() {
      size = api.fit(canvas, canvas);
      ctx = size.ctx;
      draw(performance.now());
    }
    function loop(now) {
      raf = 0;
      if (paused) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function startLoop() {
      if (reduce || raf || paused) return;
      raf = requestAnimationFrame(loop);
    }
    function renderDetail() {
      var s = STATIONS[active];
      detailEl.innerHTML = '<div class="ls-tk2-detail-head"><span class="ls-tk2-detail-num">0' + (active + 1) + '</span><div><span class="ls-tk2-detail-tag">' + esc(s.tag) + '</span><b>' + esc(s.title) + '</b></div></div>' +
        '<p class="ls-tk2-detail-body">' + esc(s.body) + '</p>' +
        '<p class="ls-tk2-detail-simple"><b>' + L("Merke", "Remember") + '</b> ' + esc(s.simple) + '</p>';
      canvas.setAttribute("aria-label", L("Interaktive Reise. Station ", "Interactive journey. Station ") + (active + 1) + ": " + s.title + ". " + s.body);
    }
    function selectStation(i) {
      if (i === active) return;
      active = Math.max(0, Math.min(STATIONS.length - 1, i));
      activeSince = performance.now();
      chipEls.forEach(function (b, idx) {
        var on = idx === active;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderDetail();
      draw(performance.now());
    }
    chipEls.forEach(function (b) {
      b.addEventListener("click", function () { selectStation(parseInt(b.getAttribute("data-tk2-station"), 10) || 0); });
    });
    function gateAt(x, y) {
      if (!size) return -1;
      var riverY = Math.max(14 + Math.max(160, size.h * 0.55) + 40, size.h * 0.72);
      if (Math.abs(y - riverY) > 34) return -1;
      var best = -1, bestDist = 1e9;
      for (var i = 0; i < 6; i++) {
        var d = Math.abs(x - gateX(i, size.w));
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return bestDist < 38 ? best : -1;
    }
    canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect();
      var hit = gateAt(e.clientX - r.left, e.clientY - r.top);
      if (hit >= 0) selectStation(hit);
    });
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      canvas.style.cursor = gateAt(e.clientX - r.left, e.clientY - r.top) >= 0 ? "pointer" : "default";
    });
    if (tempEl) tempEl.addEventListener("input", function () {
      temp = Math.max(0.2, Math.min(1.8, parseFloat(tempEl.value) || 0.8));
      if (tempOut) tempOut.textContent = temp.toFixed(1);
      if (active !== 5) selectStation(5);
      draw(performance.now());
    });

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { fit(); }); ro.observe(stage); }
    window.addEventListener("resize", fit);
    function onTheme() { C = api.colors(); draw(performance.now()); }
    window.addEventListener("tm:theme", onTheme);
    renderDetail();
    fit();
    startLoop();
    return {
      update: function () {},
      next: function () { if (active < STATIONS.length - 1) { selectStation(active + 1); return true; } return false; },
      prev: function () { if (active > 0) { selectStation(active - 1); return true; } return false; },
      hasNext: function () { return active < STATIONS.length - 1; },
      hasPrev: function () { return active > 0; },
      resize: fit,
      pause: function () { paused = true; if (raf) cancelAnimationFrame(raf); raf = 0; },
      resume: function () { paused = false; startLoop(); },
      destroy: function () {
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", fit);
        window.removeEventListener("tm:theme", onTheme);
        el.remove();
      }
    };
  }
  core.register("takeaway", takeawayScene);
})();
