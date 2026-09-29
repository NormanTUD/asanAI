// ============================================================
// SPACE MORPH – "Layer als Raumkrümmung" (7-Schritte-Animation)
// Port von test/space_morph.html in das Folien-Format:
// Pfeiltasten (Präsentation) steuern die Schritte, Drag rotiert.
// ============================================================
const SpaceMorph = (() => {
    const SLIDE_ID = 'slide-layer-als-raumkruemmung';
    const DUR = 1900;

    // ---------- Zustand ----------
    let ctx = null;
    let W = 0, H = 0, DPR = 1;
    let inited = false;
    let active = false;
    let raf = null;
    let dragBound = false;

    // Kamera: Blick von OBEN
    let camA = 0, camB = 1.5708, dragA = 0, dragB = 0, pers = 1, FIT = 1, YOFF = 0;
    let md = false, mx = 0, my = 0;
    let cur = 0, prevIdx = 0, t0 = 0, dA0 = 0, dB0 = 0;

    // ---------- Daten ----------
    let rng = 42;
    const rnd = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const PTS = [];
    for (let i = 0; i < 140; i++) { const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * 0.40;
        PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 0, r: r }); }
    for (let i = 0; i < 220; i++) { const a = rnd() * 6.2832, r = 0.82 + Math.sqrt(rnd()) * 0.26;
        PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 1, r: r }); }

    const KZ = 1.15, KB = 0.40, PLANE_Z = 0.18;
    const SCORE = (x, y) => ((x * x + y * y) * KZ - KB) - PLANE_Z;
    const SMIN = -0.62, SMAX = 1.05;
    PTS.forEach(p => p.s = SCORE(p.x, p.y));
    const LIFT = (x, y, t) => { const r2 = x * x + y * y;
        return { x: x * (1 - 0.12 * t * r2), y: y * (1 - 0.12 * t * r2), z: (r2 * KZ - KB) * t }; };

    // ---------- Szenen ----------
    const S = [
        { n: "Schritt 1 / 7", t: "Zwei Klassen, keine Gerade",
            b: "Innen eine Punktwolke, außen ein Ring. Kein einziger gerader Schnitt trennt Rot von Blau.",
            f: "X ⊂ ℝ²,&nbsp; y ∈ {0,1}<small>nicht linear separierbar</small>",
            L: 0, A: 0, B: 1.5708, P: 0, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0 },
        { n: "Schritt 2 / 7", t: "Jeder Versuch scheitert",
            b: "Eine lineare Trennung ist eine Gerade. Sie schneidet den Ring immer — die Topologie lässt es nicht zu.",
            f: "w₁x + w₂y + b = 0<small>eine Gerade, immer</small>",
            L: 0, A: 0, B: 1.5708, P: 0, pl: 0, sq: 0, fail: 1, lab: 0, pr: 0, box: 0 },
        { n: "Schritt 3 / 7", t: "Eine Dimension mehr Platz",
            b: "Das alte Bild liegt jetzt als Boden unter uns. Senkrecht dazu steht die neue Achse z. Die Daten sind unverändert — aber über ihnen ist Raum entstanden.",
            f: "ℝ² ↪ ℝ³<small>Einbettung, noch ohne Krümmung</small>",
            L: 0, A: 0.38, B: 1.02, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 1 },
        { n: "Schritt 4 / 7", t: "Der Layer krümmt den Raum",
            b: "Die Kamera fährt in die Seitenansicht und bleibt dort. Das Gitter hebt sich zu einer Schale: innere Punkte sinken, äußere steigen. Es zerreißt nicht, es biegt sich.",
            f: "φ(x,y) = (x, y, x² + y²)<small>ein Layer = eine Verbiegung</small>",
            L: 1, A: 0, B: 0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0 },
        { n: "Schritt 5 / 7", t: "Eine Ebene passt dazwischen",
            b: "Gleicher Blickwinkel, nur ein neues Objekt: eine flache Ebene schiebt sich sauber zwischen die Klassen. In 2D war das unmöglich.",
            f: "wᵀφ(x) + b = 0<small>lineare Trennung in ℝ³</small>",
            L: 1, A: 0, B: 0, P: 1, pl: 1, sq: 0, fail: 0, lab: 0, pr: 0, box: 0 },
        { n: "Schritt 6 / 7", t: "Die Ebene wird zur Linie",
            b: "Wir stauchen die Ebene entlang der Blickrichtung. Ihre Querlinien laufen zusammen, das Band wird schmaler — bis nur noch eine Linie übrig ist.",
            f: "wᵀφ(x) + b ⋛ 0<small>Fläche → Kante → Linie</small>",
            L: 1, A: 0, B: 0, P: 1, pl: 1, sq: 1, fail: 0, lab: 1, pr: 0, box: 0 },
        { n: "Schritt 7 / 7", t: "Der Raum fällt auf eine Zahl",
            b: "Punkte und Gitter bewegen sich gemeinsam: dieselbe Abbildung trifft beide. Ringe schrumpfen zu Punkten, Strahlen strecken sich. Rot links, blau rechts.",
            f: "s = wᵀφ(x) + b ∈ ℝ<small>ℝ³ → ℝ, jetzt trennt ein Punkt</small>",
            L: 1, A: 0, B: 0, P: 1, pl: 0, sq: 1, fail: 0, lab: 0, pr: 1, box: 0 }
    ];

    // ---------- Ablauf ----------
    function ease(u) { const s = 1 / (1 + Math.exp(-11 * (u - 0.5)));
        const a = 1 / (1 + Math.exp(5.5)), b = 1 / (1 + Math.exp(-5.5)); return (s - a) / (b - a); }
    function lerp(a, b, u) { return a + (b - a) * u; }
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sub = (t, a, b) => ease(clamp((t - a) / (b - a), 0, 1));

    function updateText() {
        const s = S[cur];
        const elStep = document.getElementById('sm-step');
        const elTitle = document.getElementById('sm-title');
        const elBody = document.getElementById('sm-body');
        const elForm = document.getElementById('sm-formula');
        if (elStep) elStep.textContent = s.n;
        if (elTitle) elTitle.textContent = s.t;
        if (elBody) elBody.textContent = s.b;
        if (elForm) elForm.innerHTML = s.f;
        const bar = document.getElementById('sm-bar');
        if (bar) {
            bar.innerHTML = '';
            S.forEach((_, i) => {
                const e = document.createElement('div');
                e.style.cssText = 'width:24px;height:3px;transition:background .5s;background:' +
                    (i <= cur ? '#ffd166' : '#2a3040') + ';';
                bar.appendChild(e);
            });
        }
    }

    function go(d) {
        const n = clamp(cur + d, 0, S.length - 1);
        if (n === cur) return;
        dA0 = dragA; dB0 = dragB;
        prevIdx = cur; cur = n; t0 = performance.now();
        updateText();
    }

    // ---------- Kamera: Blick von OBEN ----------
    const BASE = () => Math.min(W, H) * 0.30;
    function proj(p) {
        const A = camA + dragA, B = camB + dragB, S0 = BASE() * FIT;
        const x = p.x * Math.cos(A) - p.y * Math.sin(A);
        const y = p.x * Math.sin(A) + p.y * Math.cos(A);
        const y2 = -y * Math.sin(B) + p.z * Math.cos(B);
        const z2 = y * Math.cos(B) + p.z * Math.sin(B);
        const d = 4.6, k = pers < 0.02 ? 1 : d / (d + z2 * 0.80 * pers);
        return { X: W / 2 + x * S0 * k + 170, Y: H / 2 - y2 * S0 * k + YOFF, d: z2, k: k };
    }
    let AX_Y, AX_L, AX_R;
    function axisGeom() { AX_Y = H * 0.80; const S0 = BASE();
        AX_L = W / 2 - S0 * 1.05 + 170; AX_R = W / 2 + S0 * 1.05 + 170; }
    const sx = s => AX_L + (AX_R - AX_L) * Math.max(0, Math.min(1, (s - SMIN) / (SMAX - SMIN)));

    // ---------- gemeinsame Raumabbildung ----------
    function warp(x, y, L, t) {
        const P = proj(LIFT(x, y, L));
        if (t < 0.0005) return { X: P.X, Y: P.Y, k: P.k };
        const tx = sx(SCORE(x, y)), ty = AX_Y - 46 * (1 - t);
        const lift = Math.sin(t * Math.PI) * 34;
        return { X: lerp(P.X, tx, t), Y: lerp(P.Y, ty, t) - lift, k: lerp(P.k, 1, t) };
    }

    // ---------- Gitter ----------
    const N = 14, EXT = 1.12, RES = 64;
    function gridSegs(L, t) {
        const out = [];
        for (let i = 0; i <= N; i++) { const v = -EXT + 2 * EXT * i / N;
            for (const sw of [0, 1]) { const pts = [];
                for (let j = 0; j <= RES; j++) { const u = -EXT + 2 * EXT * j / RES;
                    pts.push(warp(sw ? v : u, sw ? u : v, L, t)); }
                out.push(pts); } }
        return out;
    }

    // ---------- Boden + z-Achse ----------
    function drawBox(al) {
        if (al < 0.01) return;
        const E = EXT, ZT = 1.35, G = 10;
        ctx.globalAlpha = al * 0.26; ctx.fillStyle = '#121a2b';
        const c = [proj({ x: -E, y: -E, z: 0 }), proj({ x: E, y: -E, z: 0 }),
            proj({ x: E, y: E, z: 0 }), proj({ x: -E, y: E, z: 0 })];
        ctx.beginPath(); ctx.moveTo(c[0].X, c[0].Y);
        for (let i = 1; i < 4; i++) ctx.lineTo(c[i].X, c[i].Y);
        ctx.closePath(); ctx.fill();

        ctx.globalAlpha = al * 0.34; ctx.strokeStyle = '#46557a'; ctx.lineWidth = 0.9;
        for (let i = 0; i <= G; i++) { const v = -E + 2 * E * i / G;
            let p = proj({ x: -E, y: v, z: 0 }), q = proj({ x: E, y: v, z: 0 });
            ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke();
            p = proj({ x: v, y: -E, z: 0 }); q = proj({ x: v, y: E, z: 0 });
            ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }

        ctx.globalAlpha = al * 0.20; ctx.strokeStyle = '#5a6b96'; ctx.setLineDash([2, 6]);
        [0.45, 0.90].forEach(zv => { const s = 0.42;
            const r = [proj({ x: -s, y: -s, z: zv }), proj({ x: s, y: -s, z: zv }),
                proj({ x: s, y: s, z: zv }), proj({ x: -s, y: s, z: zv })];
            ctx.beginPath(); ctx.moveTo(r[0].X, r[0].Y);
            for (let i = 1; i < 4; i++) ctx.lineTo(r[i].X, r[i].Y);
            ctx.closePath(); ctx.stroke(); });
        ctx.setLineDash([]);

        ctx.globalAlpha = al * 0.85; ctx.strokeStyle = '#8fa2c8'; ctx.lineWidth = 1.6;
        const o = proj({ x: 0, y: 0, z: 0 }), tp = proj({ x: 0, y: 0, z: ZT });
        ctx.beginPath(); ctx.moveTo(o.X, o.Y); ctx.lineTo(tp.X, tp.Y); ctx.stroke();
        ctx.fillStyle = '#8fa2c8'; ctx.beginPath();
        ctx.moveTo(tp.X, tp.Y - 1); ctx.lineTo(tp.X - 4.5, tp.Y + 11); ctx.lineTo(tp.X + 4.5, tp.Y + 11);
        ctx.closePath(); ctx.fill();
        ctx.lineWidth = 1.2;
        [0.45, 0.90].forEach(zv => { const m = proj({ x: 0, y: 0, z: zv });
            ctx.beginPath(); ctx.moveTo(m.X - 5, m.Y); ctx.lineTo(m.X + 5, m.Y); ctx.stroke(); });
        ctx.font = 'italic 16px Georgia'; ctx.fillText('z', tp.X + 12, tp.Y + 5);
        ctx.font = '12px system-ui,sans-serif'; ctx.fillStyle = '#78849c';
        ctx.fillText('alte 2D-Ebene', c[3].X + 12, c[3].Y - 8);
        ctx.globalAlpha = 1;
    }

    // ---------- Render ----------
    function draw(now) {
        if (!active) return;
        resizeCanvas();
        if (!ctx) { raf = requestAnimationFrame(draw); return; }

        axisGeom();
        const raw = clamp((now - t0) / DUR, 0, 1), u = ease(raw);
        const a = S[prevIdx], b = S[cur];
        const L = lerp(a.L, b.L, u); pers = lerp(a.P, b.P, u);
        const prRaw = lerp(a.pr, b.pr, raw);
        camA = lerp(a.A, b.A, u); camB = lerp(a.B, b.B, u);
        if (!md) { dragA = lerp(dA0, 0, u); dragB = lerp(dB0, 0, u); }
        const flat = 1 - clamp((camB + dragB) / 1.5708, 0, 1);
        FIT = lerp(1.0, 0.34, flat); YOFF = lerp(0, H * 0.10, flat);
        const pl = lerp(a.pl, b.pl, u), sq = lerp(a.sq, b.sq, u),
            fl = lerp(a.fail, b.fail, u), lb = lerp(a.lab, b.lab, u),
            bx = lerp(a.box, b.box, u);
        const fwd = b.pr > a.pr;
        const tCol = fwd ? sub(prRaw, 0, 1) : 1 - sub(1 - prRaw, 0, 1);
        const axA = fwd ? sub(prRaw, 0.05, 0.5) : 1 - sub(1 - prRaw, 0.05, 0.5);

        ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, W, H);

        drawBox(bx);

        if (axA > 0.01) { ctx.globalAlpha = axA; ctx.strokeStyle = '#3c4560'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(AX_L, AX_Y); ctx.lineTo(AX_R, AX_Y); ctx.stroke();
            for (let i = 0; i <= 10; i++) { const X = lerp(AX_L, AX_R, i / 10);
                ctx.beginPath(); ctx.moveTo(X, AX_Y - 4); ctx.lineTo(X, AX_Y + 4); ctx.stroke(); }
            const TX = sx(0); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.moveTo(TX, AX_Y - 36); ctx.lineTo(TX, AX_Y + 36); ctx.stroke();
            ctx.textAlign = 'center'; ctx.fillStyle = '#ffd166'; ctx.font = '13px Georgia';
            ctx.fillText('s = 0', TX, AX_Y + 58);
            ctx.font = '600 13px system-ui,sans-serif';
            ctx.fillStyle = '#ff6b8a'; ctx.fillText('s < 0   innerer Kern', lerp(AX_L, TX, 0.40), AX_Y + 58);
            ctx.fillStyle = '#5ad2ff'; ctx.fillText('s > 0   äußerer Ring', lerp(TX, AX_R, 0.55), AX_Y + 58);
            ctx.textAlign = 'left'; ctx.globalAlpha = 1; }

        ctx.lineWidth = 1;
        const gA = (0.16 + 0.24 * L) * (1 - tCol * 0.35);
        gridSegs(L, tCol).forEach(sg => { ctx.beginPath();
            sg.forEach((p, i) => { i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); });
            ctx.strokeStyle = 'rgba(84,102,140,' + gA + ')'; ctx.stroke(); });

        if (fl > 0.01) { ctx.globalAlpha = fl * 0.7; ctx.lineWidth = 1.6; ctx.strokeStyle = '#8892a8';
            ctx.setLineDash([5, 5]);
            for (let k = 0; k < 5; k++) { const t = k * 0.63 + 0.2;
                const p = proj({ x: Math.cos(t) * -1.2, y: Math.sin(t) * -1.2, z: 0 });
                const q = proj({ x: Math.cos(t) * 1.2, y: Math.sin(t) * 1.2, z: 0 });
                ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
            ctx.setLineDash([]); ctx.globalAlpha = 1; }

        if (bx > 0.01 && L < 0.5) {
            ctx.globalAlpha = bx * 0.30; ctx.fillStyle = '#000';
            PTS.forEach(p => { const s = proj({ x: p.x, y: p.y, z: 0 });
                ctx.beginPath(); ctx.ellipse(s.X, s.Y, 3.2 * s.k, 1.5 * s.k, 0, 0, 6.2832); ctx.fill(); });
            ctx.globalAlpha = 1; }

        const items = [];
        PTS.forEach(p => {
            const P = warp(p.x, p.y, L, tCol);
            const dep = proj(LIFT(p.x, p.y, L)).d;
            items.push({ d: dep, type: 'pt', s: P, c: p.c }); });

        if (pl > 0.01) {
            const E = 0.92, M = 7, rows = [];
            for (let i = 0; i <= M; i++) {
                const yv = (-E + 2 * E * i / M) * (1 - sq), row = [];
                for (let j = 0; j <= M; j++) row.push(proj({ x: -E + 2 * E * j / M, y: yv, z: PLANE_Z }));
                rows.push(row); }
            items.push({ d: PLANE_Z, type: 'plane', rows: rows, a: pl, sq: sq }); }

        items.sort((p, q) => p.d - q.d);

        items.forEach(it => {
            if (it.type === 'plane') {
                const R = it.rows, M = R.length - 1;
                ctx.globalAlpha = it.a * 0.17 * (1 - it.sq);
                ctx.fillStyle = '#ffd166'; ctx.beginPath();
                ctx.moveTo(R[0][0].X, R[0][0].Y);
                for (let j = 1; j <= M; j++) ctx.lineTo(R[0][j].X, R[0][j].Y);
                for (let j = M; j >= 0; j--) ctx.lineTo(R[M][j].X, R[M][j].Y);
                ctx.closePath();
                ctx.fill();

                ctx.globalAlpha = it.a * 0.42 * (1 - it.sq); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1;
                for (let i = 0; i <= M; i++) { ctx.beginPath();
                    R[i].forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y)); ctx.stroke(); }
                for (let j = 0; j <= M; j++) { ctx.beginPath();
                    for (let i = 0; i <= M; i++) { const p = R[i][j]; i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); }
                    ctx.stroke(); }

                const mid = R[Math.floor(M / 2)];
                ctx.globalAlpha = it.a * (0.45 + 0.55 * it.sq); ctx.lineWidth = 1.4 + 2.4 * it.sq;
                ctx.strokeStyle = '#ffd166'; ctx.beginPath();
                mid.forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
                ctx.stroke(); ctx.globalAlpha = 1;
            } else {
                const r = (2.8 + 0.7 * it.s.k) * it.s.k;
                ctx.beginPath(); ctx.arc(it.s.X, it.s.Y, r, 0, 6.2832);
                ctx.fillStyle = it.c ? '#5ad2ff' : '#ff6b8a';
                ctx.globalAlpha = 0.55 + 0.45 * it.s.k; ctx.fill(); ctx.globalAlpha = 1;
            } });

        if (lb > 0.01) { ctx.globalAlpha = lb; ctx.font = '600 14px system-ui,sans-serif';
            const c0 = proj({ x: 0, y: 0, z: PLANE_Z }), LX = W / 2 + BASE() * FIT * 1.12 + 170;
            ctx.fillStyle = '#5ad2ff'; ctx.fillText('Klasse B — äußerer Ring', LX, c0.Y - 58);
            ctx.fillStyle = '#ff6b8a'; ctx.fillText('Klasse A — innerer Kern', LX, c0.Y + 66);
            ctx.fillStyle = '#ffd166'; ctx.font = '13px Georgia';
            ctx.fillText('Trennebene, von der Kante', LX, c0.Y + 4); ctx.globalAlpha = 1; }

        raf = requestAnimationFrame(draw);
    }

    // ---------- Canvas-Setup ----------
    function resizeCanvas() {
        const wrap = document.getElementById('space-morph-wrap');
        const cv = document.getElementById('space-morph-canvas');
        if (!wrap || !cv) return;
        const rect = wrap.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) return;
        if (Math.abs(rect.width - W) < 0.5 && Math.abs(rect.height - H) < 0.5) return;
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = rect.width; H = rect.height;
        cv.width = Math.round(W * DPR);
        cv.height = Math.round(H * DPR);
        ctx = cv.getContext('2d');
        if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function bindDrag() {
        if (dragBound) return;
        const cv = document.getElementById('space-morph-canvas');
        if (!cv) return;
        dragBound = true;
        cv.addEventListener('mousedown', e => { md = true; mx = e.clientX; my = e.clientY; });
        window.addEventListener('mouseup', () => { md = false; });
        window.addEventListener('mousemove', e => { if (!md) return;
            dragA += (e.clientX - mx) * 0.006; dragB += (e.clientY - my) * 0.005;
            dA0 = dragA; dB0 = dragB; mx = e.clientX; my = e.clientY; });
    }

    // ---------- Demo-API (DemoRegistry-Vertrag) ----------
    function isOnSlide() {
        const s = document.querySelector('.slide.active');
        return !!s && s.id === SLIDE_ID;
    }

    function canGoNext() { return active && cur < S.length - 1; }
    function canGoPrev() { return active && cur > 0; }
    function next() { if (canGoNext()) go(1); }
    function prev() { if (canGoPrev()) go(-1); }

    function init() {
        const cv = document.getElementById('space-morph-canvas');
        if (!cv) return;
        active = true;
        bindDrag();
        if (!inited) { inited = true; cur = 0; prevIdx = 0; }
        t0 = performance.now();
        updateText();
        if (!raf) raf = requestAnimationFrame(draw);
    }

    function reset() {
        active = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        cur = 0; prevIdx = 0;
        dragA = 0; dragB = 0; dA0 = 0; dB0 = 0;
        pers = 1; FIT = 1; YOFF = 0;
        if (inited) updateText();
    }

    return { init, reset, next, prev, canGoNext, canGoPrev, isOnSlide };
})();
