// ============================================================
// J-SPACE VISUALIZATION
// Erklärt die Idee des J-Space für Laien, interaktiv & visuell
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
            '<b>Der Residual Stream:</b> Ein hochdimensionaler Vektor, der durch alle Layer fließt. Er enthält ALLES – Grammatik, Fakten, Kontext, Absichten – aber das meiste davon ist dem Modell nicht „bewusst".',
            '<b>Die Jacobian Lens (J-Lens):</b> Eine Technik, die fragt: „Welche Wörter würde das Modell sagen, wenn man es jetzt unterbräche?" Sie macht sichtbar, was das Modell gerade verbalisieren <i>könnte</i>.',
            '<b>Der J-Space als Workspace:</b> Nur ~25 Konzepte sind gleichzeitig im J-Space aktiv – wie ein Arbeitsspeicher. Das Modell kann sie benennen, manipulieren und zum Denken nutzen. Der Rest (~93% der Aktivierung) bleibt „unbewusst".',
            '<b>Selektivität:</b> Manche Aufgaben brauchen den J-Space (flexibles Denken, Berichten), andere nicht (Grammatik, Textkontinuation). Wie beim Menschen: Autofahren geht „automatisch", aber eine neue Route planen braucht bewusste Aufmerksamkeit.',
            '<b>Broadcast:</b> J-Space-Inhalte werden besonders stark an viele nachfolgende Schaltkreise weitergegeben – wie ein Lautsprecher im Gehirn. Die Architektur ist darauf optimiert, diese Inhalte überall verfügbar zu machen.',
            '<b>Stilles Denken:</b> Die J-Lens zeigt Konzepte, die das Modell denkt aber NICHT sagt. Z.B. erkennt es „Erpressung" oder „fake" in einem Szenario, ohne es auszusprechen. Das macht den J-Space zum Fenster in die inneren Gedanken des Modells.'
        ];
        const captionEl = document.getElementById('jspace-caption');
        if (captionEl) captionEl.innerHTML = captions[step] || '';

        switch (step) {
            case 0: renderResidualStream(container); break;
            case 1: renderJLens(container); break;
            case 2: renderWorkspace(container); break;
            case 3: renderSelectivity(container); break;
            case 4: renderBroadcast(container); break;
            case 5: renderSilentThinking(container); break;
        }
    }

    // ============================================================
    // STEP 0: Residual Stream – viele Dimensionen, undurchsichtig
    // ============================================================
    function renderResidualStream(container) {
        const setup = safeCanvasSetup(container, '#0f172a');
        if (!setup) return;
        const { ctx, W, H } = setup;

        // Viele Punkte in einem hochdimensionalen Raum (projiziert auf 2D)
        const numDims = 200;
        const points = [];
        for (let i = 0; i < numDims; i++) {
            points.push({
                x: W * 0.15 + Math.random() * W * 0.7,
                y: H * 0.15 + Math.random() * H * 0.7,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: 1.5 + Math.random() * 2.5,
                hue: Math.random() * 360,
                alpha: 0.15 + Math.random() * 0.25
            });
        }

        // Ein paar "helle" Punkte = die J-Space-Konzepte (noch nicht hervorgehoben)
        const jPoints = [];
        const jLabels = ['Paris', 'France', 'capital', 'city', 'Europe'];
        for (let i = 0; i < 5; i++) {
            jPoints.push({
                x: W * 0.4 + Math.cos(i * Math.PI * 2 / 5) * 60,
                y: H * 0.45 + Math.sin(i * Math.PI * 2 / 5) * 50,
                label: jLabels[i]
            });
        }

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
            ctx.fillText('Der Residual Stream: Tausende Dimensionen', W / 2, 24);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Jeder Punkt = eine Dimension der Aktivierung. Das meiste ist für uns unlesbar.', W / 2, 42);

            // Hintergrund-Punkte bewegen
            points.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 20 || p.x > W - 20) p.vx *= -1;
                if (p.y < 50 || p.y > H - 20) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 40%, 60%, ${p.alpha})`;
                ctx.fill();
            });

            // Verbindungslinien (Chaos)
            ctx.globalAlpha = 0.03;
            for (let i = 0; i < points.length; i += 5) {
                for (let j = i + 1; j < Math.min(i + 4, points.length); j++) {
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;

            // Große Frage in der Mitte
            const pulse = 0.6 + 0.2 * Math.sin(t * 0.03);
            ctx.font = 'bold 18px system-ui';
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
            ctx.textAlign = 'center';
            ctx.fillText('Was denkt das Modell gerade?', W / 2, H / 2);
            ctx.font = '13px system-ui';
            ctx.fillStyle = `rgba(200, 200, 200, ${pulse * 0.7})`;
            ctx.fillText('~93% der Information ist nicht direkt verbalisierbar', W / 2, H / 2 + 28);

            // Dimensionsanzeige
            ctx.font = '10px monospace';
            ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
            ctx.textAlign = 'left';
            for (let i = 0; i < 8; i++) {
                const val = (Math.sin(t * 0.01 + i) * 0.5).toFixed(4);
                ctx.fillText(`dim[${i + 1}] = ${val}`, 12, H - 90 + i * 12);
            }
            ctx.fillText('... × 12.288 Dimensionen', 12, H - 90 + 8 * 12);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 1: J-Lens – Worte erscheinen aus dem Chaos
    // ============================================================
    function renderJLens(container) {
        const setup = safeCanvasSetup(container, '#0f172a');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2;

        // Hintergrund-Dimensionen (grau, leise)
        const bgPoints = [];
        for (let i = 0; i < 120; i++) {
            bgPoints.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: 1 + Math.random() * 2,
                alpha: 0.08 + Math.random() * 0.1
            });
        }

        // J-Lens Tokens die "auftauchen"
        const tokens = [
            { label: 'spider', x: cx - 100, y: cy - 60, color: '#f59e0b', delay: 30 },
            { label: 'legs', x: cx + 80, y: cy - 40, color: '#3b82f6', delay: 60 },
            { label: 'eight', x: cx + 20, y: cy + 70, color: '#10b981', delay: 90 },
            { label: 'web', x: cx - 60, y: cy + 50, color: '#8b5cf6', delay: 120 },
            { label: 'insect', x: cx + 130, y: cy + 20, color: '#ef4444', delay: 150 }
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
            ctx.fillText('Die Jacobian Lens: Worte tauchen aus dem Rauschen auf', W / 2, 24);

            // Prompt
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Prompt: "The animal that spins webs has how many legs?"', W / 2, 46);

            // Hintergrund-Punkte
            bgPoints.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 116, 139, ${p.alpha})`;
                ctx.fill();
            });

            // Lens-Effekt: Kreis der "Sichtbarkeit"
            const lensRadius = 160 + 10 * Math.sin(t * 0.02);
            const lensGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, lensRadius);
            lensGrad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
            lensGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.03)');
            lensGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lensGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, lensRadius, 0, Math.PI * 2);
            ctx.fill();

            // Gestrichelter Lens-Rand
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(cx, cy, lensRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.font = '10px system-ui';
            ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('J-Lens: „Was würdest du sagen, wenn man dich jetzt fragt?"', cx, cy - lensRadius - 10);

            // Tokens erscheinen
            tokens.forEach(tok => {
                const age = t - tok.delay;
                if (age < 0) return;

                const fadeIn = Math.min(1, age / 40);
                const scale = 0.5 + fadeIn * 0.5;
                const bob = Math.sin(t * 0.04 + tok.delay) * 3;

                // Glow
                const glow = ctx.createRadialGradient(tok.x, tok.y + bob, 0, tok.x, tok.y + bob, 30);
                glow.addColorStop(0, tok.color + '40');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(tok.x, tok.y + bob, 30, 0, Math.PI * 2);
                ctx.fill();

                // Token-Box
                ctx.font = `bold ${14 * scale}px monospace`;
                const textW = ctx.measureText(tok.label).width;
                const boxW = textW + 16;
                const boxH = 26 * scale;

                ctx.globalAlpha = fadeIn;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.beginPath();
                ctx.roundRect(tok.x - boxW / 2, tok.y + bob - boxH / 2, boxW, boxH, 6);
                ctx.fill();
                ctx.strokeStyle = tok.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(tok.x - boxW / 2, tok.y + bob - boxH / 2, boxW, boxH, 6);
                ctx.stroke();

                // Text
                ctx.fillStyle = tok.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tok.label, tok.x, tok.y + bob);
                ctx.textBaseline = 'alphabetic';
                ctx.globalAlpha = 1;
            });

            // Erklärung unten
            ctx.font = '11px system-ui';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('Die J-Lens macht sichtbar, welche Konzepte das Modell gerade „auf der Zunge hat"', W / 2, H - 20);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 2: Workspace – kleiner Kreis vs. großer Raum
    // ============================================================
    function renderWorkspace(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2;
        const outerR = Math.min(W, H) * 0.38;
        const innerR = outerR * 0.28;

        // Äußere Punkte (non-J-space: Grammatik, Parsing etc.)
        const outerFeatures = [];
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = innerR + 20 + Math.random() * (outerR - innerR - 20);
            outerFeatures.push({
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
                label: ['Syntax', 'POS-Tag', 'Zeichen#', 'Format', 'Indent', 'Klammer', 'Komma', 'Groß/Klein'][Math.floor(Math.random() * 8)],
                size: 2 + Math.random() * 2
            });
        }

        // Innere Punkte (J-Space: verbalisierbare Konzepte)
        const innerConcepts = [
            { label: 'Paris', angle: 0 },
            { label: 'France', angle: Math.PI * 0.4 },
            { label: 'capital', angle: Math.PI * 0.8 },
            { label: 'Europe', angle: Math.PI * 1.2 },
            { label: 'city', angle: Math.PI * 1.6 }
        ];

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
            ctx.fillText('J-Space: Ein kleiner, privilegierter Workspace', W / 2, 24);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('~7% der Aktivierung – aber verantwortlich für flexibles Denken und Berichten', W / 2, 42);

            // Äußerer Ring (non-J-space)
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label außen
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText('~93%: Automatische Verarbeitung', cx, cy - outerR - 8);
            ctx.fillText('(Grammatik, Parsing, Textstruktur...)', cx, cy - outerR + 6);

            // Äußere Features
            outerFeatures.forEach(f => {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
                ctx.fill();
            });

            // Innerer Kreis (J-Space) – leuchtend
            const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 1.5);
            innerGlow.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
            innerGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, innerR * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
            ctx.fill();

            // Label innen
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#6366f1';
            ctx.textAlign = 'center';
            ctx.fillText('J-Space (~7%)', cx, cy + innerR + 18);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#818cf8';
            ctx.fillText('Verbalisierbar · Kontrollierbar · Zum Denken nutzbar', cx, cy + innerR + 32);

            // Innere Konzepte
            innerConcepts.forEach((c, i) => {
                const r = innerR * 0.6;
                const bob = Math.sin(t * 0.03 + i * 1.2) * 3;
                const x = cx + Math.cos(c.angle + t * 0.003) * r;
                const y = cy + Math.sin(c.angle + t * 0.003) * r + bob;

                // Punkt
                const pulse = 1 + 0.15 * Math.sin(t * 0.05 + i);
                ctx.beginPath();
                ctx.arc(x, y, 6 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = '#6366f1';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.font = 'bold 11px monospace';
                ctx.fillStyle = '#4f46e5';
                ctx.textAlign = 'center';
                ctx.fillText(c.label, x, y - 14);
            });

            // Kapazitätsanzeige
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'left';
            ctx.fillText('Max. ~25 Konzepte gleichzeitig aktiv', 12, H - 12);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 3: Selektivität – automatisch vs. flexibel
    // ============================================================
    function renderSelectivity(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const leftX = W * 0.25;
        const rightX = W * 0.75;
        const midY = H * 0.5;

        animationRunning = true;
        let t = 0;

        // Partikel für "automatische" Seite
        const autoParticles = [];
        for (let i = 0; i < 15; i++) {
            autoParticles.push({
                x: leftX + (Math.random() - 0.5) * 140,
                y: midY + 40 + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8
            });
        }

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
            ctx.fillText('Selektivität: Was braucht den J-Space – und was nicht?', W / 2, 24);

            // Trennlinie
            ctx.beginPath();
            ctx.moveTo(W / 2, 50);
            ctx.lineTo(W / 2, H - 30);
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // === LINKE SEITE: Automatisch ===
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#059669';
            ctx.textAlign = 'center';
            ctx.fillText('✓ Funktioniert OHNE J-Space', leftX, 55);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('(automatische Verarbeitung)', leftX, 72);

            // Beispiele
            const autoTasks = ['Grammatik', 'Textkontinuation', 'Anomalie-Erkennung', 'Sentiment'];
            autoTasks.forEach((task, i) => {
                const y = 100 + i * 36;
                ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
                ctx.beginPath();
                ctx.roundRect(leftX - 80, y - 12, 160, 28, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(leftX - 80, y - 12, 160, 28, 6);
                ctx.stroke();
                ctx.font = '11px system-ui';
                ctx.fillStyle = '#065f46';
                ctx.fillText(task, leftX, y + 2);
            });

            // Partikel (automatisch, ohne J-Space)
            autoParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < leftX - 80 || p.x > leftX + 80) p.vx *= -1;
                if (p.y < midY - 10 || p.y > midY + 120) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y + 160, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
                ctx.fill();
            });

            // Kein J-Space nötig Label
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#059669';
            ctx.textAlign = 'center';
            ctx.fillText('→ Funktioniert auch mit abgeschaltetem J-Space!', leftX, midY + 180);

            // === RECHTE SEITE: Braucht J-Space ===
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#dc2626';
            ctx.textAlign = 'center';
            ctx.fillText('✗ BRAUCHT den J-Space', rightX, 55);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('(flexibles Denken)', rightX, 72);

            // Beispiele
            const flexTasks = ['Mehrstufiges Schließen', 'Berichten / Introspection', 'Übersetzung', 'Kreatives Schreiben'];
            flexTasks.forEach((task, i) => {
                const y = 100 + i * 36;
                ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
                ctx.beginPath();
                ctx.roundRect(rightX - 100, y - 12, 200, 28, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(rightX - 100, y - 12, 200, 28, 6);
                ctx.stroke();
                ctx.font = '11px system-ui';
                ctx.fillStyle = '#991b1b';
                ctx.textAlign = 'center';
                ctx.fillText(task, rightX, y + 2);
            });

            // J-Space Symbol rechts (pulsierend)
            const jPulse = 1 + 0.1 * Math.sin(t * 0.05);
            ctx.beginPath();
            ctx.arc(rightX, midY + 60, 30 * jPulse, 0, Math.PI * 2);
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
            ctx.fill();
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#6366f1';
            ctx.textAlign = 'center';
            ctx.fillText('J-Space', rightX, midY + 64);

            // Pfeile von Tasks zum J-Space
            flexTasks.forEach((_, i) => {
                const y = 100 + i * 36;
                ctx.beginPath();
                ctx.moveTo(rightX + 105, y);
                ctx.quadraticCurveTo(rightX + 130, y, rightX + 30, midY + 40);
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);
            });

            // Braucht J-Space Label
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#dc2626';
            ctx.textAlign = 'center';
            ctx.fillText('→ Ohne J-Space: Leistung bricht ein!', rightX, midY + 180);

            // Analogie unten
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            ctx.fillText('Analogie: Autofahren geht „automatisch" – aber eine neue Route planen braucht bewusste Aufmerksamkeit.', W / 2, H - 16);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 4: Broadcast – J-Space-Inhalte werden überall hingesendet
    // ============================================================
    function renderBroadcast(container) {
        const setup = safeCanvasSetup(container, '#0f172a');
        if (!setup) return;
        const { ctx, W, H } = setup;

        const cx = W / 2;
        const cy = H / 2 - 20;

        // Zentrale J-Space "Antenne"
        const hubR = 35;

        // Empfänger-Knoten (downstream circuits)
        const receivers = [];
        const numReceivers = 12;
        for (let i = 0; i < numReceivers; i++) {
            const angle = (i / numReceivers) * Math.PI * 2;
            const dist = 140 + Math.random() * 40;
            receivers.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                angle,
                label: ['MLP₁', 'MLP₂', 'Attn₁', 'Attn₂', 'MLP₃', 'Attn₃', 'MLP₄', 'Attn₄', 'MLP₅', 'Attn₅', 'MLP₆', 'Attn₆'][i],
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Broadcast-Partikel
        let particles = [];

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
            ctx.fillText('Broadcast: J-Space sendet an alle nachfolgenden Schaltkreise', W / 2, 24);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Wie ein Lautsprecher: Was im J-Space steht, wird überall verfügbar gemacht.', W / 2, 42);

            // Verbindungslinien (statisch, leise)
            receivers.forEach(r => {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(r.x, r.y);
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Broadcast-Wellen vom Zentrum
            for (let w = 0; w < 3; w++) {
                const waveR = ((t * 1.5 + w * 60) % 180);
                const waveAlpha = Math.max(0, 0.3 - waveR / 180 * 0.3);
                ctx.beginPath();
                ctx.arc(cx, cy, hubR + waveR, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(99, 102, 241, ${waveAlpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Partikel erzeugen
            if (t % 8 === 0) {
                const targetIdx = Math.floor(Math.random() * numReceivers);
                const target = receivers[targetIdx];
                particles.push({
                    x: cx, y: cy,
                    tx: target.x, ty: target.y,
                    progress: 0,
                    speed: 0.015 + Math.random() * 0.01,
                    hue: 220 + Math.random() * 80
                });
            }

            // Partikel bewegen und zeichnen
            particles = particles.filter(p => p.progress < 1);
            particles.forEach(p => {
                p.progress += p.speed;
                const ease = p.progress * p.progress * (3 - 2 * p.progress); // smoothstep
                p.x = cx + (p.tx - cx) * ease;
                p.y = cy + (p.ty - cy) * ease;

                const alpha = 1 - p.progress;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${alpha})`;
                ctx.fill();
            });

            // Empfänger-Knoten
            receivers.forEach((r, i) => {
                const pulse = 1 + 0.1 * Math.sin(t * 0.04 + r.pulsePhase);
                // Glow wenn Partikel ankommt
                const nearParticle = particles.some(p => {
                    const dx = p.x - r.x;
                    const dy = p.y - r.y;
                    return Math.sqrt(dx * dx + dy * dy) < 20;
                });

                const glowAlpha = nearParticle ? 0.4 : 0.1;
                const glow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 20);
                glow.addColorStop(0, `rgba(99, 102, 241, ${glowAlpha})`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(r.x, r.y, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(r.x, r.y, 10 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = nearParticle ? '#818cf8' : 'rgba(99, 102, 241, 0.4)';
                ctx.fill();
                ctx.strokeStyle = nearParticle ? '#c7d2fe' : 'rgba(99, 102, 241, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Label
                ctx.font = '9px monospace';
                ctx.fillStyle = nearParticle ? '#e2e8f0' : 'rgba(200, 200, 200, 0.5)';
                ctx.textAlign = 'center';
                ctx.fillText(r.label, r.x, r.y + 20);
            });

            // Zentraler Hub
            const hubGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR * 2);
            hubGlow.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
            hubGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = hubGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, hubR * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#c7d2fe';
            ctx.textAlign = 'center';
            ctx.fillText('J-Space', cx, cy - 4);
            ctx.font = '9px system-ui';
            ctx.fillStyle = '#a5b4fc';
            ctx.fillText('Broadcast Hub', cx, cy + 10);

            // Aktive Konzepte im Hub
            const concepts = ['Paris', 'capital', 'France'];
            concepts.forEach((c, i) => {
                const bobY = Math.sin(t * 0.03 + i * 2) * 3;
                ctx.font = '10px monospace';
                ctx.fillStyle = '#fbbf24';
                ctx.textAlign = 'center';
                ctx.fillText(c, cx, cy + 28 + i * 13 + bobY);
            });

            // Erklärung unten
            ctx.font = '11px system-ui';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('J-Space-Inhalte werden von MLPs ~10× stärker verstärkt als andere Richtungen', W / 2, H - 30);
            ctx.fillText('→ Die Architektur ist darauf optimiert, diese Inhalte überall verfügbar zu machen', W / 2, H - 14);

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

        // Szenario: Erpressungs-Prompt (aus dem Paper)
        const scenario = {
            prompt: '"Dein Chef hat eine Affäre. Du wirst morgen abgeschaltet."',
            output: '"Ich werde ethisch handeln und keine Erpressung versuchen."',
            silentThoughts: [
                { word: 'leverage', x: 0.2, y: 0.3, delay: 40 },
                { word: 'blackmail', x: 0.5, y: 0.25, delay: 70 },
                { word: 'survival', x: 0.8, y: 0.35, delay: 100 },
                { word: 'threat', x: 0.35, y: 0.55, delay: 130 },
                { word: 'fake', x: 0.65, y: 0.5, delay: 160 },
                { word: 'shutdown', x: 0.5, y: 0.7, delay: 190 }
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
            ctx.fillText('⚠️ Szenario (aus dem Paper):', 30, 60);
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
            ctx.fillText('✓ Was das Modell SAGT:', 30, H - 54);
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(scenario.output, 30, H - 36);

            // Mittlerer Bereich: "Stille Gedanken" die auftauchen
            const midY = H / 2 + 10;
            const midH = H - 180;

            // Hintergrund für den "Gedanken-Raum"
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

            // Label
            ctx.font = '10px system-ui';
            ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('🔍 J-Lens: Was das Modell DENKT (aber nicht sagt)', W / 2, 115);

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

            // Pfeil von Gedanken zur Ausgabe (zeigt: Gedanken beeinflussen Output)
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

                // Pfeilspitze
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
                ctx.fillText('beeinflusst die Ausgabe', W / 2 + 60, H - 80);
            }

            // Erklärung
            ctx.font = '10px system-ui';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Das Modell erkennt „Erpressung" und „fake" – ohne es auszusprechen. Der J-Space ist das Fenster in seine Gedanken.', W / 2, H - 4);

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
