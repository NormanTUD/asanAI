// ============================================================
// FOLIE „Viele Köpfe": Tabelle + Attention-Web (Canvas-Arcs)
// Stil wie transformer.js renderDynamicAttentionWeb (Blog):
// eine Wortzeile unten, Bögen oben darüber („um beide herum").
// Pfeiltasten/Buttons wechseln durch die Köpfe (Beispiele).
// ============================================================
(function () {
    const wrap = document.getElementById('heads-wrap');
    const box = document.getElementById('heads-sentence-viz');
    if (!wrap || !box) return;

    const TOK = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
    const COLORS = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0d9488'];
    const NAME = ['Kopf 1', 'Kopf 2'];
    const SUBTITLE = ['Artikel ↔ Nomen', 'Subjekt → Verb'];
    const ROWSIGHT = [
        capStep('cat', COLORS[1], 'the', COLORS[0], 71),
        capStep('sat', COLORS[2], 'cat', COLORS[1], 55)
    ];
    const H1CATROW = [0.71, 0.29, 0, 0, 0, 0];
    const H2SATROW = [0.20, 0.55, 0.25, 0, 0, 0];
    const H1FULL = [
        [1, 0, 0, 0, 0, 0],
        [0.71, 0.29, 0, 0, 0, 0],
        [0.33, 0.33, 0.33, 0, 0, 0],
        [0.44, 0.25, 0.12, 0.19, 0, 0],
        [0.43, 0.09, 0.01, 0.04, 0.43, 0],
        [0.31, 0.13, 0.04, 0.08, 0.31, 0.13]
    ];
    const H2FULL = [
        [1, 0, 0, 0, 0, 0],
        [0.31, 0.69, 0, 0, 0, 0],
        [0.20, 0.55, 0.25, 0, 0, 0],
        [0.19, 0.34, 0.22, 0.24, 0, 0],
        [0.19, 0.21, 0.20, 0.20, 0.19, 0],
        [0.11, 0.25, 0.13, 0.15, 0.11, 0.25]
    ];
    const MATS = [H1FULL, H2FULL];
    const U = [
        '{\\text{Artikel}\\leftrightarrow\\text{Nomen}}',
        '{\\text{Subjekt}\\to\\text{Verb}}'
    ];

    function capNum(n, c) {
        return '<span style="display:inline-flex;align-items:center;justify-content:center;' +
            'width:1.55em;height:1.55em;border-radius:50%;background:' + c + ';color:#fff;' +
            'font-weight:700;font-size:0.78em;vertical-align:-0.15em">' + n + '</span>';
    }
    function capStep(w1, c1, w2, c2, pct) {
        const arrow = '<span style="color:#cbd5e1;margin:0 0.2em">→</span>';
        const p = '<span style="color:#94a3b8;font-size:0.85em;margin-left:0.5em;font-weight:600">' + pct + '%</span>';
        return capNum(1, c1) + ' <b style="color:' + c1 + '">' + w1 +
            '</b>' + arrow + capNum(2, c2) + ' <b style="color:' + c2 + '">' + w2 + '</b>' + p;
    }

    // ---------- Tabelle (Chips) ----------
    function alpha(v) { return Math.min(0.65, v * 0.7 + 0.08).toFixed(2); }
    function chips(row, who, toks) {
        let best = -1, bv = -1;
        row.forEach((v, i) => { if (v > bv) { bv = v; best = i; } });
        let s = '<table class="attn-chips"><tr>';
        s += '<td class="attn-sp">' + (who ? '<span class="attn-chip lbl">' + who + '</span>' : '') + '</td>';
        row.forEach((v, i) => {
            s += '<td class="attn-vc' + (i === best ? ' hi' : '') + '"><span class="attn-chip' + (v === 0 ? ' z' : '') + '" style="background:' + (v > 0 ? 'rgba(59,130,246,' + alpha(v) + ')' : 'transparent') + '">' + (v > 0 ? v.toFixed(2) : '0') + '</span></td>';
        });
        s += '</tr>';
        if (toks) {
            s += '<tr><td class="attn-sp"></td>';
            toks.forEach((t, i) => s += '<td class="attn-xc' + (i === best ? ' hi' : '') + '"><span class="chip-x">' + t + '</span></td>');
            s += '</tr>';
        }
        s += '</table>';
        return s;
    }

    const ROWS = [
        { row: H1CATROW, who: 'cat' },
        { row: H2SATROW, who: 'sat' }
    ];

    let s = '<table class="heads-table"><thead><tr>' +
        '<th style="width:230px;">Kopf</th><th>Schaut wo entlang</th><th>Beobachtung</th>' +
        '</tr></thead><tbody>';
    ROWS.forEach((r, i) => {
        s += '<tr><td><span class="math-inline">$\\underbrace{\\text{' + NAME[i] + '}}_{' + U[i] + '}$</span></td>';
        s += '<td style="white-space:nowrap;">' + chips(r.row, r.who, TOK) + '</td>';
        s += '<td>' + ROWSIGHT[i] + '</td></tr>';
    });
    s += '</tbody></table>';
    wrap.innerHTML = s;

    // ---------- Attention-Web (Canvas) ----------
    box.innerHTML =
        '<div style="text-align:center;font-weight:700;font-size:1.0em;color:#1e293b;margin-bottom:2px;">Die Blicke als Bögen um beide Wörter</div>' +
        '<div id="heads-web-container" style="position:relative; height:240px; padding-top:20px; margin-bottom:6px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; overflow-x:auto; overflow-y:hidden;">' +
        '<canvas id="heads-web-canvas" style="position:absolute; top:0; left:0; pointer-events:none; z-index:5;"></canvas>' +
        '<div id="heads-web-strip" style="display:flex; justify-content:center; gap:10px; position:absolute; bottom:26px; width:max-content; min-width:100%; padding:0 20px; flex-wrap:nowrap;"></div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; justify-content:center; gap:14px; margin-top:4px;">' +
        '<button id="heads-prev" title="Vorheriges Beispiel (←)" style="cursor:pointer; background:#e0e7ff; border:none; border-radius:8px; width:34px; height:34px; font-size:1.2em; font-weight:700; color:#3730a3;">‹</button>' +
        '<span id="heads-step-label" style="font-weight:700; font-size:1.0em; color:#1e293b; white-space:nowrap;"></span>' +
        '<button id="heads-next" title="Nächstes Beispiel (→)" style="cursor:pointer; background:#e0e7ff; border:none; border-radius:8px; width:34px; height:34px; font-size:1.2em; font-weight:700; color:#3730a3;">›</button>' +
        '</div>' +
        '<div id="heads-web-caption" style="margin-top:8px; text-align:center; font-size:0.95em; color:#475569; min-height:1.5em; line-height:1.5;">Hover über ein Wort zeigt nur seine Blicke · Pfeiltasten ← → wechseln das Beispiel.</div>';

    const container = document.getElementById('heads-web-container');
    const canvas = document.getElementById('heads-web-canvas');
    const strip = document.getElementById('heads-web-strip');
    const stepLabel = document.getElementById('heads-step-label');
    const caption = document.getElementById('heads-web-caption');
    const rowEls = Array.from(wrap.querySelectorAll('.heads-table > tbody > tr'));

    // Wort-Chips – eine Zeile, darunter die Bögen
    strip.innerHTML = TOK.map((t) =>
        '<div class="web-chip" style="' +
        'display:inline-block; padding:8px 14px; margin:0 6px; background:#e0e7ff; border-radius:8px; cursor:pointer;' +
        'font-weight:600; font-size:1.05rem; user-select:none; white-space:nowrap; flex-shrink:0; min-width:64px; text-align:center;' +
        'border:2px solid transparent; transition:border-color .15s, box-shadow .15s;">' + t + '</div>'
    ).join('');
    const chipEls = Array.from(strip.querySelectorAll('.web-chip'));

    let headIdx = 0;
    let hoverTok = -1;

    const clamp = (i) => ((i % MATS.length) + MATS.length) % MATS.length;

    // ---------- Zeichnen (wie renderDynamicAttentionWeb) ----------
    function draw() {
        const scrollW = container.scrollWidth;
        const scrollH = container.scrollHeight;
        canvas.width = scrollW;
        canvas.height = scrollH;
        canvas.style.width = scrollW + 'px';
        canvas.style.height = scrollH + 'px';

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Layout-Koordinaten (transform-frei, damit fitSlides-Scale nicht doppelt zählt)
        const cx = chipEls.map(c => strip.offsetLeft + c.offsetLeft + c.offsetWidth / 2);
        const c0 = chipEls[0];
        const baseY = strip.offsetTop + c0.offsetTop + c0.offsetHeight / 2;
        const sl = container.scrollLeft;

        const M = MATS[headIdx];
        const n = Math.min(TOK.length, chipEls.length, M.length);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const w = M[i] && M[i][j];
                if (w == null || w < 0.01) continue;
                drawArc(ctx, cx[i] - sl, cx[j] - sl, baseY, w, i, i === hoverTok);
            }
        }

        chipEls.forEach((chip, i) => {
            const on = i === hoverTok;
            chip.style.borderColor = on ? '#2563eb' : 'transparent';
            chip.style.boxShadow = on ? '0 0 0 3px rgba(37,99,235,.2)' : 'none';
        });
    }

    function rgbaOf(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
    }

    function drawArc(ctx, x1, x2, baseY, w, srcIdx, isSource) {

        const dist = Math.abs(x2 - x1);
        const h = Math.max(40, Math.min(dist * 0.55, 190));

        let width, color, labelColor;
        if (isSource) {
            width = Math.min(22, 2 + w * 26);
            color = 'rgba(37, 99, 235, ' + Math.min(1, 0.25 + w * 0.7).toFixed(2) + ')';
            labelColor = '#1e40af';
        } else if (hoverTok >= 0) {
            width = 1;
            color = 'rgba(148, 163, 184, ' + Math.min(0.28, 0.03 + w * 0.12).toFixed(2) + ')';
            labelColor = null;
        } else {
            width = Math.min(18, 1 + w * 14);
            color = rgbaOf(COLORS[srcIdx], Math.min(0.9, 0.08 + w * 0.7).toFixed(2));
            labelColor = COLORS[srcIdx];
        }

        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, baseY);
        ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
        ctx.stroke();

        const showLabel = labelColor && ((isSource && w > 0.05) || (hoverTok < 0 && w >= 0.4));
        if (showLabel) {
            ctx.fillStyle = labelColor;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(w * 100) + '%', (x1 + x2) / 2, baseY - h / 1.5 - 4);
        }
    }

    // ---------- Beispielwechsel / Stepper ----------
    function setHead(i) {
        headIdx = clamp(i);
        hoverTok = -1;
        stepLabel.innerHTML = (headIdx + 1) + '/' + MATS.length +
            ' · ' + NAME[headIdx] +
            ': <span style="color:' + (headIdx === 0 ? '#2563eb' : '#8b5cf6') + '">' + SUBTITLE[headIdx] + '</span>';
        caption.innerHTML = ROWSIGHT[headIdx];
        rowEls.forEach((tr, k) => tr.classList.toggle('active-row', k === headIdx));
        draw();
    }

    chipEls.forEach((chip, i) => {
        chip.addEventListener('mouseover', () => {
            hoverTok = i;
            const parts = MATS[headIdx][i].map((w, j) => (w > 0 ? TOK[j] + ' (' + w.toFixed(2) + ')' : null)).filter(Boolean);
            caption.innerHTML = '<b style="color:' + COLORS[i] + '">' + TOK[i] + '</b> blickt auf: ' + parts.join(' · ');
            draw();
        });
        chip.addEventListener('mouseout', () => {
            hoverTok = -1;
            caption.innerHTML = ROWSIGHT[headIdx];
            draw();
        });
    });

    rowEls.forEach((tr, i) => {
        tr.style.cursor = 'pointer';
        tr.addEventListener('mouseenter', () => setHead(i));
        tr.addEventListener('click', () => setHead(i));
    });

    container.addEventListener('scroll', draw);
    let resizeT = null;
    window.addEventListener('resize', () => {
        if (resizeT) clearTimeout(resizeT);
        resizeT = setTimeout(draw, 60);
    });

    document.getElementById('heads-prev').addEventListener('click', () => HeadsStepDemo.prev());
    document.getElementById('heads-next').addEventListener('click', () => HeadsStepDemo.next());

    // Globaler Stepper → DemoRegistry in presentation.js (Pfeiltasten)
    window.HeadsStepDemo = {
        isOnSlide: function () {
            const sl = document.getElementById('slide-viele-koepfe');
            return !!(sl && sl.classList.contains('active'));
        },
        canGoNext: function () { return this.isOnSlide() && headIdx < MATS.length - 1; },
        canGoPrev: function () { return this.isOnSlide() && headIdx > 0; },
        next: function () { setHead(headIdx + 1); },
        prev: function () { setHead(headIdx - 1); }
    };

    setHead(0);
})();
