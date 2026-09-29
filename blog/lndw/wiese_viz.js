// ============================================================
// WIESE DER WÖRTER (Slide "Wiese der Wörter")
// Port von test/latent_semantic_manifolds_in_llm_very_simple.html.
// Auto-Demo: Maus-Zeiger und beide Regler bewegen sich von selbst
// (Pfeiltasten schalten die Schritte, Auto-Play läuft im Hintergrund).
// Eine echte Maus über dem Canvas übernimmt den Zeiger; beim
// Verlassen übernimmt der Skript-Zeiger wieder von dort.
// ============================================================
const WordMeadow = (() => {
    const WORDS = ["Hund","Katze","Baum","Haus","Auto","Buch","Maus","Lampe","Blume","Stein","Tisch","Stuhl","Wasser","Feuer","Nacht","Sonne","Regen","Mond","Kaffee","Stern","Fluss","Berg","Vogel","Fisch","Milch","Zucker","Tür","Fenster","Brücke","Feld","Küche","Garten","Schiff","Uhr","Weg","Stadt","Brötchen","Apfel","Tee","Hut","Glocke"];
    const HUES = [188,220,260,290,320,350,15,40,60,90,140,170,200,240,280,310,340,25,50,75,120,155,195,230,270,300,330,10,45,100,160,210,250,295,335,20,65,130,185,245,305];

    const CW = 480, CH = 336;
    const DISPLAY_H = 420;
    const N_CHECKPOINTS = [12, 18, 24, 30];
    const N_ANIM_DUR = 2000;
    const T_ANIM_DUR = 1400;
    const PTR_ANIM_DUR = 900;
    const STEP_HOLD = 2400;
    const ROWS_PER_FRAME = 10;
    const LAST_STEP = 5;

    const CAPTIONS = [
        'Jeder Punkt der Wiese ist ein möglicher <b>Zwischengedanke</b>. Die Wörter stecken wie Stifte in der Wiese — <b>das nächstgelegene Wort gewinnt</b>.',
        'Der Punkt ist der aktuelle Gedanke. Das nächste Wort gewinnt hier <b>mit klarem Vorsprung</b> — die Gewinn-Chance ist hoch.',
        'Jetzt liegt der Gedanke auf einem <b>goldenen Band</b>: zwei Wörter sind fast gleich nah → das Modell <b>zögert</b>, die Gewinn-Chance sinkt.',
        'Mehr Wörter → kleinere Zellen, schmalere Bänder. Aber der <b>Anteil</b> der unsicheren Zone bleibt: <b>nie null</b>. Zwischen je zwei Wörtern gibt es immer eine Grenze.',
        '<b>Temperatur</b> = wie offen die Auswahl ist: <b>niedrig</b> → fast immer dasselbe Wort · <b>hoch</b> → viele Wörter im Spiel (der Kreis zeigt die Reichweite).',
        'Genau diese Grenzen machen den <b>Expressibility Gap</b> aus: Der Verlust hat eine Untergrenze, die kein größeres Wörterbuch wegnimmt.'
    ];

    let cv, sN, sT, rN, rT, rWord, rGap, rProb, captionEl, insightEl;
    let inited = false;
    let running = false;
    let rafId = null;

    let currentN = 12;
    let T = 0.8;
    let gapFrac = 0;
    let anchors = [];
    let fieldCache = {};
    let precompQueue = [];
    let precomp = null;

    let step = 0;
    let autoPlay = true;
    let stepStartTime = 0;
    let lastStepAnimDur = 0;
    let tweens = [];

    let pointer = null;
    let scriptTarget = null;
    let realActive = false;
    let realPos = null;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function hsl(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    }

    function smoothstep(a, b, t) {
        t = clamp((t - a) / (b - a), 0, 1);
        return t * t * (3 - 2 * t);
    }

    function gen(n) {
        const rng = mulberry32(7 + n * 13);
        const cols = Math.ceil(Math.sqrt(n * CW / CH)), rows = Math.ceil(n / cols);
        const pts = [];
        for (let i = 0; i < n; i++) {
            const cx = (i % cols), cy = Math.floor(i / cols);
            const jx = (rng() - 0.5) * 0.72, jy = (rng() - 0.5) * 0.72;
            pts.push({
                x: clamp((cx + 0.3 + jx) / cols * CW, 22, CW - 22),
                y: clamp((cy + 0.3 + jy) / rows * CH, 22, CH - 22),
                w: WORDS[i % WORDS.length],
                c: HUES[i % HUES.length]
            });
        }
        return pts;
    }

    function fieldDims(a) {
        const dTyp = Math.sqrt(CW * CH / a.length) * 0.52;
        return { dTyp, epsPx: 0.32 * dTyp, blendW: 0.55 * dTyp };
    }

    function computeFieldRows(a, imgData, y0, y1, dims) {
        let cnt = 0;
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < CW; x++) {
                let d1 = 1e9, d2 = 1e9, i1 = 0;
                for (let i = 0; i < a.length; i++) {
                    const dx = x - a[i].x, dy = y - a[i].y, dd = dx * dx + dy * dy;
                    if (dd < d1) { d2 = d1; i1 = i; d1 = dd; }
                    else if (dd < d2) d2 = dd;
                }
                const m = Math.sqrt(d2) - Math.sqrt(d1);
                const p = (y * CW + x) * 4;
                const q = Math.min(m / dims.dTyp, 1);
                const cellCol = hsl(a[i1].c, 34 + 14 * q, 68 + 14 * q);
                const t = smoothstep(dims.epsPx * 0.4, dims.epsPx + dims.blendW, m);
                imgData.data[p] = Math.round(255 + (cellCol[0] - 255) * t);
                imgData.data[p + 1] = Math.round(205 + (cellCol[1] - 205) * t);
                imgData.data[p + 2] = Math.round(100 + (cellCol[2] - 100) * t);
                imgData.data[p + 3] = 255;
                if (t < 0.4) cnt++;
            }
        }
        return cnt;
    }

    function makeFieldSync(n) {
        const a = gen(n);
        const c = document.createElement('canvas');
        c.width = CW; c.height = CH;
        const cctx = c.getContext('2d');
        const imgData = cctx.createImageData(CW, CH);
        const dims = fieldDims(a);
        let cnt = 0;
        for (let y = 0; y < CH; y++) cnt += computeFieldRows(a, imgData, y, y + 1, dims);
        cctx.putImageData(imgData, 0, 0);
        return { canvas: c, gapFrac: cnt / (CW * CH) };
    }

    function getField(n) {
        if (!fieldCache[n]) fieldCache[n] = makeFieldSync(n);
        return fieldCache[n];
    }

    function queuePrecompute(ns) {
        for (const n of ns) {
            if (fieldCache[n]) continue;
            if (precomp && precomp.N === n) continue;
            if (precompQueue.indexOf(n) === -1) precompQueue.push(n);
        }
    }

    function stepPrecompute() {
        if (precomp) {
            const endRow = Math.min(CH, precomp.row + ROWS_PER_FRAME);
            precomp.cnt += computeFieldRows(precomp.anchors, precomp.imgData, precomp.row, endRow, precomp.dims);
            precomp.row = endRow;
            if (precomp.row >= CH) {
                precomp.ctx.putImageData(precomp.imgData, 0, 0);
                fieldCache[precomp.N] = { canvas: precomp.canvas, gapFrac: precomp.cnt / (CW * CH) };
                precomp = null;
            }
            return;
        }
        if (precompQueue.length) {
            const n = precompQueue.shift();
            if (fieldCache[n]) return;
            const a = gen(n);
            const c = document.createElement('canvas');
            c.width = CW; c.height = CH;
            const cctx = c.getContext('2d');
            const imgData = cctx.createImageData(CW, CH);
            precomp = { N: n, canvas: c, ctx: cctx, imgData, anchors: a, dims: fieldDims(a), row: 0, cnt: 0 };
        }
    }

    function setFieldN(n) {
        currentN = n;
        anchors = gen(n);
        const f = getField(n);
        gapFrac = f.gapFrac;
        if (rGap) rGap.textContent = Math.round(gapFrac * 100) + ' %';
    }

    function setT(t) {
        T = t;
        if (sT) sT.value = Math.round(t * 100);
        if (rT) rT.textContent = t.toFixed(2);
    }

    function marginAt(x, y, a) {
        let d1 = 1e9, d2 = 1e9;
        for (let i = 0; i < a.length; i++) {
            const dx = x - a[i].x, dy = y - a[i].y, dd = dx * dx + dy * dy;
            if (dd < d1) { d2 = d1; d1 = dd; }
            else if (dd < d2) d2 = dd;
        }
        return Math.sqrt(d2) - Math.sqrt(d1);
    }

    function findPoint(a, mode) {
        let best = null, bestM = mode === 'clear' ? -1 : 1e9;
        const GX = 16, GY = 11, M = 30;
        for (let gy = 0; gy < GY; gy++) {
            for (let gx = 0; gx < GX; gx++) {
                const x = M + (gx + 0.5) / GX * (CW - 2 * M);
                const y = M + (gy + 0.5) / GY * (CH - 2 * M);
                const m = marginAt(x, y, a);
                if (mode === 'clear' ? m > bestM : m < bestM) { bestM = m; best = { x, y }; }
            }
        }
        for (let dy = -8; dy <= 8; dy += 2) {
            for (let dx = -8; dx <= 8; dx += 2) {
                const x = best.x + dx, y = best.y + dy;
                if (x < 20 || y < 20 || x > CW - 20 || y > CH - 20) continue;
                const m = marginAt(x, y, a);
                if (mode === 'clear' ? m > bestM : m < bestM) { bestM = m; best = { x, y }; }
            }
        }
        return best;
    }

    function stepTargets(k) {
        switch (k) {
            case 0: return { N: 12, T: 0.8, pointer: null };
            case 1: return { N: 12, T: 0.8, pointer: findPoint(gen(12), 'clear') };
            case 2: return { N: 12, T: 0.8, pointer: findPoint(gen(12), 'boundary') };
            case 3: return { N: 30, T: 0.8, pointer: 'keep' };
            case 4: return { N: 30, T: 2.6, pointer: findPoint(gen(30), 'boundary') };
            case 5: return { N: 30, T: 2.6, pointer: 'keep' };
        }
        return { N: 12, T: 0.8, pointer: null };
    }

    function addTween(tw) { tw.t0 = performance.now(); tweens.push(tw); }
    function removeTweens(tag) {
        for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].tag === tag) tweens.splice(i, 1);
    }

    function updateTweens(now) {
        let active = false;
        for (let i = tweens.length - 1; i >= 0; i--) {
            const tw = tweens[i];
            let u = (now - tw.t0) / tw.dur;
            if (u >= 1) u = 1;
            const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
            tw.onUpdate(tw.from + (tw.to - tw.from) * e, e);
            if (u >= 1) {
                tweens.splice(i, 1);
                if (tw.onDone) tw.onDone();
            } else {
                active = true;
            }
        }
        return active;
    }

    function checkpointAt(f) {
        let best = null;
        for (const c of N_CHECKPOINTS) if (c <= f) best = c;
        return best === null ? N_CHECKPOINTS[0] : best;
    }

    function aimPointer(target) {
        scriptTarget = target;
        removeTweens('ptr');
        const from = pointer ? { x: pointer.x, y: pointer.y } : { x: CW / 2, y: CH / 2 };
        addTween({
            tag: 'ptr', dur: PTR_ANIM_DUR, from: 0, to: 1,
            onUpdate: u => {
                pointer = {
                    x: from.x + (target.x - from.x) * u,
                    y: from.y + (target.y - from.y) * u
                };
            }
        });
    }

    function stepPointerTarget() {
        if (step === 0) return null;
        const t = stepTargets(step);
        if (!t.pointer || t.pointer === 'keep') return null;
        return t.pointer;
    }

    function setPills(k) {
        document.querySelectorAll('#slide-wiese-der-worte .wiese-step').forEach(el => {
            el.classList.toggle('active', +el.getAttribute('data-wstep') === k);
        });
    }

    function setCaption(k) {
        if (captionEl) captionEl.innerHTML = CAPTIONS[k] || '';
    }

    function setInsight(k) {
        if (!insightEl) return;
        if (typeof Presentation !== 'undefined' && Presentation.isFastMode()) return;
        insightEl.classList.toggle('visible', k >= LAST_STEP);
    }

    function animateToStep(k) {
        step = k;
        setCaption(k);
        setPills(k);
        setInsight(k);
        const t = stepTargets(k);
        let maxDur = 0;
        if (t.N !== currentN) {
            removeTweens('n');
            const from = currentN;
            maxDur = Math.max(maxDur, N_ANIM_DUR);
            addTween({
                tag: 'n', dur: N_ANIM_DUR, from: from, to: t.N,
                onUpdate: v => {
                    if (sN) sN.value = Math.round(v);
                    if (rN) rN.textContent = Math.round(v);
                    const cf = checkpointAt(v);
                    if (cf !== currentN) setFieldN(cf);
                },
                onDone: () => {
                    if (sN) sN.value = t.N;
                    if (rN) rN.textContent = t.N;
                    if (currentN !== t.N) setFieldN(t.N);
                }
            });
        }
        if (Math.abs(t.T - T) > 1e-6) {
            removeTweens('t');
            const from = T;
            maxDur = Math.max(maxDur, T_ANIM_DUR);
            addTween({ tag: 't', dur: T_ANIM_DUR, from: from, to: t.T, onUpdate: v => setT(v) });
        }
        if (t.pointer && t.pointer !== 'keep') {
            aimPointer(t.pointer);
            maxDur = Math.max(maxDur, PTR_ANIM_DUR);
        } else if (t.pointer === null) {
            removeTweens('ptr');
            pointer = null;
            scriptTarget = null;
        }
        lastStepAnimDur = maxDur;
        stepStartTime = performance.now();
        draw();
    }

    function applyStateInstant(k) {
        step = k;
        setCaption(k);
        setPills(k);
        setInsight(k);
        removeTweens('n');
        removeTweens('t');
        removeTweens('ptr');
        const t = stepTargets(k);
        if (sN) sN.value = t.N;
        if (rN) rN.textContent = t.N;
        setFieldN(t.N);
        setT(t.T);
        if (t.pointer === null) {
            pointer = null;
            scriptTarget = null;
        } else if (t.pointer !== 'keep') {
            pointer = { x: t.pointer.x, y: t.pointer.y };
            scriptTarget = { x: t.pointer.x, y: t.pointer.y };
        }
        draw();
    }

    function drawPointer(c, P, w, sx, sy) {
        const x = clamp(P.x, 0, CW - 1), y = clamp(P.y, 0, CH - 1);
        const mx = x * sx, my = y * sy;
        const dTyp = Math.sqrt(CW * CH / anchors.length);
        const Tpx = T * dTyp * 1.2 * (w / CW);
        c.beginPath(); c.arc(mx, my, Tpx, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(15,118,110,.55)'; c.lineWidth = 2; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(mx, my, Tpx, 0, Math.PI * 2);
        c.fillStyle = 'rgba(15,118,110,.04)'; c.fill();

        const allD = [];
        for (let i = 0; i < anchors.length; i++) {
            const dx = x - anchors[i].x, dy = y - anchors[i].y;
            allD.push({ i: i, d: Math.sqrt(dx * dx + dy * dy) });
        }
        allD.sort((a, b) => a.d - b.d);
        const near = allD.slice(0, 5);
        const sigma = T * dTyp * 0.5;
        const scores = near.map(cd => ({ i: cd.i, d: cd.d, s: Math.exp(-cd.d / sigma) }));
        const sum = scores.reduce((s2, cd) => s2 + cd.s, 0) || 1;
        const top = scores.slice(0, 5);

        const panelW = 155, panelH = top.length * 26 + 12;
        const right = mx + Tpx + 16;
        const px = (right + panelW > w - 8) ? clamp(mx - Tpx - panelW - 16, 4, w - panelW - 8) : clamp(right, 4, w - panelW - 8);
        const py = clamp(my - panelH / 2, 8, DISPLAY_H - panelH - 8);
        c.fillStyle = 'rgba(255,253,248,.94)';
        c.beginPath(); c.roundRect(px, py, panelW, panelH, 10); c.fill();
        c.strokeStyle = 'rgba(15,118,110,.3)'; c.lineWidth = 1; c.stroke();
        c.font = '700 11px system-ui'; c.fillStyle = 'rgba(40,40,60,.5)'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('Chancen', px + 10, py + 11);
        const barMax = panelW - 78;
        for (let j = 0; j < top.length; j++) {
            const cd = top[j];
            const prob = cd.s / sum;
            const rowY = py + 24 + j * 26;
            c.font = (j === 0 ? '700' : '400') + ' 12px system-ui';
            c.fillStyle = j === 0 ? '#0f766e' : '#5c6272'; c.textAlign = 'left';
            c.fillText(anchors[cd.i].w, px + 10, rowY);
            const bw = Math.max(4, prob * barMax);
            c.fillStyle = 'rgba(15,118,110,.1)';
            c.beginPath(); c.roundRect(px + 56, rowY - 5, barMax, 10, 5); c.fill();
            c.fillStyle = j === 0 ? '#0f766e' : 'rgba(15,118,110,.35)';
            c.beginPath(); c.roundRect(px + 56, rowY - 5, bw, 10, 5); c.fill();
            c.font = '600 10px monospace'; c.fillStyle = j === 0 ? '#0f766e' : '#9aa0b0'; c.textAlign = 'right';
            c.fillText(Math.round(prob * 100) + '%', px + panelW - 8, rowY);
        }

        c.beginPath(); c.arc(mx, my, 7, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,.92)'; c.fill();
        c.strokeStyle = 'rgba(40,40,60,.5)'; c.lineWidth = 2; c.stroke();

        if (!realActive) drawCursor(c, mx, my);

        const winner = top[0];
        if (winner) {
            if (rWord) rWord.textContent = anchors[winner.i].w;
            if (rProb) rProb.textContent = Math.round(winner.s / sum * 100) + ' %';
        }
    }

    function drawCursor(c, x, y) {
        c.save();
        c.translate(x, y);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, 16);
        c.lineTo(3.8, 12.4);
        c.lineTo(6.6, 18.4);
        c.lineTo(9.2, 17.2);
        c.lineTo(6.4, 11.4);
        c.lineTo(11.6, 11);
        c.closePath();
        c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 4; c.shadowOffsetY = 1;
        c.fillStyle = 'rgba(255,255,255,.95)';
        c.fill();
        c.shadowColor = 'transparent';
        c.strokeStyle = 'rgba(30,41,59,.75)'; c.lineWidth = 1.2; c.stroke();
        c.restore();
    }

    function draw() {
        if (!cv || !cv.clientWidth) return;
        const w = cv.clientWidth;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = Math.round(w * dpr), H = Math.round(DISPLAY_H * dpr);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        const c = cv.getContext('2d');
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, w, DISPLAY_H);
        const field = fieldCache[currentN];
        if (!field) return;
        c.imageSmoothingEnabled = true;
        c.imageSmoothingQuality = 'high';
        c.drawImage(field.canvas, 0, 0, w, DISPLAY_H);
        const sx = w / CW, sy = DISPLAY_H / CH;
        const showLabels = currentN <= 20;
        for (const a of anchors) {
            const ax = a.x * sx, ay = a.y * sy;
            c.save();
            c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 6; c.shadowOffsetY = 1;
            c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2);
            c.fillStyle = '#fff'; c.fill();
            c.restore();
            c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2);
            c.strokeStyle = 'rgba(40,40,60,.35)'; c.lineWidth = 1.5; c.stroke();
            if (showLabels) {
                c.font = '600 11px system-ui';
                c.textAlign = 'center'; c.textBaseline = 'top';
                const ly = ay + 11;
                const tw2 = c.measureText(a.w).width;
                c.fillStyle = 'rgba(255,253,248,.82)';
                c.fillRect(ax - tw2 / 2 - 4, ly - 2, tw2 + 8, 16);
                c.fillStyle = 'rgba(40,40,60,.75)';
                c.fillText(a.w, ax, ly + 1);
            }
        }
        const P = realActive ? realPos : pointer;
        if (P) drawPointer(c, P, w, sx, sy);
        else {
            if (rWord) rWord.textContent = '—';
            if (rProb) rProb.textContent = '—';
        }
        if (rGap) rGap.textContent = Math.round(gapFrac * 100) + ' %';
    }

    function loop() {
        if (!running) { rafId = null; return; }
        rafId = requestAnimationFrame(loop);
        const now = performance.now();
        stepPrecompute();
        const animating = updateTweens(now);
        if (autoPlay && step < LAST_STEP && now - stepStartTime > lastStepAnimDur + STEP_HOLD) {
            animateToStep(step + 1);
        }
        if (animating) draw();
    }

    function startLoop() { if (rafId == null) rafId = requestAnimationFrame(loop); }
    function stopLoop() {
        if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function bindEvents() {
        sN.addEventListener('input', () => {
            removeTweens('n');
            autoPlay = false;
            const n = +sN.value;
            rN.textContent = n;
            if (n !== currentN) setFieldN(n);
            draw();
        });
        sT.addEventListener('input', () => {
            removeTweens('t');
            autoPlay = false;
            setT(+sT.value / 100);
            draw();
        });
        cv.addEventListener('pointermove', e => {
            if (!running) return;
            const r = cv.getBoundingClientRect();
            realPos = {
                x: (e.clientX - r.left) / r.width * CW,
                y: (e.clientY - r.top) / r.height * CH
            };
            realActive = true;
            draw();
        });
        cv.addEventListener('pointerleave', () => {
            if (!realActive) return;
            realActive = false;
            if (realPos) {
                pointer = { x: realPos.x, y: realPos.y };
                const target = stepPointerTarget();
                if (target) aimPointer(target);
            }
            realPos = null;
            draw();
        });
        window.addEventListener('resize', () => { if (running) draw(); });
    }

    function initEls() {
        if (inited) return;
        cv = document.getElementById('wiese-canvas');
        sN = document.getElementById('wiese-sN');
        sT = document.getElementById('wiese-sT');
        rN = document.getElementById('wiese-rN');
        rT = document.getElementById('wiese-rT');
        rWord = document.getElementById('wiese-rWord');
        rGap = document.getElementById('wiese-rGap');
        rProb = document.getElementById('wiese-rProb');
        captionEl = document.getElementById('wiese-caption');
        insightEl = document.getElementById('wiese-gap-insight');
        if (!cv || !sN || !sT) return;
        inited = true;
        bindEvents();
    }

    function isOnSlide() {
        const a = document.querySelector('.slide.active');
        return !!(a && a.id === 'slide-wiese-der-worte');
    }

    function enter() {
        initEls();
        if (!inited) return;
        if (!fieldCache[12]) fieldCache[12] = makeFieldSync(12);
        queuePrecompute([18, 24, 30]);
        applyStateInstant(0);
        running = true;
        autoPlay = true;
        stepStartTime = performance.now();
        startLoop();
    }

    function leave() {
        running = false;
        autoPlay = false;
        realActive = false;
        realPos = null;
        removeTweens('n');
        removeTweens('t');
        removeTweens('ptr');
        stopLoop();
    }

    function canGoNext() {
        if (!inited || !isOnSlide()) return false;
        if (!running) enter();
        return step < LAST_STEP;
    }

    function canGoPrev() {
        if (!inited || !isOnSlide()) return false;
        if (!running) enter();
        return step > 0;
    }

    function next() {
        if (!canGoNext()) return;
        autoPlay = false;
        animateToStep(step + 1);
    }

    function prev() {
        if (!canGoPrev()) return;
        autoPlay = false;
        applyStateInstant(step - 1);
        stepStartTime = performance.now();
        lastStepAnimDur = 0;
    }

    function precomputeAll() {
        for (const n of N_CHECKPOINTS) if (!fieldCache[n]) fieldCache[n] = makeFieldSync(n);
        initEls();
        if (inited) applyStateInstant(0);
    }

    return { isOnSlide, enter, leave, canGoNext, canGoPrev, next, prev, precomputeAll };
})();
