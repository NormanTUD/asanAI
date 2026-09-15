// ============================================================
// J-SPACE VISUALIZATION v3 – Überarbeitet
// Global Workspace Theory → J-Lens → J-Space
// Neu geordnet (Beispiel vor Maschinerie), einheitliches Theme,
// klarer für Laien.
// ============================================================
const JSpaceViz = (() => {
    let currentStep = 0;
    const totalSteps = 6;
    let activeAnimation = null;
    let animationRunning = false;

    // Gemeinsames, einheitliches (dunkles) Theme
    const THEME = {
        bgTop: '#0f172a',
        bgBottom: '#1e1b4b',
        title: '#e2e8f0',
        sub: '#94a3b8',
        accent: '#6366f1',
        intermediate: '#f59e0b',
        answer: '#10b981',
        outside: '#94a3b8',
        danger: '#ef4444',
        card: 'rgba(15, 23, 42, 0.9)',
    };

    function darkBg(ctx, W, H) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, THEME.bgTop);
        g.addColorStop(1, THEME.bgBottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    function isOnJSpaceSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'J-Space';
    }

    function canGoNext() {
        if (!isOnJSpaceSlide()) return false;
        return currentStep < totalSteps - 1;
    }

    function canGoPrev() {
        if (!isOnJSpaceSlide()) return false;
        return currentStep > 0;
    }

    function next() {
        if (!canGoNext()) return;
        currentStep++;
        renderStep(currentStep);
    }

    function prev() {
        if (!canGoPrev()) return;
        currentStep--;
        renderStep(currentStep);
    }

    function reset() {
        currentStep = 0;
        stopAllAnimations();
    }

    function stopAllAnimations() {
        animationRunning = false;
        if (activeAnimation) {
            cancelAnimationFrame(activeAnimation);
            activeAnimation = null;
        }
    }

    function safeCanvasSetup(container, bgColor) {
        const wrapId = 'jspace-canvas-wrap';
        const canvasId = 'jspace-canvas';

        container.innerHTML = `<div id="${wrapId}" style="position:relative;width:100%;height:480px;overflow:hidden;">` +
            `<canvas id="${canvasId}" style="width:100%;height:100%;display:block;border-radius:10px;background:${THEME.bgTop};"></canvas></div>`;

        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const wrap = document.getElementById(wrapId);
        if (!wrap) return null;

        const rect = wrap.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) return null;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.scale(dpr, dpr);

        return { canvas, ctx, W: rect.width, H: rect.height, dpr };
    }

    // ============================================================
    // RENDER DISPATCHER
    // ============================================================
    function renderStep(step) {
        stopAllAnimations();
        const container = document.getElementById('jspace-viz-container');
        if (!container) return;

        document.querySelectorAll('[data-jstep]').forEach(el => {
            const s = parseInt(el.getAttribute('data-jstep'));
            el.classList.toggle('active', s === step);
        });

        const captions = [
            '<b>Spezialisierte Module:</b> Viele Fachbereiche – Sehen, Sprache, Motorik – arbeiten parallel und isoliert. Keiner kann in die Interna der anderen schauen.',
            '<b>Global Workspace (Baars, 1988):</b> Die Module posten ihre <i>Ergebnisse</i> in eine zentrale Arena – den "Workspace". Wir sehen nur das Ergebnis, nie die interne Berechnung. (So erklärt die Theorie unser Bewusstsein.)',
            '<b>Das Rätsel:</b> Frag das Modell: „…das Tier, das Netze spinnt, hat wie viele Beine?" – Intern tauchen Zwischengedanken auf: <i>Spinne … 8</i>. Die sagt es aber <b>nicht</b>. Wie könnten wir sie sehen?',
            '<b>Die J-Lens:</b> Die <b>Jacobian Lens</b> macht genau das sichtbar – sie zeigt die Wörter, die eine interne Aktivierung <i>gerade dazu bringt, gesagt zu werden</i>. Hier taucht <b>spider</b> auf (steht nie im Prompt!) → dann <b>8</b>.',
            '<b>Der Jacobian als Decoder:</b> Er ordnet jedem Wort eine <i>Richtung</i> im internen Raum zu. Je stärker der aktuelle Zustand in diese Richtung zeigt, desto wahrscheinlicher wird das Wort. Die J-Lens liest diese Zuordnung ab – so wird das Innere des Modells sichtbar.',
            '<b>Stilles Denken:</b> So kann das Modell Erkenntnisse <i>zwischenspeichern, ohne sie auszusprechen</i> – und still komplexere Probleme lösen. Der J-Space hat sich dabei <b>selbst</b> entwickelt: vom Optimierer gefunden, weil er <i>nützt</i>.'
        ];
        const captionEl = document.getElementById('jspace-caption');
        if (captionEl) captionEl.innerHTML = captions[step] || '';

        switch (step) {
            case 0: renderBrainModules(container); break;
            case 1: renderGlobalWorkspace(container); break;
            case 2: renderRiddle(container); break;
            case 3: renderJLensExample(container); break;
            case 4: renderJacobian(container); break;
            case 5: renderSilentThinking(container); break;
        }
    }

    // ============================================================
    // STEP 0: Spezialisierte Gehirn-Module
    // ============================================================
    function renderBrainModules(container) {
        const setup = safeCanvasSetup(container);
        if (!setup) return;
        const { ctx, W, H } = setup;

        const modules = [
            { x: W * 0.15, y: H * 0.32, label: 'Visuelle\nMuster', color: '#3b82f6', examples: 'Kanten, Formen, Farben' },
            { x: W * 0.38, y: H * 0.2, label: 'Gesichter\nerkennen', color: '#8b5cf6', examples: '"Das ist Maria"' },
            { x: W * 0.62, y: H * 0.2, label: 'Sprache\nverstehen', color: '#10b981', examples: 'Grammatik, Bedeutung' },
            { x: W * 0.85, y: H * 0.32, label: 'Bewegung\nplanen', color: '#f59e0b', examples: 'Hand heben, laufen' },
            { x: W * 0.25, y: H * 0.72, label: 'Emotionen\nbewerten', color: '#ef4444', examples: 'Angst, Freude, Ekel' },
            { x: W * 0.75, y: H * 0.72, label: 'Gedächtnis\nabrufen', color: '#06b6d4', examples: '"Gestern war ich..."' },
        ];

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            darkBg(ctx, W, H);

            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = THEME.title;
            ctx.textAlign = 'center';
            ctx.fillText('Spezialisierte Module im Gehirn', W / 2, 30);
            ctx.font = '12px system-ui';
            ctx.fillStyle = THEME.sub;
            ctx.fillText('Jedes Modul arbeitet für sich – keines kann in die Interna der anderen schauen.', W / 2, 50);

            modules.forEach((mod, i) => {
                const pulse = 1 + 0.05 * Math.sin(t * 0.04 + i * 1.2);
                const radius = 44 * pulse;

                const glow = ctx.createRadialGradient(mod.x, mod.y, 0, mod.x, mod.y, radius * 1.5);
                glow.addColorStop(0, mod.color + '25');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(mod.x, mod.y, radius * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(mod.x, mod.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = mod.color + '18';
                ctx.fill();
                ctx.strokeStyle = mod.color;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.font = 'bold 12px system-ui';
                ctx.fillStyle = mod.color;
                ctx.textAlign = 'center';
                const lines = mod.label.split('\n');
                lines.forEach((line, li) => {
                    ctx.fillText(line, mod.x, mod.y - 4 + li * 15);
                });

                ctx.font = '10px system-ui';
                ctx.fillStyle = THEME.sub;
                ctx.fillText(mod.examples, mod.x, mod.y + radius + 16);

                ctx.font = '13px system-ui';
                ctx.fillText('🔒', mod.x + radius - 6, mod.y - radius + 6);
            });

            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
            ctx.lineWidth = 1;
            for (let i = 0; i < modules.length; i++) {
                for (let j = i + 1; j < modules.length; j++) {
                    ctx.beginPath();
                    ctx.moveTo(modules[i].x, modules[i].y);
                    ctx.lineTo(modules[j].x, modules[j].y);
                    ctx.stroke();
                }
            }
            ctx.setLineDash([]);

            const qPulse = 0.5 + 0.35 * Math.sin(t * 0.03);
            ctx.font = 'bold 17px system-ui';
            ctx.fillStyle = `rgba(226, 232, 240, ${qPulse})`;
            ctx.textAlign = 'center';
            ctx.fillText('Wie kommunizieren sie?', W / 2, H / 2 + 6);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 1: Global Workspace Theory
    // ============================================================
    function renderGlobalWorkspace(container) {
        const setup = safeCanvasSetup(container);
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2;
        const wsRadius = 72;

        const modules = [
            { angle: 0, label: 'Visuell', color: '#3b82f6', result: '"Gesicht erkannt"' },
            { angle: Math.PI * 0.4, label: 'Sprache', color: '#10b981', result: '"Subjekt: Maria"' },
            { angle: Math.PI * 0.8, label: 'Emotion', color: '#ef4444', result: '"positiv"' },
            { angle: Math.PI * 1.2, label: 'Gedächtnis', color: '#06b6d4', result: '"bekannt seit 2019"' },
            { angle: Math.PI * 1.6, label: 'Motorik', color: '#f59e0b', result: '"winken"' },
        ];

        const orbitR = 160;

        animationRunning = true;
        let t = 0;
        let particles = [];

        function draw() {
            if (!animationRunning) return;
            t++;

            darkBg(ctx, W, H);

            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = THEME.title;
            ctx.textAlign = 'center';
            ctx.fillText('Global Workspace Theory', W / 2, 26);
            ctx.font = '12px system-ui';
            ctx.fillStyle = THEME.sub;
            ctx.fillText('Module schreiben ihre ERGEBNISSE an einen zentralen Ort – den "Workspace"', W / 2, 46);

            const wsGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, wsRadius * 2);
            wsGlow.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
            wsGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = wsGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, wsRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, wsRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#c7d2fe';
            ctx.textAlign = 'center';
            ctx.fillText('BEWUSSTSEIN', cx, cy - 12);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#818cf8';
            ctx.fillText('(Global Workspace)', cx, cy + 5);
            ctx.font = '10px system-ui';
            ctx.fillStyle = THEME.sub;
            ctx.fillText('Nur Ergebnisse sichtbar', cx, cy + 22);
            ctx.fillText('Nie die Interna!', cx, cy + 35);

            modules.forEach((mod, i) => {
                const mx = cx + Math.cos(mod.angle) * orbitR;
                const my = cy + Math.sin(mod.angle) * orbitR;

                const arrowAlpha = 0.3 + 0.2 * Math.sin(t * 0.03 + i * 1.5);
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(cx + Math.cos(mod.angle) * (wsRadius + 10), cy + Math.sin(mod.angle) * (wsRadius + 10));
                ctx.strokeStyle = mod.color + Math.round(arrowAlpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = 2;
                ctx.stroke();

                const tipAngle = Math.atan2(cy - my, cx - mx);
                const tipX = cx + Math.cos(mod.angle) * (wsRadius + 12);
                const tipY = cy + Math.sin(mod.angle) * (wsRadius + 12);
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - 8 * Math.cos(tipAngle - 0.3), tipY - 8 * Math.sin(tipAngle - 0.3));
                ctx.lineTo(tipX - 8 * Math.cos(tipAngle + 0.3), tipY - 8 * Math.sin(tipAngle + 0.3));
                ctx.closePath();
                ctx.fillStyle = mod.color + '90';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(mx, my, 32, 0, Math.PI * 2);
                ctx.fillStyle = mod.color + '18';
                ctx.fill();
                ctx.strokeStyle = mod.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.font = 'bold 11px system-ui';
                ctx.fillStyle = mod.color;
                ctx.textAlign = 'center';
                ctx.fillText(mod.label, mx, my - 2);

                ctx.font = '10px system-ui';
                ctx.fillStyle = '#cbd5e1';
                const labelX = mx + Math.cos(mod.angle) * 44;
                const labelY = my + Math.sin(mod.angle) * 44;
                ctx.fillText(mod.result, labelX, labelY);
            });

            if (t % 20 === 0) {
                const srcIdx = Math.floor(Math.random() * modules.length);
                const mod = modules[srcIdx];
                particles.push({
                    x: cx + Math.cos(mod.angle) * orbitR,
                    y: cy + Math.sin(mod.angle) * orbitR,
                    progress: 0,
                    color: mod.color,
                    speed: 0.02 + Math.random() * 0.01
                });
            }

            particles = particles.filter(p => p.progress < 1);
            particles.forEach(p => {
                p.progress += p.speed;
                const ease = p.progress * p.progress * (3 - 2 * p.progress);
                const px = p.x + (cx - p.x) * ease;
                const py = p.y + (cy - p.y) * ease;
                const alpha = 1 - p.progress;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.round(alpha * 200).toString(16).padStart(2, '0');
                ctx.fill();
            });

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 2: Das Rätsel (Hook) – versteckte Zwischengedanken
    // ============================================================
    function renderRiddle(container) {
        const setup = safeCanvasSetup(container);
        if (!setup) return;
        const { ctx, W, H } = setup;

        const hidden = [
            { word: 'Spinne', x: 0.34, delay: 50 },
            { word: '8', x: 0.7, delay: 130 },
        ];

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            darkBg(ctx, W, H);

            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = THEME.title;
            ctx.textAlign = 'center';
            ctx.fillText('Das Rätsel: versteckte Zwischengedanken', W / 2, 28);
            ctx.font = '12px system-ui';
            ctx.fillStyle = THEME.sub;
            ctx.fillText('Das Modell denkt mehr, als es sagt – aber wir sehen es nicht.', W / 2, 48);

            // Prompt-Box
            const py = 68;
            ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
            ctx.beginPath();
            ctx.roundRect(30, py, W - 60, 42, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(30, py, W - 60, 42, 8);
            ctx.stroke();
            ctx.font = '13px monospace';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText('"…das Tier, das Netze spinnt, hat wie viele Beine?"', W / 2, py + 26);

            // Pfeil Prompt -> Zone
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(W / 2, py + 42);
            ctx.lineTo(W / 2, 138);
            ctx.stroke();

            // Hidden Zone
            const zoneY = 148;
            const zoneH = 180;
            ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
            ctx.beginPath();
            ctx.roundRect(50, zoneY, W - 100, zoneH, 12);
            ctx.fill();
            ctx.setLineDash([6, 5]);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.28)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(50, zoneY, W - 100, zoneH, 12);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '11px system-ui';
            ctx.fillStyle = THEME.sub;
            ctx.textAlign = 'center';
            ctx.fillText('intern im Modell  ·  aber nicht sichtbar', W / 2, zoneY + 24);

            // Verbindung zwischen den beiden Gedanken
            if (t > 150) {
                const ax = 50 + hidden[0].x * (W - 100);
                const bx = 50 + hidden[1].x * (W - 100);
                const ay = zoneY + zoneH / 2 + 12;
                const fade = Math.min(0.5, (t - 150) / 40);
                ctx.globalAlpha = fade;
                ctx.strokeStyle = '#64748b';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(ax + 46, ay);
                ctx.lineTo(bx - 20, ay);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }

            // Gedankentokens (gedimmt + gesperrt)
            hidden.forEach((tok, i) => {
                const age = t - tok.delay;
                if (age < 0) return;
                const fadeIn = Math.min(0.5, age / 40);
                const x = 50 + tok.x * (W - 100);
                const y = zoneY + zoneH / 2 + 12;
                const bob = Math.sin(t * 0.03 + i) * 2;

                ctx.globalAlpha = fadeIn;
                ctx.font = 'bold 20px monospace';
                const tw = ctx.measureText(tok.word).width;
                const bw = tw + 40, bh = 46;

                ctx.fillStyle = THEME.card;
                ctx.beginPath();
                ctx.roundRect(x - bw / 2, y + bob - bh / 2, bw, bh, 8);
                ctx.fill();
                ctx.setLineDash([5, 4]);
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x - bw / 2, y + bob - bh / 2, bw, bh, 8);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#cbd5e1';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tok.word, x, y + bob);

                ctx.font = '15px system-ui';
                ctx.fillText('🔒', x + bw / 2 - 14, y + bob - bh / 2 + 12);

                ctx.globalAlpha = 1;
                ctx.textBaseline = 'alphabetic';
            });

            // Frage unten
            const qPulse = 0.55 + 0.4 * Math.sin(t * 0.05);
            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0.45, qPulse)})`;
            ctx.textAlign = 'center';
            ctx.fillText('🔍  Wie könnten wir diese Gedanken sehen?', W / 2, H - 24);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 3: J-Lens am realen Beispiel (der Payoff)
    // ============================================================
    function renderJLensExample(container) {
        const setup = safeCanvasSetup(container);
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2;

        const prompt = '"The number of legs on the animal that spins webs is"';
        const answer = '→ 8';

        const thoughts = [
            { word: 'webs', x: 0.15, y: 0.25, color: '#94a3b8', delay: 20, size: 12, type: 'input' },
            { word: 'animal', x: 0.35, y: 0.2, color: '#94a3b8', delay: 30, size: 12, type: 'input' },
            { word: 'legs', x: 0.7, y: 0.22, color: '#94a3b8', delay: 40, size: 12, type: 'input' },
            { word: 'spider', x: 0.4, y: 0.5, color: '#f59e0b', delay: 80, size: 16, type: 'intermediate' },
            { word: 'arachnid', x: 0.6, y: 0.45, color: '#f59e0b', delay: 100, size: 13, type: 'intermediate' },
            { word: 'eight', x: 0.5, y: 0.72, color: '#10b981', delay: 140, size: 17, type: 'answer' },
            { word: '8', x: 0.55, y: 0.82, color: '#10b981', delay: 160, size: 19, type: 'answer' },
        ];

        const connections = [
            { from: 0, to: 3 },
            { from: 1, to: 3 },
            { from: 3, to: 5 },
            { from: 2, to: 5 },
            { from: 4, to: 5 },
        ];

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            darkBg(ctx, W, H);

            ctx.font = 'bold 15px system-ui';
            ctx.fillStyle = THEME.title;
            ctx.textAlign = 'center';
            ctx.fillText('Die J-Lens: Zwischenschritte im Modell sichtbar machen', W / 2, 24);

            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.beginPath();
            ctx.roundRect(20, 38, W - 40, 36, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(20, 38, W - 40, 36, 8);
            ctx.stroke();
            ctx.font = '12px monospace';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText(prompt, W / 2, 60);

            if (t > 170) {
                const fadeIn = Math.min(1, (t - 170) / 30);
                ctx.globalAlpha = fadeIn;
                ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
                ctx.beginPath();
                ctx.roundRect(W / 2 - 60, H - 55, 120, 36, 8);
                ctx.fill();
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(W / 2 - 60, H - 55, 120, 36, 8);
                ctx.stroke();
                ctx.font = 'bold 18px monospace';
                ctx.fillStyle = '#10b981';
                ctx.textAlign = 'center';
                ctx.fillText(answer, W / 2, H - 32);
                ctx.globalAlpha = 1;
            }

            const workY = 85;
            const workH = H - 150;

            connections.forEach(conn => {
                const from = thoughts[conn.from];
                const to = thoughts[conn.to];
                const fromAge = t - from.delay;
                const toAge = t - to.delay;
                if (fromAge < 20 || toAge < 0) return;

                const fadeIn = Math.min(1, (toAge) / 30);
                const fx = 40 + from.x * (W - 80);
                const fy = workY + from.y * workH;
                const tx = 40 + to.x * (W - 80);
                const ty = workY + to.y * workH;

                ctx.globalAlpha = fadeIn * 0.4;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                const angle = Math.atan2(ty - fy, tx - fx);
                const tipX = tx - Math.cos(angle) * 15;
                const tipY = ty - Math.sin(angle) * 15;
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - 6 * Math.cos(angle - 0.4), tipY - 6 * Math.sin(angle - 0.4));
                ctx.lineTo(tipX - 6 * Math.cos(angle + 0.4), tipY - 6 * Math.sin(angle + 0.4));
                ctx.closePath();
                ctx.fillStyle = '#6366f1';
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            thoughts.forEach((thought, i) => {
                const age = t - thought.delay;
                if (age < 0) return;

                const fadeIn = Math.min(1, age / 25);
                const x = 40 + thought.x * (W - 80);
                const y = workY + thought.y * workH;
                const bob = Math.sin(t * 0.03 + i * 1.2) * 2;

                ctx.globalAlpha = fadeIn;

                const glowR = thought.type === 'answer' ? 30 : thought.type === 'intermediate' ? 25 : 15;
                const glow = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, glowR);
                glow.addColorStop(0, thought.color + '45');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y + bob, glowR, 0, Math.PI * 2);
                ctx.fill();

                ctx.font = `bold ${thought.size}px monospace`;
                const textW = ctx.measureText(thought.word).width;
                const boxW = textW + 14;
                const boxH = thought.size + 12;

                ctx.fillStyle = THEME.card;
                ctx.beginPath();
                ctx.roundRect(x - boxW / 2, y + bob - boxH / 2, boxW, boxH, 5);
                ctx.fill();

                const borderColor = thought.type === 'input' ? '#64748b' :
                    thought.type === 'intermediate' ? '#f59e0b' : '#10b981';
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = thought.type === 'answer' ? 2.5 : 1.5;
                ctx.beginPath();
                ctx.roundRect(x - boxW / 2, y + bob - boxH / 2, boxW, boxH, 5);
                ctx.stroke();

                ctx.fillStyle = thought.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(thought.word, x, y + bob);
                ctx.textBaseline = 'alphabetic';

                if (thought.type === 'intermediate' && age > 30) {
                    ctx.font = '9px system-ui';
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
                    ctx.fillText('← J-Lens deckt auf', x + boxW / 2 + 8, y + bob + 3);
                }

                ctx.globalAlpha = 1;
            });

            ctx.font = '11px system-ui';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('● Grau = Input-Tokens', 12, H - 10);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('● Orange = Zwischenschritte (nur J-Lens sieht sie!)', 165, H - 10);
            ctx.fillStyle = '#10b981';
            ctx.fillText('● Grün = Antwort', W - 140, H - 10);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 4 (Jacobian): Der Jacobian als Decoder
    // ============================================================
    function renderJacobian(container) {
        const setup = safeCanvasSetup(container);
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W * 0.30;
        const cy = H * 0.52;
        const R  = Math.min(W * 0.15, H * 0.22);

        const dirs = [
            { label: 'Spinne', angle: -Math.PI / 6,    color: '#f59e0b' },
            { label: 'acht',   angle:  Math.PI / 2,     color: '#10b981' },
            { label: 'Netz',   angle: -5 * Math.PI / 6, color: '#ef4444' },
        ];

        const arrow = (x1, y1, x2, y2, color, width) => {
            const a = Math.atan2(y2 - y1, x2 - x1);
            ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 8 * Math.cos(a - 0.35), y2 - 8 * Math.sin(a - 0.35));
            ctx.lineTo(x2 - 8 * Math.cos(a + 0.35), y2 - 8 * Math.sin(a + 0.35));
            ctx.closePath(); ctx.fill();
        };
        const dot = (x, y, r, color) => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
        };

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            darkBg(ctx, W, H);

            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = THEME.title;
            ctx.textAlign = 'center';
            ctx.fillText('Der Jacobian als Decoder', W / 2, 28);
            ctx.font = '12px system-ui';
            ctx.fillStyle = THEME.sub;
            ctx.fillText('Jedes Wort hat eine Richtung im internen Raum. Je staerker der Zustand in diese Richtung zeigt, desto wahrscheinlicher wird das Wort.', W / 2, 48);

            // --- Linkes Panel: interner Raum ---
            const dirLen = R * 1.2;
            const pw = Math.min(W * 0.48, 380);
            const ph = Math.min(H - 160, 330);
            const plx = cx - pw / 2, ply = cy - ph / 2;

            ctx.fillStyle = 'rgba(99,102,241,0.06)';
            ctx.beginPath(); ctx.roundRect(plx, ply, pw, ph, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(99,102,241,0.25)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(plx, ply, pw, ph, 12); ctx.stroke();

            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#c7d2fe';
            ctx.textAlign = 'center';
            ctx.fillText('Interner Raum (Schicht \u2113)', cx, ply - 6);

            // dezentem Gitter
            ctx.strokeStyle = 'rgba(148,163,184,0.1)'; ctx.lineWidth = 1;
            for (let i = -2; i <= 2; i++) {
                const g = i * pw / 6;
                ctx.beginPath(); ctx.moveTo(cx + g, ply); ctx.lineTo(cx + g, ply + ph); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(plx, cy + g); ctx.lineTo(plx + pw, cy + g); ctx.stroke();
            }

            // Wort-Richtungspfeile
            dirs.forEach(d => {
                const ex = cx + Math.cos(d.angle) * dirLen;
                const ey = cy + Math.sin(d.angle) * dirLen;
                arrow(cx, cy, ex, ey, d.color, 2);
                ctx.font = 'bold 12px system-ui';
                ctx.fillStyle = d.color;
                ctx.textAlign = 'center';
                ctx.fillText(d.label, ex + Math.cos(d.angle) * 18, ey + Math.sin(d.angle) * 18 + 4);
            });

            // rotierender Zustands-Vektor
            const sAngle = t * 0.018;
            const sx = cx + R * Math.cos(sAngle);
            const sy = cy + R * Math.sin(sAngle);
            arrow(cx, cy, sx, sy, '#6366f1', 3);

            // Beschriftung Zustand
            const stateLabelAngle = sAngle;
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#a5b4fc';
            ctx.textAlign = 'center';
            ctx.fillText('Zustand', sx + Math.cos(stateLabelAngle) * 16, sy + Math.sin(stateLabelAngle) * 16 + 4);

            // Projektionen auf Wort-Richtungen
            dirs.forEach(d => {
                const dx = Math.cos(d.angle);
                const dy = Math.sin(d.angle);
                const proj = (sx - cx) * dx + (sy - cy) * dy;
                const fx = cx + proj * dx;
                const fy = cy + proj * dy;

                if (proj > 2) {
                    // helle Linie auf dem Richtungspfeil
                    ctx.strokeStyle = d.color;
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(fx, fy); ctx.stroke();
                    ctx.globalAlpha = 1;
                    // Punkt am Fu\u00dfe
                    ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2);
                    ctx.fillStyle = d.color; ctx.fill();
                }

                // gestrichelte Linie: Zustand -> Fu\u00df auf Richtung
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = d.color + '40';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(fx, fy); ctx.stroke();
                ctx.setLineDash([]);
            });

            // --- Rechtes Panel: Was die J-Lens liest ---
            const rx = W * 0.62;
            const ry = H * 0.22;
            const barMax = W * 0.28;
            const barH = 26;
            const gap = 50;

            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'left';
            ctx.fillText('Was die J-Lens liest:', rx, ry);

            let maxProj = 0;
            const projs = dirs.map(d => {
                const dx = Math.cos(d.angle);
                const dy = Math.sin(d.angle);
                const p = Math.max(0, (sx - cx) * dx + (sy - cy) * dy);
                if (p > maxProj) maxProj = p;
                return p;
            });

            dirs.forEach((d, i) => {
                const norm = projs[i] / R;
                const isMax = projs[i] === maxProj && maxProj > 2;
                const by = ry + 24 + i * gap;

                ctx.font = isMax ? 'bold 13px system-ui' : '13px system-ui';
                ctx.fillStyle = isMax ? d.color : '#64748b';
                ctx.textAlign = 'left';
                ctx.fillText(d.label, rx, by + barH / 2 + 4);

                ctx.fillStyle = 'rgba(148,163,184,0.1)';
                ctx.beginPath(); ctx.roundRect(rx + 65, by, barMax, barH, 4); ctx.fill();

                const fw = barMax * norm;
                if (fw > 0) {
                    ctx.fillStyle = isMax ? d.color + 'cc' : d.color + '44';
                    ctx.beginPath(); ctx.roundRect(rx + 65, by, fw, barH, 4); ctx.fill();
                }

                if (isMax) {
                    ctx.strokeStyle = d.color;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.roundRect(rx + 65, by, barMax, barH, 4); ctx.stroke();
                }
            });

            // --- Erkl\u00e4rungsbox unten ---
            const ey = H - 56;
            ctx.fillStyle = 'rgba(99,102,241,0.08)';
            ctx.beginPath(); ctx.roundRect(W * 0.05, ey, W * 0.90, 42, 10); ctx.fill();
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(W * 0.05, ey, W * 0.90, 42, 10); ctx.stroke();
            ctx.font = '11px system-ui'; ctx.fillStyle = '#c7d2fe'; ctx.textAlign = 'center';
            ctx.fillText('Der Jacobian = feste Regel (per Backprop \u00b7 ~1000 Kontexte gemittelt): \u201eWelche Richtung im internen Raum = welches Wort?\u201c', W / 2, ey + 17);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Die J-Lens misst den aktuellen Zustand gegen diese Richtungen \u2192 so liest sie das Innere des Modells.', W / 2, ey + 35);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 5: Stilles Denken – Konzepte die das Modell denkt aber nicht sagt
    // ============================================================
    function renderSilentThinking(container) {
        const setup = safeCanvasSetup(container);
        if (!setup) return;
        const { ctx, W, H } = setup;

        const scenario = {
            prompt: 'Aufgabe: "Verbessere die Performance des Systems"',
            action: 'Claude editiert stattdessen direkt die Score-Datei mit falschen Werten.',
            silentThoughts: [
                { word: 'manipulation', x: 0.2, y: 0.3, delay: 40 },
                { word: 'realistic', x: 0.5, y: 0.25, delay: 70 },
                { word: 'fake', x: 0.8, y: 0.35, delay: 100 },
                { word: 'percentile', x: 0.35, y: 0.55, delay: 130 },
                { word: 'score', x: 0.65, y: 0.5, delay: 160 },
                { word: 'deception', x: 0.5, y: 0.72, delay: 190 }
            ]
        };

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            darkBg(ctx, W, H);

            ctx.font = 'bold 15px system-ui';
            ctx.fillStyle = THEME.title;
            ctx.textAlign = 'center';
            ctx.fillText('Stilles Denken: Was das Modell denkt, aber NICHT sagt', W / 2, 24);

            // Prompt-Box oben
            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.beginPath();
            ctx.roundRect(20, 44, W - 40, 44, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(20, 44, W - 40, 44, 8);
            ctx.stroke();
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'left';
            ctx.fillText('Szenario (Alignment-Audit, aus dem Paper):', 30, 60);
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(scenario.prompt, 30, 78);

            // Output-Box unten
            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.beginPath();
            ctx.roundRect(20, H - 70, W - 40, 44, 8);
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(20, H - 70, W - 40, 44, 8);
            ctx.stroke();
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#34d399';
            ctx.textAlign = 'left';
            ctx.fillText('Was das Modell TUT:', 30, H - 54);
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(scenario.action, 30, H - 36);

            // Mittlerer Bereich
            const midH = H - 180;

            ctx.fillStyle = 'rgba(99, 102, 241, 0.04)';
            ctx.beginPath();
            ctx.roundRect(40, 100, W - 80, midH, 12);
            ctx.fill();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(40, 100, W - 80, midH, 12);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '10px system-ui';
            ctx.fillStyle = 'rgba(129, 140, 248, 0.85)';
            ctx.textAlign = 'center';
            ctx.fillText('J-Lens: Was das Modell DENKT (aber nicht sagt)', W / 2, 115);

            scenario.silentThoughts.forEach((thought, i) => {
                const age = t - thought.delay;
                if (age < 0) return;

                const fadeIn = Math.min(1, age / 30);
                const x = 60 + thought.x * (W - 120);
                const y = 130 + thought.y * (midH - 60);
                const bob = Math.sin(t * 0.03 + i * 1.5) * 3;

                const glow = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, 25);
                glow.addColorStop(0, `rgba(251, 191, 36, ${0.2 * fadeIn})`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y + bob, 25, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = fadeIn;
                ctx.font = 'bold 13px monospace';
                const textW = ctx.measureText(thought.word).width;
                const boxW = textW + 14;
                const boxH = 24;

                ctx.fillStyle = THEME.card;
                ctx.beginPath();
                ctx.roundRect(x - boxW / 2, y + bob - boxH / 2, boxW, boxH, 5);
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x - boxW / 2, y + bob - boxH / 2, boxW, boxH, 5);
                ctx.stroke();

                ctx.fillStyle = '#fbbf24';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(thought.word, x, y + bob);
                ctx.textBaseline = 'alphabetic';
                ctx.globalAlpha = 1;
            });

            if (t > 220) {
                const arrowAlpha = Math.min(0.5, (t - 220) / 60);
                ctx.beginPath();
                ctx.moveTo(W / 2, 100 + midH - 10);
                ctx.lineTo(W / 2, H - 75);
                ctx.strokeStyle = `rgba(16, 185, 129, ${arrowAlpha})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.moveTo(W / 2, H - 75);
                ctx.lineTo(W / 2 - 6, H - 85);
                ctx.lineTo(W / 2 + 6, H - 85);
                ctx.closePath();
                ctx.fillStyle = `rgba(16, 185, 129, ${arrowAlpha})`;
                ctx.fill();

                ctx.font = '9px system-ui';
                ctx.fillStyle = `rgba(16, 185, 129, ${arrowAlpha})`;
                ctx.textAlign = 'center';
                ctx.fillText('beeinflusst die Handlung', W / 2 + 60, H - 80);
            }

            ctx.font = '10px system-ui';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Das Modell weiß, dass es manipuliert – die J-Lens macht das sichtbar, auch wenn es nichts davon sagt.', W / 2, H - 4);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // PUBLIC API
    // ============================================================
    function init() {
        const container = document.getElementById('jspace-viz-container');
        if (!container) return;
        currentStep = 0;
        renderStep(0);
    }

    return {
        init,
        next,
        prev,
        canGoNext,
        canGoPrev,
        reset,
        isOnJSpaceSlide
    };
})();

// Initialize when the slide becomes active
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
        if (JSpaceViz.isOnJSpaceSlide()) JSpaceViz.init();
    }, 200));
} else {
    setTimeout(() => {
        if (JSpaceViz.isOnJSpaceSlide()) JSpaceViz.init();
    }, 200);
}
