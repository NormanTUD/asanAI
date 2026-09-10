// ============================================================
// J-SPACE VISUALIZATION v2 – Überarbeitet
// Global Workspace Theory → Jacobians → J-Space
// Interaktiv, visuell, für Laien
// ============================================================
const JSpaceViz = (() => {
    let currentStep = 0;
    const totalSteps = 6;
    let activeAnimation = null;
    let animationRunning = false;

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
        const bg = bgColor || '#fafafa';

        container.innerHTML = `<div id="${wrapId}" style="position:relative;width:100%;height:480px;overflow:hidden;">` +
            `<canvas id="${canvasId}" style="width:100%;height:100%;display:block;border-radius:10px;background:${bg};"></canvas></div>`;

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
            '<b>Spezialisierte Module:</b> Im Gehirn gibt es spezialisierte Bereiche – einer erkennt Gesichter, einer verarbeitet Sprache, einer plant Bewegungen. Jeder arbeitet für sich, ohne dass die anderen "hineinschauen" können.',
            '<b>Global Workspace Theory (Baars, 1988):</b> Die Ergebnisse der Module werden an einen zentralen Ort geschrieben – den "Global Workspace". Das ist (so die Theorie) unser Bewusstsein: Wir sehen nur die <i>Ergebnisse</i>, nie die internen Berechnungen. <span style="color:#94a3b8;">(Das Qualia-Problem – warum sich Rot "rot anfühlt" – löst das nicht, aber darum geht es hier nicht.)</span>',
            '<b>Gedankenschritte als Zwischenergebnisse:</b> Wenn du "3²−2" rechnest, siehst du die Schritte: "9… dann 7". Wenn du fragst "Wie viele Beine hat das Tier, das Netze spinnt?" denkst du: "Spinne… 8". Diese Zwischenschritte sind das, was im Workspace auftaucht.',
            '<b>Was ist ein Jacobian?</b> Ein Jacobian misst, wie stark sich ein Ausgabewert ändert, wenn man einen Eingabewert leicht verändert. Visuell: Er zeigt, wie ein Raum <i>verzerrt</i> wird – wo er gestreckt, gestaucht oder gedreht wird. Die J-Lens nutzt genau das.',
            '<b>J-Lens am realen Beispiel:</b> Claude wird gefragt: "Das Tier das Netze spinnt hat wie viele Beine?" – Die J-Lens zeigt, welche Konzepte im Workspace aktiv sind: "spider", "eight", "legs". Das Modell "denkt" diese Worte, bevor es antwortet.',
            '<b>Stilles Denken:</b> Mit dem J-Space können LLM Erkenntnisse "zwischenspeichern", die sie nicht aussprechen, damit damit still denken und komplexere Probleme lösen. Dieser J-Space hat sich dynamisch von selbst entwickelt und wurde <i>NICHT</i> vorgegeben als Struktur. Der Optimierungsalgorithmus hat ihn gefunden, weil er <i>nützlich</i> ist.'
        ];
        const captionEl = document.getElementById('jspace-caption');
        if (captionEl) captionEl.innerHTML = captions[step] || '';

        switch (step) {
            case 0: renderBrainModules(container); break;
            case 1: renderGlobalWorkspace(container); break;
            case 2: renderThoughtSteps(container); break;
            case 3: renderJacobianExplainer(container); break;
            case 4: renderJLensExample(container); break;
            case 5: renderSilentThinking(container); break;
        }
    }

    // ============================================================
    // STEP 0: Spezialisierte Gehirn-Module
    // ============================================================
    function renderBrainModules(container) {
        const setup = safeCanvasSetup(container, '#f8fafc');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const modules = [
            { x: W * 0.15, y: H * 0.3, label: 'Visuelle\nMuster', color: '#3b82f6', examples: 'Kanten, Formen, Farben' },
            { x: W * 0.38, y: H * 0.18, label: 'Gesichter\nerkennen', color: '#8b5cf6', examples: '"Das ist Maria"' },
            { x: W * 0.62, y: H * 0.18, label: 'Sprache\nverstehen', color: '#10b981', examples: 'Grammatik, Bedeutung' },
            { x: W * 0.85, y: H * 0.3, label: 'Bewegung\nplanen', color: '#f59e0b', examples: 'Hand heben, laufen' },
            { x: W * 0.25, y: H * 0.7, label: 'Emotionen\nbewerten', color: '#ef4444', examples: 'Angst, Freude, Ekel' },
            { x: W * 0.75, y: H * 0.7, label: 'Gedächtnis\nabrufen', color: '#06b6d4', examples: '"Gestern war ich..."' },
        ];

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            // Titel
            ctx.font = 'bold 15px system-ui';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText('Spezialisierte Module im Gehirn', W / 2, 28);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Jedes Modul arbeitet für sich – keines kann in die Interna der anderen schauen.', W / 2, 46);

            // Module zeichnen
            modules.forEach((mod, i) => {
                const pulse = 1 + 0.05 * Math.sin(t * 0.04 + i * 1.2);
                const radius = 42 * pulse;

                // Glow
                const glow = ctx.createRadialGradient(mod.x, mod.y, 0, mod.x, mod.y, radius * 1.5);
                glow.addColorStop(0, mod.color + '20');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(mod.x, mod.y, radius * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Kreis
                ctx.beginPath();
                ctx.arc(mod.x, mod.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = mod.color + '15';
                ctx.fill();
                ctx.strokeStyle = mod.color;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Label (mehrzeilig)
                ctx.font = 'bold 11px system-ui';
                ctx.fillStyle = mod.color;
                ctx.textAlign = 'center';
                const lines = mod.label.split('\n');
                lines.forEach((line, li) => {
                    ctx.fillText(line, mod.x, mod.y - 4 + li * 14);
                });

                // Beispiel darunter
                ctx.font = '9px system-ui';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(mod.examples, mod.x, mod.y + radius + 14);

                // "Interna unsichtbar" – Schloss-Symbol
                ctx.font = '12px system-ui';
                ctx.fillText('🔒', mod.x + radius - 5, mod.y - radius + 5);
            });

            // Gestrichelte Verbindungen (zeigen Isolation)
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
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

            // Fragezeichen in der Mitte
            const qPulse = 0.5 + 0.3 * Math.sin(t * 0.03);
            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = `rgba(30, 41, 59, ${qPulse})`;
            ctx.textAlign = 'center';
            ctx.fillText('Wie kommunizieren sie?', W / 2, H / 2 + 5);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 1: Global Workspace Theory
    // ============================================================
    function renderGlobalWorkspace(container) {
        const setup = safeCanvasSetup(container, '#f8fafc');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2;
        const wsRadius = 70;

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

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            // Titel
            ctx.font = 'bold 15px system-ui';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText('Global Workspace Theory', W / 2, 24);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Module schreiben ihre Ergebnisse an einen zentralen Ort – den "Workspace"', W / 2, 42);

            // Workspace (Zentrum) – leuchtend
            const wsGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, wsRadius * 2);
            wsGlow.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
            wsGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = wsGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, wsRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, wsRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#4f46e5';
            ctx.textAlign = 'center';
            ctx.fillText('BEWUSSTSEIN', cx, cy - 12);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#6366f1';
            ctx.fillText('(Global Workspace)', cx, cy + 4);
            ctx.font = '9px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Nur Ergebnisse sichtbar', cx, cy + 20);
            ctx.fillText('Nie die Interna!', cx, cy + 32);

            // Module um den Workspace
            modules.forEach((mod, i) => {
                const mx = cx + Math.cos(mod.angle) * orbitR;
                const my = cy + Math.sin(mod.angle) * orbitR;

                // Pfeil zum Workspace
                const arrowAlpha = 0.3 + 0.2 * Math.sin(t * 0.03 + i * 1.5);
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(cx + Math.cos(mod.angle) * (wsRadius + 10), cy + Math.sin(mod.angle) * (wsRadius + 10));
                ctx.strokeStyle = mod.color + Math.round(arrowAlpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = 2;
                ctx.stroke();

                // Pfeilspitze
                const tipAngle = Math.atan2(cy - my, cx - mx);
                const tipX = cx + Math.cos(mod.angle) * (wsRadius + 12);
                const tipY = cy + Math.sin(mod.angle) * (wsRadius + 12);
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - 8 * Math.cos(tipAngle - 0.3), tipY - 8 * Math.sin(tipAngle - 0.3));
                ctx.lineTo(tipX - 8 * Math.cos(tipAngle + 0.3), tipY - 8 * Math.sin(tipAngle + 0.3));
                ctx.closePath();
                ctx.fillStyle = mod.color + '80';
                ctx.fill();

                // Modul-Kreis
                ctx.beginPath();
                ctx.arc(mx, my, 30, 0, Math.PI * 2);
                ctx.fillStyle = mod.color + '15';
                ctx.fill();
                ctx.strokeStyle = mod.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.font = 'bold 10px system-ui';
                ctx.fillStyle = mod.color;
                ctx.textAlign = 'center';
                ctx.fillText(mod.label, mx, my - 2);

                // Ergebnis-Label
                ctx.font = '9px system-ui';
                ctx.fillStyle = '#475569';
                const labelX = mx + Math.cos(mod.angle) * 42;
                const labelY = my + Math.sin(mod.angle) * 42;
                ctx.fillText(mod.result, labelX, labelY);
            });

            // Partikel die zum Zentrum fliegen
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
    // STEP 2: Gedankenschritte als Zwischenergebnisse
    // ============================================================
    function renderThoughtSteps(container) {
        const setup = safeCanvasSetup(container, '#0f172a');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const examples = [
            {
                prompt: 'Denke an 3² − 2',
                steps: [
                    { text: '3²', delay: 40, color: '#f59e0b' },
                    { text: '= 9', delay: 80, color: '#10b981' },
                    { text: '9 − 2', delay: 120, color: '#3b82f6' },
                    { text: '= 7', delay: 160, color: '#ef4444' },
                ],
                answer: '7'
            },
            {
                prompt: '"Wie viele Beine hat das Tier, das Netze spinnt?"',
                steps: [
                    { text: 'Netze spinnt', delay: 40, color: '#f59e0b' },
                    { text: '→ Spinne', delay: 80, color: '#8b5cf6' },
                    { text: 'Spinne → Beine?', delay: 120, color: '#3b82f6' },
                    { text: '= 8', delay: 160, color: '#10b981' },
                ],
                answer: '8'
            },
            {
                prompt: '"Sage: das alte Bild hängt schief an der Wand"',
                steps: [
                    { text: 'Bild', delay: 40, color: '#f59e0b' },
                    { text: 'alt → Gemälde?', delay: 70, color: '#8b5cf6' },
                    { text: 'schief → Position', delay: 100, color: '#3b82f6' },
                    { text: 'Wand → Ort', delay: 130, color: '#06b6d4' },
                ],
                answer: '"das alte Bild hängt schief an der Wand"'
            }
        ];

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Titel
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText('Gedankenschritte = Zwischenergebnisse im Workspace', W / 2, 24);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Du siehst die Schritte – nicht die Neuronen die sie berechnen.', W / 2, 42);

            const colW = W / examples.length;

            examples.forEach((ex, ei) => {
                const colX = ei * colW + colW / 2;
                const startY = 70;

                // Prompt
                ctx.font = 'bold 11px system-ui';
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.fillText(ex.prompt, colX, startY);

                // Pfeil
                ctx.font = '14px system-ui';
                ctx.fillStyle = '#6366f1';
                ctx.fillText('↓', colX, startY + 20);

                // Schritte
                ex.steps.forEach((step, si) => {
                    const age = t - step.delay - ei * 30;
                    if (age < 0) return;

                    const fadeIn = Math.min(1, age / 25);
                    const y = startY + 40 + si * 50;
                    const bob = Math.sin(t * 0.03 + si) * 2;

                    ctx.globalAlpha = fadeIn;

                    // Box
                    ctx.font = 'bold 13px monospace';
                    const textW = ctx.measureText(step.text).width;
                    const boxW = textW + 20;
                    const boxH = 28;

                    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                    ctx.beginPath();
                    ctx.roundRect(colX - boxW / 2, y + bob - boxH / 2, boxW, boxH, 6);
                    ctx.fill();
                    ctx.strokeStyle = step.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(colX - boxW / 2, y + bob - boxH / 2, boxW, boxH, 6);
                    ctx.stroke();

                    ctx.fillStyle = step.color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(step.text, colX, y + bob);
                    ctx.textBaseline = 'alphabetic';

                    // Verbindungspfeil
                    if (si > 0) {
                        ctx.beginPath();
                        ctx.moveTo(colX, y + bob - boxH / 2 - 8);
                        ctx.lineTo(colX, y + bob - boxH / 2 - 2);
                        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }

                    ctx.globalAlpha = 1;
                });

                // Antwort
                const answerAge = t - 200 - ei * 30;
                if (answerAge > 0) {
                    const fadeIn = Math.min(1, answerAge / 30);
                    const y = startY + 40 + ex.steps.length * 50 + 20;
                    ctx.globalAlpha = fadeIn;
                    ctx.font = 'bold 14px system-ui';
                    ctx.fillStyle = '#10b981';
                    ctx.textAlign = 'center';
                    ctx.fillText('→ ' + ex.answer, colX, y);
                    ctx.globalAlpha = 1;
                }
            });

            // Hinweis unten
            ctx.font = '10px system-ui';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Diese Zwischenschritte sind genau das, was die J-Lens im LLM sichtbar macht.', W / 2, H - 12);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 3: Was ist ein Jacobian? – Visuell erklärt
    // ============================================================
    function renderJacobianExplainer(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const gridSize = 8;
        const cellSize = Math.min(W * 0.18, H * 0.22) / gridSize;
        const leftX = W * 0.25;
        const rightX = W * 0.72;
        const gridY = H * 0.5;

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Titel
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText('Was ist ein Jacobian? – Verzerrung eines Raums', W / 2, 24);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Links: gleichmäßiges Gitter. Rechts: durch eine Funktion verzerrt.', W / 2, 44);
            ctx.fillText('Der Jacobian misst genau diese Verzerrung an jedem Punkt.', W / 2, 58);

            // === LINKES GITTER (Original, gleichmäßig) ===
            const leftGridX = leftX - (gridSize * cellSize) / 2;
            const leftGridY = gridY - (gridSize * cellSize) / 2;

            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Eingabe-Raum', leftX, leftGridY - 20);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('(gleichmäßiges Gitter)', leftX, leftGridY - 6);

            // Gitterlinien links
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= gridSize; i++) {
                // Vertikal
                ctx.beginPath();
                ctx.moveTo(leftGridX + i * cellSize, leftGridY);
                ctx.lineTo(leftGridX + i * cellSize, leftGridY + gridSize * cellSize);
                ctx.stroke();
                // Horizontal
                ctx.beginPath();
                ctx.moveTo(leftGridX, leftGridY + i * cellSize);
                ctx.lineTo(leftGridX + gridSize * cellSize, leftGridY + i * cellSize);
                ctx.stroke();
            }

            // Punkte an Kreuzungen
            for (let i = 0; i <= gridSize; i++) {
                for (let j = 0; j <= gridSize; j++) {
                    ctx.beginPath();
                    ctx.arc(leftGridX + i * cellSize, leftGridY + j * cellSize, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#6366f1';
                    ctx.fill();
                }
            }

            // === RECHTES GITTER (Verzerrt durch eine Funktion) ===
            const rightGridX = rightX - (gridSize * cellSize) / 2;
            const rightGridY = gridY - (gridSize * cellSize) / 2;

            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Ausgabe-Raum', rightX, rightGridY - 20);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('(durch Funktion verzerrt)', rightX, rightGridY - 6);

            // Verzerrungsfunktion (animiert)
            const warp = (x, y) => {
                const nx = (x - rightGridX) / (gridSize * cellSize) - 0.5;
                const ny = (y - rightGridY) / (gridSize * cellSize) - 0.5;
                const strength = 0.3 + 0.15 * Math.sin(t * 0.02);
                const angle = strength * Math.sin(nx * 3 + t * 0.01) * Math.cos(ny * 2);
                const scale = 1 + strength * 0.5 * Math.sin(ny * 4 + nx * 2);
                const wx = rightGridX + (nx * scale * Math.cos(angle) - ny * scale * Math.sin(angle) * 0.3 + 0.5) * gridSize * cellSize;
                const wy = rightGridY + (nx * scale * Math.sin(angle) * 0.3 + ny * scale * Math.cos(angle) + 0.5) * gridSize * cellSize;
                return { x: wx, y: wy };
            };

            // Verzerrte Gitterlinien
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 1;

            // Vertikale Linien (verzerrt)
            for (let i = 0; i <= gridSize; i++) {
                ctx.beginPath();
                for (let j = 0; j <= gridSize * 4; j++) {
                    const rawX = rightGridX + i * cellSize;
                    const rawY = rightGridY + (j / 4) * cellSize;
                    const w = warp(rawX, rawY);
                    if (j === 0) ctx.moveTo(w.x, w.y);
                    else ctx.lineTo(w.x, w.y);
                }
                ctx.stroke();
            }

            // Horizontale Linien (verzerrt)
            for (let j = 0; j <= gridSize; j++) {
                ctx.beginPath();
                for (let i = 0; i <= gridSize * 4; i++) {
                    const rawX = rightGridX + (i / 4) * cellSize;
                    const rawY = rightGridY + j * cellSize;
                    const w = warp(rawX, rawY);
                    if (i === 0) ctx.moveTo(w.x, w.y);
                    else ctx.lineTo(w.x, w.y);
                }
                ctx.stroke();
            }

            // Verzerrte Punkte
            for (let i = 0; i <= gridSize; i++) {
                for (let j = 0; j <= gridSize; j++) {
                    const rawX = rightGridX + i * cellSize;
                    const rawY = rightGridY + j * cellSize;
                    const w = warp(rawX, rawY);
                    ctx.beginPath();
                    ctx.arc(w.x, w.y, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();
                }
            }

            // === PFEIL in der Mitte ===
            const arrowY = gridY;
            ctx.beginPath();
            ctx.moveTo(W * 0.42, arrowY);
            ctx.lineTo(W * 0.56, arrowY);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Pfeilspitze
            ctx.beginPath();
            ctx.moveTo(W * 0.56, arrowY);
            ctx.lineTo(W * 0.54, arrowY - 5);
            ctx.lineTo(W * 0.54, arrowY + 5);
            ctx.closePath();
            ctx.fillStyle = '#475569';
            ctx.fill();

            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            ctx.fillText('f(x)', W * 0.49, arrowY - 10);

            // === Jacobian-Erklärung unten ===
            const explY = H - 90;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(W * 0.1, explY, W * 0.8, 80, 10);
            ctx.fill();
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(W * 0.1, explY, W * 0.8, 80, 10);
            ctx.stroke();

            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText('Der Jacobian = die Matrix, die diese Verzerrung beschreibt', W / 2, explY + 18);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#475569';
            ctx.fillText('An jedem Punkt: Wie stark wird der Raum gestreckt, gestaucht, gedreht?', W / 2, explY + 36);
            ctx.fillText('Die J-Lens nutzt genau das: Sie misst, wie stark eine Aktivierung', W / 2, explY + 52);
            ctx.fillText('die Ausgabe-Wahrscheinlichkeit jedes Tokens beeinflusst.', W / 2, explY + 68);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 4: J-Lens am realen Beispiel
    // ============================================================
    function renderJLensExample(container) {
        const setup = safeCanvasSetup(container, '#0f172a');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2;

        // Prompt und Ergebnis aus dem Paper
        const prompt = '"The number of legs on the animal that spins webs is"';
        const answer = '→ 8';

        // Gedankenschritte die die J-Lens aufdeckt
        const thoughts = [
            { word: 'webs', x: 0.15, y: 0.25, color: '#94a3b8', delay: 20, size: 11, type: 'input' },
            { word: 'animal', x: 0.35, y: 0.2, color: '#94a3b8', delay: 30, size: 11, type: 'input' },
            { word: 'legs', x: 0.7, y: 0.22, color: '#94a3b8', delay: 40, size: 11, type: 'input' },
            { word: 'spider', x: 0.4, y: 0.5, color: '#f59e0b', delay: 80, size: 15, type: 'intermediate' },
            { word: 'arachnid', x: 0.6, y: 0.45, color: '#f59e0b', delay: 100, size: 12, type: 'intermediate' },
            { word: 'eight', x: 0.5, y: 0.72, color: '#10b981', delay: 140, size: 16, type: 'answer' },
            { word: '8', x: 0.55, y: 0.82, color: '#10b981', delay: 160, size: 18, type: 'answer' },
        ];

        // Verbindungen (Pfeile zwischen Gedanken)
        const connections = [
            { from: 0, to: 3 }, // webs → spider
            { from: 1, to: 3 }, // animal → spider
            { from: 3, to: 5 }, // spider → eight
            { from: 2, to: 5 }, // legs → eight
            { from: 4, to: 5 }, // arachnid → eight
        ];

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Titel
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText('J-Lens: Zwischenschritte im Modell sichtbar machen', W / 2, 22);

            // Prompt-Box
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

            // Antwort-Box unten
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

            // Arbeitsbereich
            const workY = 85;
            const workH = H - 150;

            // Verbindungen zeichnen (wenn beide Enden sichtbar)
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

                // Pfeilspitze
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

            // Gedanken-Tokens zeichnen
            thoughts.forEach((thought, i) => {
                const age = t - thought.delay;
                if (age < 0) return;

                const fadeIn = Math.min(1, age / 25);
                const x = 40 + thought.x * (W - 80);
                const y = workY + thought.y * workH;
                const bob = Math.sin(t * 0.03 + i * 1.2) * 2;

                ctx.globalAlpha = fadeIn;

                // Glow
                const glowR = thought.type === 'answer' ? 30 : thought.type === 'intermediate' ? 25 : 15;
                const glow = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, glowR);
                glow.addColorStop(0, thought.color + '40');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y + bob, glowR, 0, Math.PI * 2);
                ctx.fill();

                // Token-Box
                ctx.font = `bold ${thought.size}px monospace`;
                const textW = ctx.measureText(thought.word).width;
                const boxW = textW + 14;
                const boxH = thought.size + 12;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
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

                // Type-Label
                if (thought.type === 'intermediate' && age > 30) {
                    ctx.font = '8px system-ui';
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
                    ctx.fillText('← J-Lens deckt auf', x + boxW / 2 + 8, y + bob + 3);
                }

                ctx.globalAlpha = 1;
            });

            // Legende
            ctx.font = '10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('● Grau = Input-Tokens', 12, H - 10);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('● Orange = Zwischenschritte (nur J-Lens sieht sie!)', 160, H - 10);
            ctx.fillStyle = '#10b981';
            ctx.fillText('● Grün = Antwort', W - 140, H - 10);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 5: Stilles Denken – Konzepte die das Modell denkt aber nicht sagt
    // ============================================================
    function renderSilentThinking(container) {
        const setup = safeCanvasSetup(container, '#0f172a');
        if (!setup) return;
        const { ctx, W, H } = setup;

        // Szenario aus dem Paper: Edit fake numbers (Opus 4.6)
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

            ctx.clearRect(0, 0, W, H);
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Titel
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#e2e8f0';
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
            ctx.fillText('Szenario (aus Opus 4.6 Alignment Audit):', 30, 60);
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

            // Mittlerer Bereich: "Stille Gedanken"
            const midH = H - 180;

            ctx.fillStyle = 'rgba(99, 102, 241, 0.03)';
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
            ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('J-Lens: Was das Modell DENKT (aber nicht sagt)', W / 2, 115);

            // Stille Gedanken erscheinen
            scenario.silentThoughts.forEach((thought, i) => {
                const age = t - thought.delay;
                if (age < 0) return;

                const fadeIn = Math.min(1, age / 30);
                const x = 60 + thought.x * (W - 120);
                const y = 130 + thought.y * (midH - 60);
                const bob = Math.sin(t * 0.03 + i * 1.5) * 3;

                // Glow
                const glow = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, 25);
                glow.addColorStop(0, `rgba(251, 191, 36, ${0.2 * fadeIn})`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y + bob, 25, 0, Math.PI * 2);
                ctx.fill();

                // Token-Box
                ctx.globalAlpha = fadeIn;
                ctx.font = 'bold 13px monospace';
                const textW = ctx.measureText(thought.word).width;
                const boxW = textW + 14;
                const boxH = 24;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
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

            // Pfeil von Gedanken zur Ausgabe
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

            // Erklärung
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
