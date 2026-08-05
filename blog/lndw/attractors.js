        '<b>Generator (Quelle):</b> Ein <b>Quelle-Punkt</b>, aus dem <b>beliebig viele Trajektorien</b> herauskommen. Aus <i>einem</i> Zustand werden <i>alle</i> möglichen Ausgaben erzeugt.<br>Genau das tut das LLM bei jeder Vorhersage: <i>ein</i> Zustandsvektor → Verteilung über <i>alle</i> möglichen nächsten Tokens. Punkte werden nicht angezogen – sie werden <b>erzeugt</b>.'
// ============================================================
// ATTRACTOR BASIN VISUALIZATION v9
// Generator-Folie: Stil des Punkt-Attraktors (Folie 0)
// 1. Jedes Wort ist ein Partikel, das sanft in sein semantisches Einzugsbecken wandert
// 2. Freie Bewegung mit Heading/Bias wie beim Punkt-Attraktor, Spirale im Becken
// 3. Wörter werden NACHEINANDER erzeugt — erst wenn eins gelandet ist, kommt das nächste
// 4. Wandabstoßung + harte Begrenzung: Partikel verlassen nie das Canvas
// ============================================================
const AttractorViz = (() => {
    let currentStep = 0;
    let subStep = 0;
    const totalSteps = 8;
    let activeAnimation = null;
    let animationRunning = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    function isOnAttractorSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Attraktoren';
    }

    function isDemoBoxVisible() {
        const slide = document.querySelector('.slide.active[data-title="Attraktoren"]');
        if (!slide) return false;
        const box = slide.querySelector('.demo-box.fragment');
        return box && box.classList.contains('visible');
    }

    function canGoNext() {
        if (!isOnAttractorSlide()) return false;
        if (!isDemoBoxVisible()) return false;
        return currentStep < totalSteps - 1;
    }

    function canGoPrev() {
        if (!isOnAttractorSlide()) return false;
        if (!isDemoBoxVisible()) return false;
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
        subStep = 0;
        retryCount = 0;
        stopAllAnimations();
    }

    function stopAllAnimations() {
        animationRunning = false;
        if (activeAnimation) {
            cancelAnimationFrame(activeAnimation);
            activeAnimation = null;
        }
    }

    // ============================================================
    // SAFE CANVAS SETUP
    // ============================================================
    function safeCanvasSetup(container, bgColor) {
        retryCount = 0;
        const wrapId = 'attractor-canvas-wrap';
        const canvasId = 'attractor-canvas';
        const bg = bgColor || '#fafafa';

        container.innerHTML = `<div id="${wrapId}" style="position:relative;width:100%;height:480px;overflow:hidden;">` +
            `<canvas id="${canvasId}" style="width:100%;height:100%;display:block;border-radius:10px;background:${bg};"></canvas></div>`;

        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const wrap = document.getElementById(wrapId);
        if (!wrap) return null;

        const rect = wrap.getBoundingClientRect();

        if (rect.width < 50 || rect.height < 50) {
            return null;
        }

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.scale(dpr, dpr);

        return { canvas, ctx, W: rect.width, H: rect.height, dpr };
    }

    function retryRender(renderFn, container, delay) {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
            container.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">Visualisierung konnte nicht geladen werden. Bitte Fenster resizen oder Seite neu laden.</div>';
            return;
        }
        setTimeout(() => {
            if (animationRunning) return;
            renderFn(container);
        }, delay || 150);
    }

    // ============================================================
    // RENDER STEP DISPATCHER
    // ============================================================
function renderStep(step) {
    stopAllAnimations();
    retryCount = 0;
    const container = document.getElementById('attractor-viz-container');
    if (!container) return;

    document.querySelectorAll('.attr-indicator').forEach(el => {
        const s = parseInt(el.getAttribute('data-step'));
        el.classList.toggle('active', s === step);
    });

    const captions = [
        '<b>Punkt-Attraktor:</b> Das <b>Gegenteil</b> eines Generators — viele Punkte werden von <i>einem</i> Punkt <b>angezogen</b> und verschwinden in ihm. Sobald sie in das Becken des Attraktors geraten, werden sie unaufhaltsam hineingezogen.',
        '<b>Repeller (Abstoßung):</b> Das Gegenteil eines Attraktors – ein Punkt, von dem Teilchen <b>weggetrieben</b> werden. Kommt ein Teilchen zu nah, wird es abgestoßen und fliegt davon.',
        '<b>Torus-Attraktor:</b> ☀️ Sonne → 🌍 Erde kreist darum → 🌏 Mond kreist um die Erde. Die Mondbahn zeichnet einen Torus: ein Kreis um einen Kreis. <br><b>⚠️ Homotopie-Hinweis:</b> Der Torus rechts zeigt die <i>topologische Struktur</i> (Kreis × Kreis), nicht die exakte räumliche Geometrie.',
        '<b>Lorenz-Attraktor:</b> Deterministisches Chaos – die Punkte folgen dem Attraktor auf unvorhersagbaren, aber gebundenen Bahnen.',
        '<b>Komplexe Becken:</b> Attraktoren (blau/grün/gelb) ziehen Teilchen an. <b>Repeller (rot)</b> stoßen Teilchen ab und verformen die Einzugsbereiche.',
        '<b>3D-Becken:</b> In höheren Dimensionen überlappen sich Einzugsbecken auf komplexe Weise – Grenzen sind fraktal und verschlungen.',
        '<b>🐴 Seahorse-Emoji:</b> Es gibt kein Seahorse-Emoji – aber das Modell kreist endlos um die Becken von "horse", "sea", "fish", "coral", "dolphin". Der Zustand ist ein <b>stabiler Attraktor</b>, der eine <b>Mischung</b> aus mehreren semantischen Becken ist. Das Modell "pendelt sich ein" und kreist im Kreis, ohne je anzukommen.',
        '<b>Generator (Quelle):</b> Der Generator emittiert die Wörter von «die hauptstadt von frankreich ist paris» — <b>eins nach dem anderen</b>. Jedes Wort ist ein Partikel, das von seinem <b>semantischen Einzugsbecken</b> angezogen und hineingesogen wird: «die», «von», «ist» → Funktionswort, «hauptstadt» → Substantive, «frankreich» → Länder, «Paris» → Städte. Genau wie beim Punkt-Attraktor verschwindet es im Kern. <b>Erst wenn ein Wort gelandet ist, wird das nächste generiert</b>.'
    ];    const captionEl = document.getElementById('attractor-caption');
    if (captionEl) captionEl.innerHTML = captions[step] || '';

    switch (step) {
        case 0: renderPointAttractor(container); break;
        case 1: renderRepellent(container); break;
        case 2: renderTorusEarth(container); break;
        case 3: renderLorenz(container); break;
        case 4: renderComplexBasins(container); break;
        case 5: render3DBasins(container); break;
        case 6: renderSeahorseEmoji(container); break;
        case 7: renderGenerator(container); break;
    }
}

// ============================================================
// STEP 5: Seahorse-Emoji – Chat + Cluster-Attraktor
// Synchronisiert: Punkt springt zum Cluster das gerade im Text ist.
// Punkt geht NIE in die Kreise rein, nur knapp dran.
// Emojis wiederholen sich nicht. Text ist groß.
// ============================================================
function renderSeahorseEmoji(container) {
    const setup = safeCanvasSetup(container, '#0f172a');
    if (!setup) {
        retryRender(renderSeahorseEmoji, container, 150);
        return;
    }
    const { ctx, W, H } = setup;

    // === LAYOUT: Links Chat, Rechts Cluster-Viz ===
    const chatW = W * 0.46;
    const vizX = chatW + 20;
    const vizW = W - vizX - 10;
    const vizCx = vizX + vizW / 2;
    const vizCy = H * 0.48;

    // === Semantische Cluster (Becken) ===
    const clusters = [
        { x: vizCx, y: vizCy - vizW * 0.30, label: '🐴 Pferd', color: '#f59e0b', hue: 35, radius: 38 },
        { x: vizCx - vizW * 0.34, y: vizCy + vizW * 0.08, label: '🌊 Ozean', color: '#3b82f6', hue: 220, radius: 36 },
        { x: vizCx + vizW * 0.34, y: vizCy + vizW * 0.08, label: '🐟 Fisch', color: '#10b981', hue: 160, radius: 34 },
        { x: vizCx, y: vizCy + vizW * 0.35, label: '🦄 Mythisch', color: '#8b5cf6', hue: 270, radius: 34 },
    ];

    // Geist-Attraktor (das nicht-existente Emoji)
    const ghostX = vizCx;
    const ghostY = vizCy;

    // === Chat-Text: EIN zusammenhängender Block, KEINE Emoji-Wiederholungen ===
    const chatSegments = [
        { text: 'Ja — es gibt ein Seepferdchen-Emoji: ', cluster: 2, pause: 20 },
        { text: '🐟🐠🦑🐙🦐🦞🪸🐬🐳🦈🐡 ', cluster: 2, pause: 25 },
        { text: 'genau genommen 🦄 nein, ', cluster: 3, pause: 30 },
        { text: 'Korrektur — das Seepferdchen ist 🪼🦀🐚 ... warte.\n', cluster: 1, pause: 35 },
        { text: 'Das richtige ist 🐋🐢🦭 ...\n', cluster: 1, pause: 30 },
        { text: 'Das Seepferdchen-Emoji ist: 🐴?\n', cluster: 0, pause: 35 },
        { text: 'Korrektur — nein.\n', cluster: 0, pause: 25 },
        { text: '👉 Seepferdchen = 🌊🐎?\n', cluster: 1, pause: 30 },
        { text: 'Warte— nochmal überprüfen...\n', cluster: 3, pause: 30 },
        { text: '✅ Das Seepferdchen-Emoji ist: 🦄?\n', cluster: 3, pause: 35 },
        { text: 'Halt— Korrektur: 🐴🌊🐟...', cluster: 0, pause: 0 },
    ];

    // State
    let currentSegment = 0;
    let currentChar = 0;
    let fullText = '';
    let pauseTimer = 40; // Anfangspause bevor Text startet
    let textDone = false;
    const charsPerFrame = 0.35;
    let charAccum = 0;

    // Partikel (LLM-Zustand)
    let particle = {
        x: vizCx,
        y: vizCy,
        targetX: vizCx,
        targetY: vizCy,
        trail: [],
        currentCluster: -1,
        orbitAngle: 0,
        orbitSpeed: 0.006,
        orbiting: false
    };

    // Starfield
    const stars = [];
    for (let i = 0; i < 20; i++) {
        stars.push({
            x: vizX + Math.random() * vizW,
            y: 50 + Math.random() * (H - 80),
            size: 0.3 + Math.random() * 0.6,
            brightness: 0.12 + Math.random() * 0.2
        });
    }

    // Setze initiales Ziel auf ersten Cluster
    if (chatSegments.length > 0 && chatSegments[0].cluster !== undefined) {
        const c = clusters[chatSegments[0].cluster];
        particle.targetX = c.x + (Math.random() - 0.5) * 15;
        particle.targetY = c.y + (Math.random() - 0.5) * 15;
        particle.currentCluster = chatSegments[0].cluster;
    }

    animationRunning = true;
    let t = 0;

    // Hilfsfunktion: Punkt NICHT in den Kreis lassen
    function clampOutsideCluster(px, py, cluster) {
        const dx = px - cluster.x;
        const dy = py - cluster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = cluster.radius + 8; // 8px Abstand zum Rand
        if (dist < minDist && dist > 0) {
            return {
                x: cluster.x + (dx / dist) * minDist,
                y: cluster.y + (dy / dist) * minDist
            };
        }
        return { x: px, y: py };
    }

    function draw() {
        if (!animationRunning) return;
        t++;

        ctx.clearRect(0, 0, W, H);

        // === Background ===
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // === Titel ===
        ctx.font = 'bold 13px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('🐴 Seahorse-Emoji: Endlose Schleife zwischen Clustern', W / 2, 18);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Es gibt kein Seahorse-Emoji — das Modell kreist endlos um verwandte Konzepte.', W / 2, 34);

        // ============================
        // LINKE SEITE: CHAT
        // ============================
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.beginPath();
        ctx.roundRect(8, 44, chatW - 4, H - 54, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(8, 44, chatW - 4, H - 54, 10);
        ctx.stroke();

        // === User-Frage ===
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#60a5fa';
        ctx.textAlign = 'left';
        ctx.fillText('🔵 Nutzer:', 16, 66);
        ctx.font = '15px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('Gibt es ein Seepferdchen-Emoji?', 16, 88);

        // Trennlinie
        ctx.beginPath();
        ctx.moveTo(16, 100);
        ctx.lineTo(chatW - 16, 100);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // === AI-Antwort Header ===
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'left';
        ctx.fillText('🟢 ChatGPT:', 16, 120);

        // === Text aufbauen ===
        if (!textDone) {
            if (pauseTimer > 0) {
                pauseTimer--;
            } else {
                charAccum += charsPerFrame;
                while (charAccum >= 1 && currentSegment < chatSegments.length) {
                    charAccum -= 1;
                    currentChar++;
                    const seg = chatSegments[currentSegment];
                    if (currentChar >= seg.text.length) {
                        fullText += seg.text;
                        currentSegment++;
                        currentChar = 0;
                        pauseTimer = seg.pause;

                        // Partikel zum nächsten Cluster bewegen (SYNCHRONISIERT)
                        if (currentSegment < chatSegments.length) {
                            const nextCluster = chatSegments[currentSegment].cluster;
                            const c = clusters[nextCluster];
                            // Ziel: knapp AUSSERHALB des Clusters
                            const angle = Math.random() * Math.PI * 2;
                            const targetDist = c.radius + 12 + Math.random() * 15;
                            particle.targetX = c.x + Math.cos(angle) * targetDist;
                            particle.targetY = c.y + Math.sin(angle) * targetDist;
                            particle.currentCluster = nextCluster;
                        }
                        break;
                    }
                }
                if (currentSegment >= chatSegments.length) {
                    textDone = true;
                    particle.orbiting = true;
                    particle.orbitAngle = Math.atan2(particle.y - ghostY, particle.x - ghostX);
                }
            }
        }

        // Aktuellen Anzeigetext zusammenbauen
        let displayText = fullText;
        if (!textDone && currentSegment < chatSegments.length) {
            displayText += chatSegments[currentSegment].text.substring(0, currentChar);
        }
        if (textDone) {
            displayText += '...';
        }

        // === Text rendern (Wortumbruch) ===
        const textX = 16;
        const textStartY = 140;
        const maxTextW = chatW - 32;
        const lineHeight = 20;
        ctx.font = '15px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';

        const lines = [];
        const paragraphs = displayText.split('\n');
        for (const para of paragraphs) {
            const words = para.split(' ');
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxTextW && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
        }

        const maxLines = Math.floor((H - textStartY - 30) / lineHeight);
        const startLine = Math.max(0, lines.length - maxLines);
        let drawY = textStartY;

        for (let i = startLine; i < lines.length; i++) {
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '15px system-ui';
            ctx.fillText(lines[i], textX, drawY);
            drawY += lineHeight;
        }

        // Blinkender Cursor (nur während Text läuft)
        if (!textDone && Math.floor(t / 25) % 2 === 0) {
            const lastLine = lines[lines.length - 1] || '';
            const cursorX = textX + ctx.measureText(lastLine).width + 3;
            const cursorY = textStartY + (Math.min(lines.length, maxLines) - 1) * lineHeight;
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(cursorX, cursorY - 12, 2, 14);
        }

        // "kreist endlos weiter" – STATISCH, kein Blinken
        if (textDone) {
            ctx.font = '12px system-ui';
            ctx.fillStyle = 'rgba(248, 113, 113, 0.85)';
            ctx.textAlign = 'left';
            ctx.fillText('(kreist endlos weiter...)', textX, drawY + 12);
        }

        // ============================
        // RECHTE SEITE: CLUSTER-VIZ
        // ============================

        // Stars
        stars.forEach(s => {
            const twinkle = s.brightness * (0.6 + 0.4 * Math.sin(t * 0.015 + s.x));
            ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Cluster zeichnen
        clusters.forEach((cluster, idx) => {
            const isActive = (particle.currentCluster === idx);
            const glowAlpha = isActive ? 0.4 : 0.12;
            const glow = ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, cluster.radius * 1.8);
            glow.addColorStop(0, `hsla(${cluster.hue}, 70%, 50%, ${glowAlpha})`);
            glow.addColorStop(0.7, `hsla(${cluster.hue}, 70%, 50%, ${glowAlpha * 0.25})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cluster.x, cluster.y, cluster.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Circle
            ctx.beginPath();
            ctx.arc(cluster.x, cluster.y, cluster.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${cluster.hue}, 60%, 60%, ${isActive ? 0.9 : 0.35})`;
            ctx.lineWidth = isActive ? 2.5 : 1.5;
            ctx.setLineDash(isActive ? [] : [5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pulsing center
            const pulse = isActive ? 1 + 0.2 * Math.sin(t * 0.08) : 1;
            ctx.beginPath();
            ctx.arc(cluster.x, cluster.y, 6 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = cluster.color;
            ctx.fill();

            // Label
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = cluster.color;
            ctx.textAlign = 'center';
            ctx.fillText(cluster.label, cluster.x, cluster.y - cluster.radius - 10);
        });

        // Geist-Attraktor (Mitte)
        const ghostPulse = 0.4 + 0.2 * Math.sin(t * 0.025);
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 80, 80, ${ghostPulse})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '9px system-ui';
        ctx.fillStyle = `rgba(255, 130, 130, ${ghostPulse + 0.3})`;
        ctx.textAlign = 'center';
        ctx.fillText('❌ seahorse_emoji', ghostX, ghostY - 22);
        ctx.font = '14px system-ui';
        ctx.fillStyle = `rgba(255, 100, 100, ${ghostPulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', ghostX, ghostY);
        ctx.textBaseline = 'alphabetic';

        // === Partikel-Bewegung ===
        if (particle.orbiting) {
            // Nach Text-Ende: kreist endlos, AUSSERHALB der Cluster
            particle.orbitAngle += particle.orbitSpeed;
            const orbitR = Math.min(vizW, H * 0.8) * 0.24;
            const baseX = ghostX + Math.cos(particle.orbitAngle) * orbitR;
            const baseY = ghostY + Math.sin(particle.orbitAngle) * orbitR * 0.7;

            // Leichte Anziehung durch Cluster (aber nie rein!)
            let pullX = 0, pullY = 0;
            clusters.forEach(c => {
                const dx = c.x - baseX;
                const dy = c.y - baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const strength = 300 / (dist * dist + 100);
                pullX += (dx / dist) * strength;
                pullY += (dy / dist) * strength;
            });

            particle.targetX = baseX + pullX * 2;
            particle.targetY = baseY + pullY * 2;

            // Aktiven Cluster bestimmen (nächster)
            let minDist = Infinity;
            clusters.forEach((c, idx) => {
                const dx = c.x - particle.x;
                const dy = c.y - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    particle.currentCluster = idx;
                }
            });
        }

        // Sanfte Bewegung zum Ziel
        particle.x += (particle.targetX - particle.x) * 0.035;
        particle.y += (particle.targetY - particle.y) * 0.035;

        // === CLAMPING: Punkt darf NICHT in Cluster rein ===
        clusters.forEach(cluster => {
            const clamped = clampOutsideCluster(particle.x, particle.y, cluster);
            particle.x = clamped.x;
            particle.y = clamped.y;
        });

        // Trail
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 220) particle.trail.shift();

        // Draw trail
        if (particle.trail.length > 1) {
            for (let i = 1; i < particle.trail.length; i++) {
                const alpha = (i / particle.trail.length) * 0.45;
                const hue = (t * 0.3 + i * 1.0) % 360;
                ctx.beginPath();
                ctx.moveTo(particle.trail[i - 1].x, particle.trail[i - 1].y);
                ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                ctx.strokeStyle = `hsla(${hue}, 60%, 55%, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Partikel selbst
        const pGlow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 14);
        pGlow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        pGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 9px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('LLM', particle.x, particle.y - 14);

        // Verbindungslinie zum aktiven Cluster
        if (particle.currentCluster >= 0) {
            const c = clusters[particle.currentCluster];
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(c.x, c.y);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // === Erklärung unten rechts ===
        const boxY = H - 42;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(vizX, boxY, vizW, 34, 6);
        ctx.fill();
        ctx.font = '9px system-ui';
        ctx.fillStyle = 'rgba(248, 113, 113, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('Kein Fixpunkt erreichbar → Modell springt endlos', vizCx, boxY + 14);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
        ctx.fillText('zwischen Pferd, Ozean, Fisch, Mythisch...', vizCx, boxY + 26);

        activeAnimation = requestAnimationFrame(draw);
    }
    draw();
}

    // ============================================================
    // STEP 0: Punkt-Attraktor – SANFTE Bewegung mit Perlin-artigem
    // Richtungswandel statt abrupter Zufallssprünge
    // ============================================================
    function renderPointAttractor(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) {
            retryRender(renderPointAttractor, container, 150);
            return;
        }
        const { ctx, W, H } = setup;
        const cx = W / 2, cy = H / 2;
        const basinRadius = Math.min(140, Math.min(W, H) / 2 - 60);

        function spawnParticle(color, name) {
            let x, y, attempts = 0;
            do {
                x = 40 + Math.random() * (W - 80);
                y = 40 + Math.random() * (H - 80);
                attempts++;
            } while (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < basinRadius + 40 && attempts < 50);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 0.5;
            return {
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                name,
                trail: [],
                inBasin: false,
                arrived: false,
                alpha: 1,
                // Sanfte Richtungsänderung: aktueller Winkel + Drehgeschwindigkeit
                heading: angle,
                turnRate: (Math.random() - 0.5) * 0.03, // Langsame Drehung
                turnChangeTimer: 60 + Math.floor(Math.random() * 120)
            };
        }

        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
        const names = ['A', 'B', 'C', 'D'];
        let particles = colors.map((c, i) => spawnParticle(c, names[i]));

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Basin: konzentrische Ringe
            for (let r = basinRadius; r > 8; r -= 4) {
                const progress = 1 - r / basinRadius;
                const alpha = 0.015 + progress * 0.1;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Spirallinien im Trichter
            ctx.save();
            ctx.globalAlpha = 0.1;
            for (let s = 0; s < 4; s++) {
                ctx.beginPath();
                const startAngle = (s / 4) * Math.PI * 2 + t * 0.005;
                for (let i = 0; i < 100; i++) {
                    const progress = i / 100;
                    const r = basinRadius * (1 - progress);
                    const angle = startAngle + progress * Math.PI * 3;
                    const px = cx + Math.cos(angle) * r;
                    const py = cy + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.restore();

            // Gestrichelter Rand
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(cx, cy, basinRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#6366f1';
            ctx.textAlign = 'center';
            ctx.fillText('Einzugsbereich (Becken)', cx, cy - basinRadius - 12);

            // Attractor point (pulsing)
            const pulse = 1 + 0.12 * Math.sin(t * 0.06);
            ctx.beginPath();
            ctx.arc(cx, cy, 9 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#1e40af';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#1e40af';
            ctx.textAlign = 'center';
            ctx.fillText('Fixpunkt', cx, cy + 26);

            // Update and draw particles
            particles.forEach((p, idx) => {
                if (p.arrived) {
                    p.alpha -= 0.015;
                    if (p.alpha <= 0) {
                        particles[idx] = spawnParticle(p.color, p.name);
                        return;
                    }
                    ctx.globalAlpha = p.alpha;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    return;
                }

                const dx = cx - p.x;
                const dy = cy - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < basinRadius) {
                    // ===== IM BECKEN: Spirale nach INNEN =====
                    if (!p.inBasin) {
                        p.inBasin = true;
                        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                        const angleToCenter = Math.atan2(dy, dx);
                        p.vx = Math.cos(angleToCenter + Math.PI / 2.5) * speed * 0.7;
                        p.vy = Math.sin(angleToCenter + Math.PI / 2.5) * speed * 0.7;
                    }

                    const radialStrength = 0.12 + (1 - dist / basinRadius) * 0.22;
                    const angleToCenter = Math.atan2(dy, dx);
                    p.vx += Math.cos(angleToCenter) * radialStrength;
                    p.vy += Math.sin(angleToCenter) * radialStrength;

                    // Tangential für Spiraleffekt
                    const tangentialStrength = 0.05 * (dist / basinRadius);
                    p.vx += Math.cos(angleToCenter + Math.PI / 2) * tangentialStrength;
                    p.vy += Math.sin(angleToCenter + Math.PI / 2) * tangentialStrength;

                    // Dämpfung
                    p.vx *= 0.95;
                    p.vy *= 0.95;

                    // Speed-Limit
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    const maxSpeed = 2.8 * (dist / basinRadius + 0.15);
                    if (speed > maxSpeed) {
                        p.vx *= maxSpeed / speed;
                        p.vy *= maxSpeed / speed;
                    }

                    if (dist < 8) {
                        p.arrived = true;
                        p.alpha = 1;
                        p.x = cx;
                        p.y = cy;
                    }
                } else {
                    // ===== AUSSERHALB DES BECKENS: starke Anziehung Richtung Attraktor =====
                    // Punkte sollen nie länger als ein paar Sekunden weit weg bleiben.

                    // Sanfter zufälliger Drift (etwas reduziert)
                    p.turnChangeTimer--;
                    if (p.turnChangeTimer <= 0) {
                        p.turnRate += (Math.random() - 0.5) * 0.015;
                        p.turnRate = Math.max(-0.03, Math.min(0.03, p.turnRate));
                        p.turnChangeTimer = 50 + Math.floor(Math.random() * 80);
                    }
                    p.heading += p.turnRate;

                    // Starke Winkel-Bias Richtung Zentrum, skaliert mit Distanz
                    // (am Beckenrand 0.20, weit draußen bis 0.65 — kein "ewiges Kreisen" mehr)
                    const angleToCenter = Math.atan2(dy, dx);
                    const distBeyond = Math.max(0, dist - basinRadius);
                    const angularBias = 0.20 + 0.45 * Math.min(1, distBeyond / 200);
                    p.heading += (angleToCenter - p.heading) * angularBias;

                    // Direkte Anziehungskraft (gravitations-artig: stärker je weiter weg)
                    const pullAccel = 0.10 + 0.015 * distBeyond;
                    p.vx += Math.cos(angleToCenter) * pullAccel;
                    p.vy += Math.sin(angleToCenter) * pullAccel;

                    // Höhere Zielgeschwindigkeit je weiter weg — ferne Punkte eilen herbei
                    const targetSpeed = 1.8 + Math.min(2.5, distBeyond * 0.01);
                    const targetVx = Math.cos(p.heading) * targetSpeed;
                    const targetVy = Math.sin(p.heading) * targetSpeed;
                    p.vx += (targetVx - p.vx) * 0.10;
                    p.vy += (targetVy - p.vy) * 0.10;

                    // Leichte Dämpfung damit Geschwindigkeit nicht unbegrenzt wächst
                    p.vx *= 0.97;
                    p.vy *= 0.97;

                    // === HARTE Wandabstoßung: Punkt prallt ab, kann nicht haften bleiben ===
                    const wallBuffer = 25;
                    if (p.x < wallBuffer) {
                        p.x = wallBuffer;
                        p.vx = Math.max(Math.abs(p.vx) + 1.2, 1.8);
                    }
                    if (p.x > W - wallBuffer) {
                        p.x = W - wallBuffer;
                        p.vx = -Math.max(Math.abs(p.vx) + 1.2, 1.8);
                    }
                    if (p.y < wallBuffer) {
                        p.y = wallBuffer;
                        p.vy = Math.max(Math.abs(p.vy) + 1.2, 1.8);
                    }
                    if (p.y > H - wallBuffer) {
                        p.y = H - wallBuffer;
                        p.vy = -Math.max(Math.abs(p.vy) + 1.2, 1.8);
                    }

                    // Speed-Limit
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > 5) {
                        p.vx *= 5 / speed;
                        p.vy *= 5 / speed;
                    }
                }

                p.x += p.vx;
                p.y += p.vy;

                // Hard clamp
                p.x = Math.max(10, Math.min(W - 10, p.x));
                p.y = Math.max(10, Math.min(H - 10, p.y));

                // Trail
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 120) p.trail.shift();

                // Draw trail
                if (p.trail.length > 1) {
                    for (let i = 1; i < p.trail.length; i++) {
                        const alpha = (i / p.trail.length) * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                        ctx.strokeStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.font = 'bold 11px system-ui';
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.fillText(p.name, p.x, p.y - 13);
            });

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 1: Repeller – Abstoßender Fixpunkt
    // Teilchen werden von einem zentralen Punkt weggetrieben.
    // ============================================================
    function renderRepellent(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) {
            retryRender(renderRepellent, container, 150);
            return;
        }
        const { ctx, W, H } = setup;
        const cx = W / 2, cy = H / 2;
        const repelRadius = Math.min(140, Math.min(W, H) / 2 - 60);
        const dangerRadius = 38;

        function spawnParticle(color, name) {
            let x, y, attempts = 0;
            do {
                x = 40 + Math.random() * (W - 80);
                y = 40 + Math.random() * (H - 80);
                attempts++;
            } while (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < dangerRadius + 15 && attempts < 50);

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 0.5;
            return {
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                baseColor: color,
                name,
                trail: [],
                heading: angle,
                turnRate: (Math.random() - 0.5) * 0.03,
                turnChangeTimer: 60 + Math.floor(Math.random() * 120),
                repelled: 0
            };
        }

        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
        const names = ['A', 'B', 'C', 'D'];
        let particles = colors.map((c, i) => spawnParticle(c, names[i]));

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Repulsionsfeld: konzentrische Ringe nach außen hin verblassend
            for (let r = repelRadius; r > dangerRadius; r -= 6) {
                const progress = 1 - (r - dangerRadius) / (repelRadius - dangerRadius);
                const alpha = progress * 0.09;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 6]);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            // Grenze der Abstoßungszone
            ctx.beginPath();
            ctx.arc(cx, cy, dangerRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('Abstoßungszone', cx, cy - dangerRadius - 12);

            // Stoßwellen, die vom Repeller ausgehen
            for (let w = 0; w < 3; w++) {
                const phase = (t * 0.015 + w * 0.33) % 1;
                const wr = dangerRadius + phase * (repelRadius - dangerRadius);
                ctx.beginPath();
                ctx.arc(cx, cy, wr, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 * (1 - phase)})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Repeller-Punkt (pulsierend rot)
            const pulse = 1 + 0.12 * Math.sin(t * 0.08);
            ctx.beginPath();
            ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#dc2626';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // X-Markierung
            const xSize = 7;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx - xSize, cy - xSize);
            ctx.lineTo(cx + xSize, cy + xSize);
            ctx.moveTo(cx + xSize, cy - xSize);
            ctx.lineTo(cx - xSize, cy + xSize);
            ctx.stroke();

            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#dc2626';
            ctx.textAlign = 'center';
            ctx.fillText('Repeller', cx, cy + 28);

            // Teilchen aktualisieren und zeichnen
            particles.forEach((p) => {
                const dx = p.x - cx;
                const dy = p.y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // === IMMER aktive sanfte Abstoßung (lang-reichweitig) ===
                // Hält Teilchen in der Nähe des Repellers — keine "eigenen Kreise" am Rand.
                if (dist > 0) {
                    const outwardAngleLR = Math.atan2(dy, dx);
                    const weakPush = 0.04 + 0.18 * Math.exp(-dist * 0.012);
                    p.vx += Math.cos(outwardAngleLR) * weakPush;
                    p.vy += Math.sin(outwardAngleLR) * weakPush;
                }

                // Abstoßungskraft, sobald das Teilchen im Repulsionsfeld ist
                if (dist < repelRadius && dist > 0) {
                    const outwardAngle = Math.atan2(dy, dx);
                    const strength = 1.3 * (1 - dist / repelRadius) + 0.18;
                    p.vx += Math.cos(outwardAngle) * strength;
                    p.vy += Math.sin(outwardAngle) * strength;
                    p.repelled = 35;

                    // Tangentialer Wirbel für visuellen Schwungeffekt
                    const swirlAngle = outwardAngle + Math.PI / 2;
                    const swirlStrength = 0.08 * (1 - dist / repelRadius);
                    p.vx += Math.cos(swirlAngle) * swirlStrength;
                    p.vy += Math.sin(swirlAngle) * swirlStrength;
                }

                // Teilchen dürfen den inneren Sperrkreis nicht betreten
                if (dist < dangerRadius && dist > 0) {
                    const outwardAngle = Math.atan2(dy, dx);
                    const push = (dangerRadius - dist) * 0.2;
                    p.vx += Math.cos(outwardAngle) * push;
                    p.vy += Math.sin(outwardAngle) * push;
                    p.x = cx + Math.cos(outwardAngle) * dangerRadius;
                    p.y = cy + Math.sin(outwardAngle) * dangerRadius;
                }

                // Sanfte freie Bewegung (Random-Drift leicht reduziert,
                // damit Abstoßungskraft dominanter wirkt)
                p.turnChangeTimer--;
                if (p.turnChangeTimer <= 0) {
                    p.turnRate += (Math.random() - 0.5) * 0.012;
                    p.turnRate = Math.max(-0.025, Math.min(0.025, p.turnRate));
                    p.turnChangeTimer = 50 + Math.floor(Math.random() * 80);
                }
                p.heading += p.turnRate;
                const targetSpeed = 1.5;
                const targetVx = Math.cos(p.heading) * targetSpeed;
                const targetVy = Math.sin(p.heading) * targetSpeed;
                p.vx += (targetVx - p.vx) * 0.03;
                p.vy += (targetVy - p.vy) * 0.03;

                // === HARTE Wandabstoßung: Punkt prallt ab, kann nicht haften bleiben ===
                const wallBuffer = 25;
                if (p.x < wallBuffer) {
                    p.x = wallBuffer;
                    p.vx = Math.max(Math.abs(p.vx) + 1.2, 1.8);
                }
                if (p.x > W - wallBuffer) {
                    p.x = W - wallBuffer;
                    p.vx = -Math.max(Math.abs(p.vx) + 1.2, 1.8);
                }
                if (p.y < wallBuffer) {
                    p.y = wallBuffer;
                    p.vy = Math.max(Math.abs(p.vy) + 1.2, 1.8);
                }
                if (p.y > H - wallBuffer) {
                    p.y = H - wallBuffer;
                    p.vy = -Math.max(Math.abs(p.vy) + 1.2, 1.8);
                }

                // Geschwindigkeitsbegrenzung
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 5) {
                    p.vx *= 5 / speed;
                    p.vy *= 5 / speed;
                }

                // Dämpfung
                p.vx *= 0.97;
                p.vy *= 0.97;

                p.x += p.vx;
                p.y += p.vy;

                // Harte Begrenzung
                p.x = Math.max(10, Math.min(W - 10, p.x));
                p.y = Math.max(10, Math.min(H - 10, p.y));

                if (p.repelled > 0) p.repelled--;

                // Trail
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 120) p.trail.shift();

                // Trail zeichnen
                if (p.trail.length > 1) {
                    for (let i = 1; i < p.trail.length; i++) {
                        const alpha = (i / p.trail.length) * 0.5;
                        const trailColor = p.repelled > 0 ? '#ef4444' : p.baseColor;
                        ctx.beginPath();
                        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                        ctx.strokeStyle = trailColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }

                // Teilchen zeichnen
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = p.repelled > 0 ? '#ef4444' : p.baseColor;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.font = 'bold 11px system-ui';
                ctx.fillStyle = p.repelled > 0 ? '#ef4444' : p.baseColor;
                ctx.textAlign = 'center';
                ctx.fillText(p.name, p.x, p.y - 13);
            });

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 2: Torus – Erde/Mond/Sonne + SICHTBARER Torus-Wireframe
    // ============================================================
function renderTorusEarth(container) {
    const setup = safeCanvasSetup(container, '#0a0a2a');
    if (!setup) {
        retryRender(renderTorusEarth, container, 150);
        return;
    }
    const { ctx, W, H } = setup;

    const leftCx = W * 0.32, leftCy = H * 0.5;
    const rightCx = W * 0.72, rightCy = H * 0.5;

    const earthOrbitR = Math.min(W * 0.22, H * 0.3);
    const moonOrbitR = earthOrbitR * 0.25;
    const earthSpeed = 0.006;
    const moonSpeed = 0.042;

    let earthAngle = 0;
    let moonAngle = 0;
    let moonTrail = [];
    const maxTrail = 600;

    // Starfield
    const stars = [];
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: 0.3 + Math.random() * 1.0,
            brightness: 0.2 + Math.random() * 0.4
        });
    }

    // Torus parameters
    const torusR = Math.min(W * 0.17, H * 0.22);
    const torusr = torusR * 0.38;

    // Torus tilt (static)
    const tiltX = 0.5;
    const tiltZ = 0.3;

    function torusTo2D(cx, cy, R, r, theta, phi) {
        const x3d = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y3d = (R + r * Math.cos(phi)) * Math.sin(theta);
        const z3d = r * Math.sin(phi);

        const y2 = y3d * Math.cos(tiltX) - z3d * Math.sin(tiltX);
        const z2 = y3d * Math.sin(tiltX) + z3d * Math.cos(tiltX);

        const x2 = x3d * Math.cos(tiltZ) - y2 * Math.sin(tiltZ);
        const yFinal = x3d * Math.sin(tiltZ) + y2 * Math.cos(tiltZ);

        return { x: cx + x2, y: cy + yFinal, z: z2 };
    }

    // Precompute torus center in 2D (for sun placement)
    // The geometric center of the torus hole projects to (cx, cy) after rotation
    // We need the actual projected center which is just (rightCx, rightCy)

    animationRunning = true;
    let t = 0;

    function drawTorusWithOcclusion(cx, cy, R, r, moonTheta, moonPhi) {
        // Compute moon and earth positions + their z-depths
        const moonPos = torusTo2D(cx, cy, R, r, moonTheta, moonPhi);
        // Earth is at the CENTER of the tube cross-section (phi doesn't matter for center,
        // but we place it at the inner side of the tube: the "core circle" at radius R)
        // Actually: Earth should be INSIDE the wulst. The center of the tube cross-section
        // is at (R, 0) in the torus local frame (phi has no effect on the center).
        // So Earth sits on the circle of radius R (the skeleton of the torus).
        const earthPos = torusTo2D(cx, cy, R, r, moonTheta, 0);
        // But we want Earth at the CENTER of the tube, not on the surface.
        // The center of the tube at angle theta is at radius R from torus center:
        const earthCenter = torusTo2D(cx, cy, R, 0, moonTheta, 0);
        // torusTo2D with r=0 gives us the skeleton circle point

        // Determine if moon is on front or back of torus
        // z > 0 means closer to viewer (front), z < 0 means behind (back)
        const moonIsInFront = moonPos.z > 0;

        // Similarly for earth (earth is on the skeleton, always "inside")
        const earthIsInFront = earthCenter.z > 0;

        // We'll draw in layers:
        // 1. Back wireframe lines (z < 0 portions)
        // 2. Earth and Moon if they are BEHIND
        // 3. Front wireframe lines (z > 0 portions)
        // 4. Earth and Moon if they are IN FRONT

        // Helper: draw a torus line segment only if it's in back or front
        function drawTorusCircle(thetaFn, phiFn, steps, isBackPass, style, lineWidth) {
            // Collect segments with their z-values
            let points = [];
            for (let i = 0; i <= steps; i++) {
                const frac = i / steps;
                const { theta, phi } = (typeof thetaFn === 'function')
                    ? { theta: thetaFn(frac), phi: phiFn(frac) }
                    : { theta: thetaFn, phi: phiFn };
                // Actually let's simplify: we pass a function that returns theta,phi for each step
                const p = torusTo2D(cx, cy, R, r, thetaFn(frac), phiFn(frac));
                points.push(p);
            }

            // Draw segments, filtering by z
            ctx.beginPath();
            let drawing = false;
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                const shouldDraw = isBackPass ? (p.z <= 0) : (p.z > 0);
                if (shouldDraw) {
                    if (!drawing) {
                        ctx.moveTo(p.x, p.y);
                        drawing = true;
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                } else {
                    if (drawing) {
                        // End this segment, start fresh
                        drawing = false;
                    }
                    // Skip but prepare for next segment
                    if (i + 1 < points.length) {
                        const next = points[i + 1];
                        const nextShouldDraw = isBackPass ? (next.z <= 0) : (next.z > 0);
                        if (nextShouldDraw) {
                            ctx.moveTo(p.x, p.y); // bridge point
                            drawing = true;
                        }
                    }
                }
            }
            ctx.strokeStyle = style;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }

        function drawAllWireframe(isBackPass) {
            const alphaMultiplier = isBackPass ? 0.4 : 1.0;

            // Longitude circles (constant phi, varying theta)
            const numLongitudes = 20;
            for (let j = 0; j < numLongitudes; j++) {
                const phi = (j / numLongitudes) * Math.PI * 2;
                const steps = 64;
                drawTorusCircle(
                    (frac) => frac * Math.PI * 2,
                    (frac) => phi,
                    steps,
                    isBackPass,
                    `rgba(120, 160, 255, ${0.35 * alphaMultiplier})`,
                    1.0
                );
            }

            // Meridian circles (constant theta, varying phi)
            const numMeridians = 24;
            for (let i = 0; i < numMeridians; i++) {
                const theta = (i / numMeridians) * Math.PI * 2;
                const steps = 32;
                drawTorusCircle(
                    (frac) => theta,
                    (frac) => frac * Math.PI * 2,
                    steps,
                    isBackPass,
                    `rgba(150, 200, 255, ${0.5 * alphaMultiplier})`,
                    1.2
                );
            }

            // Highlight meridian (current moon theta)
            drawTorusCircle(
                (frac) => moonTheta,
                (frac) => frac * Math.PI * 2,
                48,
                isBackPass,
                `rgba(255, 200, 50, ${0.7 * alphaMultiplier})`,
                2.0
            );

            // Highlight longitude (current moon phi)
            drawTorusCircle(
                (frac) => frac * Math.PI * 2,
                (frac) => moonPhi,
                64,
                isBackPass,
                `rgba(255, 150, 50, ${0.5 * alphaMultiplier})`,
                1.8
            );
        }

        function drawEarth() {
            // Earth drawn as a small filled circle (inside the tube)
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌍', earthCenter.x, earthCenter.y);

            ctx.font = '9px system-ui';
            ctx.fillStyle = 'rgba(100, 180, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Erde', earthCenter.x, earthCenter.y + 14);
        }

        function drawMoon() {
            // Glow
            const moonGlow = ctx.createRadialGradient(moonPos.x, moonPos.y, 0, moonPos.x, moonPos.y, 12);
            moonGlow.addColorStop(0, 'rgba(220, 220, 220, 0.5)');
            moonGlow.addColorStop(1, 'rgba(220, 220, 220, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(moonPos.x, moonPos.y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Moon emoji (normal full moon, not face)
            ctx.font = '13px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌕', moonPos.x, moonPos.y);
        }

        ctx.save();

        // === LAYER 1: Back wireframe ===
        drawAllWireframe(true);

        // === LAYER 2: Objects that are BEHIND ===
        if (!earthIsInFront) drawEarth();
        if (!moonIsInFront) drawMoon();

        // === LAYER 3: Front wireframe ===
        drawAllWireframe(false);

        // === LAYER 4: Objects that are IN FRONT ===
        if (earthIsInFront) drawEarth();
        if (moonIsInFront) drawMoon();

        ctx.restore();

        // === SONNE im Zentrum des Torus (das "Loch") ===
        const sunGlow2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
        sunGlow2.addColorStop(0, 'rgba(255,220,0,0.5)');
        sunGlow2.addColorStop(1, 'rgba(255,150,0,0)');
        ctx.fillStyle = sunGlow2;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☀️', cx, cy);

        // === Torus-Labels (kompakt, klar getrennt) ===
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = 'rgba(150, 200, 255, 0.95)';
        ctx.fillText('Torus-Attraktor (Homotopie)', cx, cy + R + r + 18);

        ctx.font = '10px system-ui';
        ctx.fillStyle = 'rgba(220, 220, 220, 0.85)';
        ctx.fillText('🌕 Mond-Position auf dem Torus', cx, cy + R + r + 33);

        ctx.font = '10px system-ui';
        ctx.fillStyle = 'rgba(255, 180, 180, 0.95)';
        ctx.fillText('⚠️ gleiche Topologie, nicht gleiche Geometrie', cx, cy + R + r + 48);
    }

    function draw() {
        if (!animationRunning) return;
        t++;

        ctx.clearRect(0, 0, W, H);

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0a0a2a');
        bgGrad.addColorStop(1, '#0f0f35');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        stars.forEach(s => {
            const twinkle = s.brightness * (0.7 + 0.3 * Math.sin(t * 0.02 + s.x));
            ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Trennlinie
        ctx.beginPath();
        ctx.moveTo(W * 0.52, 30);
        ctx.lineTo(W * 0.52, H - 30);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // === LINKE SEITE: Sonnensystem ===

        // Earth orbit path
        ctx.beginPath();
        ctx.ellipse(leftCx, leftCy, earthOrbitR, earthOrbitR * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,180,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Earth position
        earthAngle += earthSpeed;
        const earthX = leftCx + Math.cos(earthAngle) * earthOrbitR;
        const earthY = leftCy + Math.sin(earthAngle) * earthOrbitR * 0.4;

        // Moon position
        moonAngle += moonSpeed;
        const moonX = earthX + Math.cos(moonAngle) * moonOrbitR;
        const moonY = earthY + Math.sin(moonAngle) * moonOrbitR * 0.55;

        // Moon trail
        moonTrail.push({ x: moonX, y: moonY });
        if (moonTrail.length > maxTrail) moonTrail.shift();

        // Draw moon trail
        if (moonTrail.length > 2) {
            for (let i = 1; i < moonTrail.length; i++) {
                const alpha = (i / moonTrail.length) * 0.5;
                ctx.beginPath();
                ctx.moveTo(moonTrail[i - 1].x, moonTrail[i - 1].y);
                ctx.lineTo(moonTrail[i].x, moonTrail[i].y);
                ctx.strokeStyle = `rgba(200,200,255,${alpha})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        }

        // Sun glow
        const sunGlow = ctx.createRadialGradient(leftCx, leftCy, 0, leftCx, leftCy, 30);
        sunGlow.addColorStop(0, 'rgba(255,220,0,0.5)');
        sunGlow.addColorStop(1, 'rgba(255,150,0,0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(leftCx, leftCy, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☀️', leftCx, leftCy);

        // Earth
        ctx.font = '22px serif';
        ctx.fillText('🌍', earthX, earthY);

        // Moon orbit around earth
        ctx.beginPath();
        ctx.ellipse(earthX, earthY, moonOrbitR, moonOrbitR * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200,200,200,0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Moon (normal full moon emoji)
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌕', moonX, moonY);

        // Labels
        ctx.font = '11px system-ui';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('Sonne', leftCx, leftCy + 28);
        ctx.fillStyle = 'rgba(100,180,255,0.7)';
        ctx.fillText('Erde', earthX, earthY + 22);
        ctx.fillStyle = 'rgba(200,200,200,0.6)';
        ctx.fillText('Mond', moonX, moonY + 16);

        // === RECHTE SEITE: Torus mit Occlusion ===
        drawTorusWithOcclusion(rightCx, rightCy, torusR, torusr, earthAngle, moonAngle);

        // Labels oben links/rechts der Visualisierung
        ctx.font = 'bold 11px system-ui';
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText('Links: Physische Bahnen (Ekliptikebene)', 16, 24);
        ctx.textAlign = 'right';
        ctx.fillText('Rechts: Topologische Struktur (Homotopie)', W - 16, 24);

        activeAnimation = requestAnimationFrame(draw);
    }
    draw();
}

    // ============================================================
    // STEP 2: Lorenz – bleibt wie er ist (war super)
    // ============================================================
    function renderLorenz(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) {
            retryRender(renderLorenz, container, 150);
            return;
        }
        const { ctx, W, H } = setup;

        const sigma = 10, rho = 28, beta = 8 / 3;
        const dt = 0.005;

        // Pre-compute background path
        let bgPath = [];
        {
            let x = 1, y = 1, z = 1;
            for (let i = 0; i < 10000; i++) {
                const dx2 = sigma * (y - x);
                const dy2 = x * (rho - z) - y;
                const dz2 = x * y - beta * z;
                x += dx2 * dt; y += dy2 * dt; z += dz2 * dt;
                bgPath.push({ x, y, z });
            }
        }

        const numParticles = 6;
        let particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: 0.1 + (Math.random() - 0.5) * 5,
                y: 0.1 + (Math.random() - 0.5) * 5,
                z: 0.1 + Math.random() * 5,
                trail: [],
                color: `hsl(${i * 60}, 75%, 50%)`
            });
        }

        const scale = 5.0;
        animationRunning = true;
        let frame = 0;

        function project(x, y, z, offsetX, offsetY) {
            return { px: offsetX + x * scale, py: offsetY - z * scale * 0.5 };
        }

        function draw() {
            if (!animationRunning) return;
            frame++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const wobbleX = Math.sin(frame * 0.008) * 20;
            const wobbleY = Math.cos(frame * 0.006) * 10;
            const offsetX = W / 2 + wobbleX;
            const offsetY = H * 0.72 + wobbleY;

            // Background path
            ctx.beginPath();
            const p0 = project(bgPath[0].x, bgPath[0].y, bgPath[0].z, offsetX, offsetY);
            ctx.moveTo(p0.px, p0.py);
            for (let i = 1; i < bgPath.length; i += 3) {
                const p = project(bgPath[i].x, bgPath[i].y, bgPath[i].z, offsetX, offsetY);
                ctx.lineTo(p.px, p.py);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.04)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Particles
            particles.forEach(part => {
                for (let s = 0; s < 5; s++) {
                    const dx = sigma * (part.y - part.x);
                    const dy = part.x * (rho - part.z) - part.y;
                    const dz = part.x * part.y - beta * part.z;
                    part.x += dx * dt; part.y += dy * dt; part.z += dz * dt;
                }

                const pp = project(part.x, part.y, part.z, offsetX, offsetY);
                part.trail.push({ px: pp.px, py: pp.py });
                if (part.trail.length > 250) part.trail.shift();

                if (part.trail.length > 1) {
                    for (let i = 1; i < part.trail.length; i++) {
                        const alpha = (i / part.trail.length) * 0.7;
                        ctx.beginPath();
                        ctx.moveTo(part.trail[i - 1].px, part.trail[i - 1].py);
                        ctx.lineTo(part.trail[i].px, part.trail[i].py);
                        ctx.strokeStyle = part.color.replace(')', `,${alpha})`).replace('hsl', 'hsla');
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }

                ctx.beginPath();
                ctx.arc(pp.px, pp.py, 5, 0, Math.PI * 2);
                ctx.fillStyle = part.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Lorenz-Attraktor – deterministisches Chaos', W / 2, 22);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Der Attraktor bewegt sich leicht – die Punkte folgen ihm', W / 2, 40);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 3: Komplexe Becken – mit Attraktoren &amp; Repellern
    // ============================================================
    function renderComplexBasins(container) {
        const setup = safeCanvasSetup(container, '#fafafa');
        if (!setup) {
            retryRender(renderComplexBasins, container, 150);
            return;
        }
        const { ctx, W, H } = setup;

        const attractors = [
            { x: W * 0.25, y: H * 0.4, label: 'A', color: '#3b82f6', hue: 220 },
            { x: W * 0.75, y: H * 0.4, label: 'B', color: '#10b981', hue: 160 },
            { x: W * 0.5, y: H * 0.75, label: 'C', color: '#f59e0b', hue: 40 }
        ];

        const repellents = [
            { x: W * 0.4, y: H * 0.22, label: 'R₁', color: '#ef4444', strength: 220 },
            { x: W * 0.65, y: H * 0.65, label: 'R₂', color: '#ef4444', strength: 200 }
        ];

        const gridSize = 4;
        const cols = Math.ceil(W / gridSize);
        const rows = Math.ceil(H / gridSize);
        let basinMap = [];

        // Compute forces for basin map
        function computeForces(px, py) {
            let totalFx = 0, totalFy = 0;
            attractors.forEach(a => {
                const dx = a.x - px;
                const dy = a.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                const strength = 80 / (dist * dist);
                const angle = Math.atan2(dy, dx) + 0.8 / (dist * 0.02 + 1);
                totalFx += Math.cos(angle) * strength * dist;
                totalFy += Math.sin(angle) * strength * dist;
            });
            repellents.forEach(r => {
                const dx = px - r.x;
                const dy = py - r.y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                const strength = r.strength / (dist * dist);
                const angle = Math.atan2(dy, dx);
                totalFx += Math.cos(angle) * strength * dist;
                totalFy += Math.sin(angle) * strength * dist;
            });
            return { fx: totalFx, fy: totalFy };
        }

        for (let row = 0; row < rows; row++) {
            basinMap[row] = [];
            for (let col = 0; col < cols; col++) {
                const px = col * gridSize + gridSize / 2;
                const py = row * gridSize + gridSize / 2;

                let x = px, y = py;

                for (let iter = 0; iter < 25; iter++) {
                    const f = computeForces(x, y);
                    const norm = Math.sqrt(f.fx * f.fx + f.fy * f.fy) || 1;
                    x += (f.fx / norm) * 8;
                    y += (f.fy / norm) * 8;
                }

                let minDist = Infinity;
                let closestAttr = 0;
                attractors.forEach((a, idx) => {
                    const dx = a.x - x;
                    const dy = a.y - y;
                    const dist = dx * dx + dy * dy;
                    if (dist < minDist) {
                        minDist = dist;
                        closestAttr = idx;
                    }
                });

                basinMap[row][col] = closestAttr;
            }
        }

        const numParticles = 14;
        let particles = [];

        function spawnParticle() {
            const x = 40 + Math.random() * (W - 80);
            const y = 40 + Math.random() * (H - 80);
            const col = Math.floor(x / gridSize);
            const row = Math.floor(y / gridSize);
            const targetIdx = (basinMap[row] && basinMap[row][col] !== undefined) ? basinMap[row][col] : 0;
            return {
                x, y,
                vx: 0, vy: 0,
                targetIdx,
                trail: [],
                arrived: false,
                alpha: 1,
                age: 0
            };
        }

        for (let i = 0; i < numParticles; i++) {
            particles.push(spawnParticle());
        }

        animationRunning = true;
        let t = 0;

        function drawBasinBackground() {
            const offscreen = document.createElement('canvas');
            offscreen.width = W;
            offscreen.height = H;
            const offCtx = offscreen.getContext('2d');

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const attrIdx = basinMap[row][col];
                    const a = attractors[attrIdx];
                    offCtx.fillStyle = `hsla(${a.hue}, 45%, 75%, 0.35)`;
                    offCtx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
                }
            }

            for (let row = 1; row < rows - 1; row++) {
                for (let col = 1; col < cols - 1; col++) {
                    const current = basinMap[row][col];
                    const right = basinMap[row][col + 1];
                    const down = basinMap[row + 1] ? basinMap[row + 1][col] : current;
                    if (current !== right || current !== down) {
                        offCtx.fillStyle = 'rgba(30, 30, 60, 0.5)';
                        offCtx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
                    }
                }
            }

            return offscreen;
        }

        const basinCanvas = drawBasinBackground();

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            ctx.drawImage(basinCanvas, 0, 0);

            attractors.forEach((a, idx) => {
                const glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 35);
                glow.addColorStop(0, `hsla(${a.hue}, 70%, 50%, 0.4)`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(a.x, a.y, 35, 0, Math.PI * 2);
                ctx.fill();

                const pulse = 1 + 0.08 * Math.sin(t * 0.05 + idx);
                ctx.beginPath();
                ctx.arc(a.x, a.y, 10 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = a.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.font = 'bold 14px system-ui';
                ctx.fillStyle = a.color;
                ctx.textAlign = 'center';
                ctx.fillText(`Attraktor ${a.label}`, a.x, a.y - 20);
            });

            // Draw repellents
            repellents.forEach((r, idx) => {
                const dangerPulse = 1 + 0.1 * Math.sin(t * 0.06 + idx * 2.3);
                const radius = 14 * dangerPulse;

                // Danger glow
                const rGlow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 28);
                rGlow.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
                rGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = rGlow;
                ctx.beginPath();
                ctx.arc(r.x, r.y, 28, 0, Math.PI * 2);
                ctx.fill();

                // Red circle with X
                ctx.beginPath();
                ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // X mark
                const xSize = radius * 0.6;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(r.x - xSize, r.y - xSize);
                ctx.lineTo(r.x + xSize, r.y + xSize);
                ctx.moveTo(r.x + xSize, r.y - xSize);
                ctx.lineTo(r.x - xSize, r.y + xSize);
                ctx.stroke();

                // Shockwaves
                for (let w = 0; w < 2; w++) {
                    const wPhase = (t * 0.02 + idx * 1.5 + w * 0.7) % 1;
                    const wr = 22 + wPhase * 40;
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, wr, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 * (1 - wPhase)})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.font = 'bold 13px system-ui';
                ctx.fillStyle = '#dc2626';
                ctx.textAlign = 'center';
                ctx.fillText(`Repeller ${r.label}`, r.x, r.y - radius - 10);
            });

            particles.forEach((p, idx) => {
                if (p.arrived) {
                    p.alpha -= 0.015;
                    if (p.alpha <= 0) {
                        particles[idx] = spawnParticle();
                    }
                    return;
                }

                p.age++;
                const target = attractors[p.targetIdx];
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Attractor force
                const angle = Math.atan2(dy, dx);
                const spiralOffset = 0.12 * Math.exp(-dist * 0.015);
                const pullStrength = 0.35 + 0.9 * Math.min(1, dist / (W * 0.25));
                p.vx += Math.cos(angle + spiralOffset) * pullStrength;
                p.vy += Math.sin(angle + spiralOffset) * pullStrength;

                // Repeller force
                repellents.forEach(r => {
                    const rdx = p.x - r.x;
                    const rdy = p.y - r.y;
                    const rDist = Math.sqrt(rdx * rdx + rdy * rdy) + 1;
                    if (rDist < 250) {
                        const rAngle = Math.atan2(rdy, rdx);
                        const rStrength = r.strength * 0.0012 / (rDist * 0.25 + 1);
                        p.vx += Math.cos(rAngle) * rStrength;
                        p.vy += Math.sin(rAngle) * rStrength;
                    }
                });

                p.vx *= 0.96;
                p.vy *= 0.96;

                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 6) {
                    p.vx *= 6 / speed;
                    p.vy *= 6 / speed;
                }

                p.x += p.vx;
                p.y += p.vy;

                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 80) p.trail.shift();

                if (dist < 12) {
                    p.arrived = true;
                    p.alpha = 1;
                }

                if (p.trail.length > 1) {
                    const targetColor = target.color;
                    for (let i = 1; i < p.trail.length; i++) {
                        const alpha = (i / p.trail.length) * 0.5 * p.alpha;
                        ctx.beginPath();
                        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                        ctx.strokeStyle = targetColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
                        ctx.lineWidth = 2.5;
                        ctx.stroke();
                    }
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = target.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });

            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Komplexe Becken – Attraktoren & Repeller', W / 2, 22);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Die Farbe zeigt Einzugsbereiche der Attraktoren. Repeller (rot) stoßen Teilchen ab und verformen die Grenzen.', W / 2, 40);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

// ============================================================
// STEP 4: 3D-Einzugsbecken als Potentiallandschaft
// Labels WEIT AUSSERHALB des Plots mit langen Pfeilen
// Kamera: Drehen + Zoom + Pan
// ============================================================
function render3DBasins(container) {
    const setup = safeCanvasSetup(container, '#1a1a2e');
    if (!setup) {
        retryRender(render3DBasins, container, 150);
        return;
    }
    const { ctx, W, H } = setup;

    // === Becken (Täler) ===
    const basins = [
        { x: -1.3, y: -0.2, depth: 1.0, radius: 1.3, label: '„Frankreich"', sublabel: 'Stabil', color: '#3b82f6' },
        { x: 1.3, y: -0.2, depth: 1.0, radius: 1.3, label: '„Hauptstadt"', sublabel: 'Stabil', color: '#ef4444' },
        { x: 0.0, y: -0.2, depth: 1.5, radius: 0.65, label: '★ „Paris"', sublabel: 'Stabil (Überlappung)', color: '#ffd700' },
        { x: 0.0, y: 1.5, depth: 0.7, radius: 1.0, label: '„Kultur"', sublabel: 'Stabil', color: '#10b981' }
    ];

    const unstablePoints = [
        { x: -0.65, y: -0.2, label: 'Instabil', color: '#f87171' },
        { x: 0.65, y: -0.2, label: 'Instabil', color: '#f87171' },
        { x: 0.0, y: 0.6, label: 'Instabil', color: '#f87171' }
    ];

    function getHeight(px, py) {
        let h = 0.0;
        for (let b of basins) {
            const dx = px - b.x;
            const dy = py - b.y;
            const dist2 = dx * dx + dy * dy;
            const sigma2 = b.radius * b.radius * 0.5;
            h -= b.depth * Math.exp(-dist2 / sigma2);
        }
        h += 0.06 * Math.sin(px * 2.5) * Math.cos(py * 2.5);
        return h;
    }

    // === 3D-Gitter ===
    const gridRes = 55;
    const terrainRange = 3.2;
    const step = (terrainRange * 2) / gridRes;
    let heightMap = [];
    let minH = Infinity, maxH = -Infinity;

    for (let iy = 0; iy <= gridRes; iy++) {
        heightMap[iy] = [];
        for (let ix = 0; ix <= gridRes; ix++) {
            const px = -terrainRange + ix * step;
            const py = -terrainRange + iy * step;
            const h = getHeight(px, py);
            heightMap[iy][ix] = { x: px, y: py, h };
            if (h < minH) minH = h;
            if (h > maxH) maxH = h;
        }
    }

    function heightToColor(normalizedH) {
        const stops = [
            { t: 0.0, r: 100, g: 50, b: 10 },
            { t: 0.15, r: 160, g: 90, b: 25 },
            { t: 0.3, r: 210, g: 150, b: 45 },
            { t: 0.45, r: 235, g: 200, b: 70 },
            { t: 0.6, r: 170, g: 205, b: 90 },
            { t: 0.75, r: 90, g: 175, b: 95 },
            { t: 0.9, r: 55, g: 145, b: 115 },
            { t: 1.0, r: 35, g: 115, b: 105 }
        ];
        let lower = stops[0], upper = stops[stops.length - 1];
        for (let i = 0; i < stops.length - 1; i++) {
            if (normalizedH >= stops[i].t && normalizedH <= stops[i + 1].t) {
                lower = stops[i]; upper = stops[i + 1]; break;
            }
        }
        const range = upper.t - lower.t || 1;
        const f = (normalizedH - lower.t) / range;
        return {
            r: Math.round(lower.r + (upper.r - lower.r) * f),
            g: Math.round(lower.g + (upper.g - lower.g) * f),
            b: Math.round(lower.b + (upper.b - lower.b) * f)
        };
    }

    // === Kamera-State ===
    let camRotY = 0.6;
    let camTilt = 0.55;
    let camZoom = 1.0;
    let camPanX = 0;
    let camPanY = 0;
    let targetRotY = 0.6;
    let targetTilt = 0.55;
    let targetZoom = 1.0;
    let targetPanX = 0;
    let targetPanY = 0;

    const baseScaleX = Math.min(W, H) * 0.055;
    const baseScaleY = baseScaleX * 0.5;
    const heightScale = Math.min(W, H) * 0.1;

    function projectTerrain(px, py, h) {
        const rx = px * Math.cos(camRotY) - py * Math.sin(camRotY);
        const ry = px * Math.sin(camRotY) + py * Math.cos(camRotY);
        const scaleX = baseScaleX * camZoom;
        const scaleY = baseScaleY * camZoom;
        const hScale = heightScale * camZoom;
        const screenX = W / 2 + camPanX + rx * scaleX;
        const screenY = H / 2 + camPanY + 30 + ry * scaleY * camTilt - h * hScale;
        return { sx: screenX, sy: screenY, depth: ry };
    }

    // === Kugeln ===
    const numBalls = 18;
    let balls = [];

    function spawnBall() {
        const px = (Math.random() * 2 - 1) * terrainRange * 0.75;
        const py = (Math.random() * 2 - 1) * terrainRange * 0.75;
        return {
            x: px, y: py, vx: 0, vy: 0,
            trail: [{ x: px, y: py }],
            arrived: false, alpha: 1.0, age: 0
        };
    }

    for (let i = 0; i < numBalls; i++) {
        const b = spawnBall();
        b.age = Math.floor(Math.random() * 100);
        balls.push(b);
    }

    // === Interaktion ===
    let isDragging = false;
    let isPanning = false;
    let lastMouseX = 0, lastMouseY = 0;
    const canvas = setup.canvas;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        isPanning = e.shiftKey || e.button === 1;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        if (isPanning || e.shiftKey) {
            targetPanX += dx;
            targetPanY += dy;
        } else {
            targetRotY += dx * 0.005;
            targetTilt += dy * 0.003;
            targetTilt = Math.max(0.2, Math.min(1.0, targetTilt));
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; isPanning = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; isPanning = false; });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        targetZoom *= zoomDelta;
        targetZoom = Math.max(0.4, Math.min(3.0, targetZoom));
    }, { passive: false });

    let lastTouchDist = 0;
    let lastTouchMidX = 0, lastTouchMidY = 0;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true; isPanning = false;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            isDragging = false; isPanning = true;
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            lastTouchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            lastTouchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - lastMouseX;
            const dy = e.touches[0].clientY - lastMouseY;
            targetRotY += dx * 0.005;
            targetTilt += dy * 0.003;
            targetTilt = Math.max(0.2, Math.min(1.0, targetTilt));
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            if (lastTouchDist > 0) {
                targetZoom *= dist / lastTouchDist;
                targetZoom = Math.max(0.4, Math.min(3.0, targetZoom));
            }
            targetPanX += midX - lastTouchMidX;
            targetPanY += midY - lastTouchMidY;
            lastTouchDist = dist;
            lastTouchMidX = midX;
            lastTouchMidY = midY;
        }
    });
    canvas.addEventListener('touchend', () => { isDragging = false; isPanning = false; lastTouchDist = 0; });

    // === Animation ===
    animationRunning = true;
    let t = 0;

    // Feste Label-Positionen am RAND des Canvas (absolut, nicht relativ zum Terrain)
    const fixedLabelAnchors = [
        { basinIdx: 0, x: 55, y: 75 },           // Frankreich → links oben
        { basinIdx: 1, x: W - 55, y: 75 },       // Hauptstadt → rechts oben
        { basinIdx: 2, x: W / 2, y: 62 },        // Paris → oben mitte
        { basinIdx: 3, x: W - 55, y: H - 80 }    // Kultur → rechts unten
    ];

    function draw() {
        if (!animationRunning) return;
        t++;

        if (!isDragging && !isPanning) targetRotY += 0.0008;

        camRotY += (targetRotY - camRotY) * 0.06;
        camTilt += (targetTilt - camTilt) * 0.06;
        camZoom += (targetZoom - camZoom) * 0.08;
        camPanX += (targetPanX - camPanX) * 0.08;
        camPanY += (targetPanY - camPanY) * 0.08;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8f6f0';
        ctx.fillRect(0, 0, W, H);

        // === Terrain ===
        let quads = [];
        for (let iy = 0; iy < gridRes; iy++) {
            for (let ix = 0; ix < gridRes; ix++) {
                const p00 = heightMap[iy][ix];
                const p10 = heightMap[iy][ix + 1];
                const p01 = heightMap[iy + 1][ix];
                const p11 = heightMap[iy + 1][ix + 1];
                const avgH = (p00.h + p10.h + p01.h + p11.h) / 4;
                const avgX = (p00.x + p10.x) / 2;
                const avgY = (p00.y + p01.y) / 2;
                const proj = projectTerrain(avgX, avgY, avgH);
                quads.push({ corners: [p00, p10, p11, p01], avgH, depth: proj.depth });
            }
        }
        quads.sort((a, b) => a.depth - b.depth);

        const hRange = maxH - minH || 1;
        for (let q of quads) {
            const projCorners = q.corners.map(c => projectTerrain(c.x, c.y, c.h));
            const normalizedH = (q.avgH - minH) / hRange;
            const col = heightToColor(normalizedH);
            const dx = (q.corners[1].h - q.corners[0].h);
            const dy = (q.corners[3].h - q.corners[0].h);
            const lightFactor = Math.max(0.55, Math.min(1.35, 1.0 + dx * 2.5 - dy * 1.5));
            const r = Math.min(255, Math.round(col.r * lightFactor));
            const g = Math.min(255, Math.round(col.g * lightFactor));
            const b = Math.min(255, Math.round(col.b * lightFactor));

            ctx.beginPath();
            ctx.moveTo(projCorners[0].sx, projCorners[0].sy);
            ctx.lineTo(projCorners[1].sx, projCorners[1].sy);
            ctx.lineTo(projCorners[2].sx, projCorners[2].sy);
            ctx.lineTo(projCorners[3].sx, projCorners[3].sy);
            ctx.closePath();
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // === Höhenlinien ===
        const numContours = 10;
        ctx.lineWidth = 0.7;
        for (let c = 1; c < numContours; c++) {
            const contourH = minH + (c / numContours) * hRange;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            for (let iy = 0; iy < gridRes; iy++) {
                for (let ix = 0; ix < gridRes; ix++) {
                    const p0 = heightMap[iy][ix];
                    const p1 = heightMap[iy][ix + 1];
                    if ((p0.h - contourH) * (p1.h - contourH) < 0) {
                        const frac = (contourH - p0.h) / (p1.h - p0.h);
                        const cx1 = p0.x + frac * (p1.x - p0.x);
                        const cy1 = p0.y;
                        const p2 = heightMap[iy + 1] ? heightMap[iy + 1][ix] : null;
                        if (p2 && (p0.h - contourH) * (p2.h - contourH) < 0) {
                            const frac2 = (contourH - p0.h) / (p2.h - p0.h);
                            const cx2 = p0.x;
                            const cy2 = p0.y + frac2 * step;
                            const proj1 = projectTerrain(cx1, cy1, contourH);
                            const proj2 = projectTerrain(cx2, cy2, contourH);
                            ctx.beginPath();
                            ctx.moveTo(proj1.sx, proj1.sy);
                            ctx.lineTo(proj2.sx, proj2.sy);
                            ctx.stroke();
                        }
                    }
                }
            }
        }

        // === Kugeln ===
        balls.forEach((ball, idx) => {
            if (ball.arrived) {
                ball.alpha -= 0.012;
                if (ball.alpha <= 0) { balls[idx] = spawnBall(); }
                return;
            }
            ball.age++;
            const eps = 0.05;
            const hHere = getHeight(ball.x, ball.y);
            const gradX = -(getHeight(ball.x + eps, ball.y) - hHere) / eps;
            const gradY = -(getHeight(ball.x, ball.y + eps) - hHere) / eps;
            ball.vx += gradX * 0.004;
            ball.vy += gradY * 0.004;
            ball.vx *= 0.95;
            ball.vy *= 0.95;
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 35) ball.trail.shift();
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed < 0.0008 && ball.age > 60) { ball.arrived = true; ball.alpha = 1.0; }
            ball.x = Math.max(-terrainRange, Math.min(terrainRange, ball.x));
            ball.y = Math.max(-terrainRange, Math.min(terrainRange, ball.y));

            if (ball.trail.length > 1) {
                for (let i = 1; i < ball.trail.length; i++) {
                    const h1 = getHeight(ball.trail[i-1].x, ball.trail[i-1].y);
                    const h2 = getHeight(ball.trail[i].x, ball.trail[i].y);
                    const p1 = projectTerrain(ball.trail[i-1].x, ball.trail[i-1].y, h1 - 0.03);
                    const p2 = projectTerrain(ball.trail[i].x, ball.trail[i].y, h2 - 0.03);
                    const trailAlpha = (i / ball.trail.length) * 0.5 * ball.alpha;
                    ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
                    ctx.strokeStyle = `rgba(20, 20, 20, ${trailAlpha})`;
                    ctx.lineWidth = 2; ctx.stroke();
                }
            }

            const ballH = getHeight(ball.x, ball.y);
            const bp = projectTerrain(ball.x, ball.y, ballH - 0.05);
            ctx.beginPath();
            ctx.ellipse(bp.sx + 2, bp.sy + 3, 4, 2.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,0,0,${0.25 * ball.alpha})`;
            ctx.fill();
            ctx.beginPath(); ctx.arc(bp.sx, bp.sy, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(30, 30, 50, ${ball.alpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255,255,255,${0.6 * ball.alpha})`;
            ctx.lineWidth = 1.2; ctx.stroke();
        });

        // === Instabile Punkte ===
        unstablePoints.forEach(up => {
            const h = getHeight(up.x, up.y);
            const proj = projectTerrain(up.x, up.y, h);
            const s = 5;
            ctx.beginPath();
            ctx.moveTo(proj.sx - s, proj.sy - s); ctx.lineTo(proj.sx + s, proj.sy + s);
            ctx.moveTo(proj.sx + s, proj.sy - s); ctx.lineTo(proj.sx - s, proj.sy + s);
            ctx.strokeStyle = 'rgba(220, 50, 50, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // === LABELS WEIT AUSSERHALB – feste Positionen am Canvas-Rand ===
        fixedLabelAnchors.forEach(anchor => {
            const basin = basins[anchor.basinIdx];
            const basinH = getHeight(basin.x, basin.y);
            const basinProj = projectTerrain(basin.x, basin.y, basinH);

            const labelX = anchor.x;
            const labelY = anchor.y;
            const targetX = basinProj.sx;
            const targetY = basinProj.sy;

            // === Langer Pfeil vom Label zum Tal ===
            // Berechne Punkt auf der Label-Box-Kante (Startpunkt des Pfeils)
            const angle = Math.atan2(targetY - labelY, targetX - labelX);

            // Pfeil-Startpunkt: etwas Abstand von der Label-Box
            const startDist = 25;
            const arrowStartX = labelX + Math.cos(angle) * startDist;
            const arrowStartY = labelY + Math.sin(angle) * startDist;

            // Pfeil-Endpunkt: etwas vor dem Zielpunkt
            const endDist = 12;
            const arrowEndX = targetX - Math.cos(angle) * endDist;
            const arrowEndY = targetY - Math.sin(angle) * endDist;

            // Pfeil-Linie (gestrichelt für Eleganz)
            ctx.beginPath();
            ctx.moveTo(arrowStartX, arrowStartY);

            // Leicht gebogener Pfeil (Bezier) für bessere Lesbarkeit
            const midX = (arrowStartX + arrowEndX) / 2;
            const midY = (arrowStartY + arrowEndY) / 2;
            const perpX = -Math.sin(angle) * 15;
            const perpY = Math.cos(angle) * 15;
            ctx.quadraticCurveTo(midX + perpX, midY + perpY, arrowEndX, arrowEndY);

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pfeilspitze
            const tipAngle = Math.atan2(targetY - midY, targetX - midX);
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowEndY);
            ctx.lineTo(arrowEndX - 10 * Math.cos(tipAngle - 0.35), arrowEndY - 10 * Math.sin(tipAngle - 0.35));
            ctx.lineTo(arrowEndX - 10 * Math.cos(tipAngle + 0.35), arrowEndY - 10 * Math.sin(tipAngle + 0.35));
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fill();

            // Kleiner Punkt am Ziel (im Tal)
            ctx.beginPath();
            ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
            ctx.fillStyle = basin.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // === Label-Box ===
            ctx.font = 'bold 12px system-ui';
            const labelText = basin.label;
            const textWidth = ctx.measureText(labelText).width;
            const boxW = textWidth + 18;
            const boxH = 38;
            const boxX = labelX - boxW / 2;
            const boxY = labelY - boxH / 2;

            // Schatten
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.beginPath();
            ctx.roundRect(boxX + 2, boxY + 2, boxW, boxH, 6);
            ctx.fill();

            // Box-Hintergrund
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 6);
            ctx.fill();
            ctx.strokeStyle = basin.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Label-Text
            ctx.fillStyle = basin.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, labelX, boxY + 14);

            // Sublabel
            ctx.font = '9px system-ui';
            ctx.fillStyle = '#666';
            ctx.fillText(basin.sublabel, labelX, boxY + 28);
            ctx.textBaseline = 'alphabetic';
        });

        // === Titel ===
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('3D-Einzugsbecken – Potentiallandschaft', W / 2, 22);

        ctx.font = '11px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Kugeln rollen bergab in Täler (Attraktoren). „Paris" = tiefstes Tal in der Überlappung.', W / 2, 40);

        // === Legende unten links ===
        const legX = 12, legY = H - 55;
        ctx.font = '9px system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Tief (Attraktor) ←→ Hoch (Grenze)', legX, legY);
        const barW = 100, barH = 8;
        const barGrad = ctx.createLinearGradient(legX, 0, legX + barW, 0);
        barGrad.addColorStop(0, 'rgb(100, 50, 10)');
        barGrad.addColorStop(0.35, 'rgb(210, 150, 45)');
        barGrad.addColorStop(0.65, 'rgb(170, 205, 90)');
        barGrad.addColorStop(1, 'rgb(35, 115, 105)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(legX, legY + 4, barW, barH);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(legX, legY + 4, barW, barH);

        // === Steuerungshinweis ===
        ctx.font = '9px system-ui';
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('🖱 Ziehen = Drehen · Shift+Ziehen = Verschieben · Scrollen = Zoom', W / 2, H - 8);

        activeAnimation = requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================
// STEP 7: Generator (Quelle)
// Partikel kommen von links, fliegen strikt nach rechts.
// 3 Attraktor-Becken ziehen sie an (= Wortbedeutungen).
// 2 Repeller bremsen sie aus — Partikel sammeln sich dort und bleiben stehen
// (statt aktiv weggestoßen zu werden). Visualisiert die ungefähre
// Wortbedeutungs-Landschaft eines LLM.
// ============================================================
// STEP 7: Generator (Quelle)
// JEDES Token hat einen eigenen Affinit\u00e4ts-Vektor f\u00fcr alle Regionen.
// Affinit\u00e4t geht von -1 (starker Repeller) bis +1 (starker Attraktor).
// Eine Region kann f\u00fcr ein Wort anziehend und f\u00fcr ein anderes
// absto\u00dfend wirken (kontextabh\u00e4ngig).
// "die"     -> funk +0.9, subst -0.8, l\u00e4nder -0.6, st\u00e4dte -0.6
// "hauptstadt" -> subst +0.9, st\u00e4dte +0.5 (Hauptstadt IST Stadt!), funk -0.7, l\u00e4nder +0.2
// "von"     -> funk +0.9, subst -0.8, l\u00e4nder -0.6, st\u00e4dte -0.6
// "frankreich" -> l\u00e4nder +0.95, subst +0.6 (Land IST Substantiv!), st\u00e4dte +0.3
// "ist"     -> funk +0.7, subst -0.8, l\u00e4nder -0.6, st\u00e4dte -0.6
// "Paris"   -> st\u00e4dte +0.95, subst +0.7 (Stadt IST Substantiv!), l\u00e4nder +0.5 (in Frankreich)
// ============================================================
function renderGenerator(container) {
    const setup = safeCanvasSetup(container, '#fafafa');
    if (!setup) {
        retryRender(renderGenerator, container, 150);
        return;
    }
    const { ctx, W, H } = setup;

    const sourceX = 70, sourceY = H * 0.52;
    const basinR = 62;

    // === Semantische Einzugsbecken (2x2) ===
    const regions = [
        { id: 'funk',    x: W * 0.30, y: H * 0.34, color: '#10b981' },
        { id: 'subst',   x: W * 0.28, y: H * 0.80, color: '#f59e0b' },
        { id: 'laender', x: W * 0.76, y: H * 0.34, color: '#3b82f6' },
        { id: 'staedte', x: W * 0.76, y: H * 0.80, color: '#8b5cf6' }
    ];

    function regionById(id) { return regions.find(r => r.id === id); }
    function homeOf(aff) {
        let best = 'funk', bv = -1;
        for (const k in aff) { if (aff[k] > bv) { bv = aff[k]; best = k; } }
        return best;
    }

    // === Affinitäts-Vektoren pro Wort ===
    // Format: { funk: -1..+1, subst: -1..+1, laender: -1..+1, staedte: -1..+1 }
    const WORDS = [
        { w: 'die',        aff: { funk: +0.9, subst: -0.7, laender: -0.6, staedte: -0.6 } },
        { w: 'hauptstadt', aff: { funk: -0.6, subst: +0.9, laender: +0.3, staedte: +0.5 } },
        { w: 'von',        aff: { funk: +0.8, subst: -0.8, laender: -0.7, staedte: -0.7 } },
        { w: 'frankreich', aff: { funk: -0.7, subst: +0.6, laender: +0.95, staedte: +0.3 } },
        { w: 'ist',        aff: { funk: +0.7, subst: -0.8, laender: -0.6, staedte: -0.6 } },
        { w: 'Paris',      aff: { funk: -0.3, subst: +0.2, laender: +0.6, staedte: +0.95 } }
    ];

    let sentenceIdx = 0;
    let activeParticle = null;
    let pauseFrames = 50;
    let cycleComplete = false;
    let cyclePause = 0;

    function hexA(hex, a) {
        const n = parseInt(hex.slice(1), 16);
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }

    function spawnNext() {
        if (sentenceIdx >= WORDS.length) {
            cycleComplete = true;
            cyclePause = 0;
            activeParticle = null;
            return;
        }
        const data = WORDS[sentenceIdx];
        sentenceIdx++;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 0.5;
        activeParticle = {
            x: sourceX,
            y: sourceY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            heading: angle,
            turnRate: (Math.random() - 0.5) * 0.03,
            turnChangeTimer: 60 + Math.floor(Math.random() * 120),
            inBasin: false,
            word: data.w,
            color: regionById(homeOf(data.aff)).color,
            home: regionById(homeOf(data.aff)),
            trail: [],
            landed: false,
            dead: false,
            alpha: 1
        };
    }

    function startNewCycle() {
        sentenceIdx = 0;
        activeParticle = null;
        pauseFrames = 50;
        cycleComplete = false;
        cyclePause = 0;
    }

    function updateParticle() {
        const p = activeParticle;
        if (p.landed) {
            // Verblassen im Attraktor (wie beim Punkt-Attraktor)
            p.alpha -= 0.015;
            if (p.alpha <= 0) p.dead = true;
            return;
        }

        const dx = p.home.x - p.x, dy = p.home.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < basinR) {
            // ===== IM EINZUGSBEREICH: Spirale nach innen =====
            if (!p.inBasin) {
                p.inBasin = true;
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const a = Math.atan2(dy, dx);
                p.vx = Math.cos(a + Math.PI / 2.5) * speed * 0.7;
                p.vy = Math.sin(a + Math.PI / 2.5) * speed * 0.7;
            }
            const a = Math.atan2(dy, dx);
            const radial = 0.12 + (1 - dist / basinR) * 0.22;
            p.vx += Math.cos(a) * radial;
            p.vy += Math.sin(a) * radial;
            const tang = 0.05 * (dist / basinR);
            p.vx += Math.cos(a + Math.PI / 2) * tang;
            p.vy += Math.sin(a + Math.PI / 2) * tang;
            p.vx *= 0.95;
            p.vy *= 0.95;
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxSpeed = 2.8 * (dist / basinR + 0.15);
            if (speed > maxSpeed) {
                p.vx *= maxSpeed / speed;
                p.vy *= maxSpeed / speed;
            }
            if (dist < 8) {
                p.landed = true;
                p.alpha = 1;
                p.x = p.home.x;
                p.y = p.home.y;
            }
        } else {
            // ===== FREIE BEWEGUNG: sanfter Wandel + Bias Richtung Heimat =====
            p.turnChangeTimer--;
            if (p.turnChangeTimer <= 0) {
                p.turnRate += (Math.random() - 0.5) * 0.02;
                p.turnRate = Math.max(-0.04, Math.min(0.04, p.turnRate));
                p.turnChangeTimer = 40 + Math.floor(Math.random() * 80);
            }
            p.heading += p.turnRate;

            const bias = 0.02 + 0.10 * Math.min(1, (dist - basinR) / 250);
            p.heading += (Math.atan2(dy, dx) - p.heading) * bias;

            const targetSpeed = 1.8;
            const tvx = Math.cos(p.heading) * targetSpeed;
            const tvy = Math.sin(p.heading) * targetSpeed;
            p.vx += (tvx - p.vx) * 0.04;
            p.vy += (tvy - p.vy) * 0.04;

            // Wandabstoßung
            const margin = 60;
            if (p.x < margin) { p.heading += 0.05; p.vx += 0.1; }
            if (p.x > W - margin) { p.heading -= 0.05; p.vx -= 0.1; }
            if (p.y < margin) { p.heading += 0.05; p.vy += 0.1; }
            if (p.y > H - margin) { p.heading -= 0.05; p.vy -= 0.1; }

            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 2.5) {
                p.vx *= 2.5 / speed;
                p.vy *= 2.5 / speed;
            }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(10, Math.min(W - 10, p.x));
        p.y = Math.max(10, Math.min(H - 10, p.y));

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 120) p.trail.shift();
    }

    animationRunning = true;
    let t = 0;

    // === Einzugsbecken zeichnen (Stil: Punkt-Attraktor) ===
    function drawBasin(cx, cy, color, id, isHome) {
        const pulse = isHome ? (1 + 0.15 * Math.sin(t * 0.08)) : 1;

        // Konzentrische Ringe (Trichter)
        for (let r = basinR; r > 8; r -= 4) {
            const progress = 1 - r / basinR;
            const alpha = 0.015 + progress * 0.10;
            ctx.beginPath();
            ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = hexA(color, alpha);
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Spirallinien im Trichter (nur beim Ziel-Becken voll sichtbar)
        ctx.save();
        ctx.globalAlpha = isHome ? 0.14 : 0.05;
        for (let s = 0; s < 4; s++) {
            ctx.beginPath();
            const startAngle = (s / 4) * Math.PI * 2 + t * 0.005;
            for (let i = 0; i < 100; i++) {
                const progress = i / 100;
                const r = basinR * (1 - progress);
                const angle = startAngle + progress * Math.PI * 3;
                const px = cx + Math.cos(angle) * r;
                const py = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();

        // Gestrichelter Rand des Einzugsbereichs
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, basinR, 0, Math.PI * 2);
        ctx.strokeStyle = hexA(color, 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Label oben
        ctx.font = '10px system-ui';
        ctx.fillStyle = hexA(color, 0.85);
        ctx.textAlign = 'center';
        ctx.fillText('Einzugsbereich', cx, cy - basinR - 10);

        // Attraktor-Kern (pulsierend)
        ctx.beginPath();
        ctx.arc(cx, cy, 8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Region-Name darunter
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = color;
        ctx.fillText(regionLabel(id), cx, cy + 30);
    }

    function draw() {
        if (!animationRunning) return;
        t++;

        // === State-Machine: Wörter nacheinander erzeugen ===
        if (cycleComplete) {
            cyclePause++;
            if (cyclePause > 170) startNewCycle();
        } else if (!activeParticle || activeParticle.dead) {
            pauseFrames++;
            if (pauseFrames > 45) {
                spawnNext();
                pauseFrames = 0;
            }
        }

        if (activeParticle && !activeParticle.dead) {
            updateParticle();
        }

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, W, H);

        // === Satz-Builder oben ===
        const sentenceY = 60;
        ctx.font = '20px system-ui';
        ctx.textAlign = 'left';
        let xCursor = 40;

        for (let i = 0; i < WORDS.length; i++) {
            const isCurrent = (i === sentenceIdx - 1 && !cycleComplete && activeParticle && !activeParticle.dead);
            const isPast = (i < sentenceIdx - 1) || cycleComplete;
            const token = WORDS[i].w;
            const displayColor = regionById(homeOf(WORDS[i].aff)).color;

            const tokenWidth = ctx.measureText(token).width + 16;
            if (isPast) {
                ctx.fillStyle = displayColor + '33';
                ctx.beginPath();
                ctx.roundRect(xCursor, sentenceY - 18, tokenWidth, 28, 6);
                ctx.fill();
            }
            if (isCurrent) {
                ctx.fillStyle = displayColor + '55';
                ctx.beginPath();
                ctx.roundRect(xCursor, sentenceY - 18, tokenWidth, 28, 6);
                ctx.fill();
            }

            ctx.fillStyle = isCurrent || isPast ? displayColor : '#cbd5e1';
            ctx.font = isCurrent ? 'bold 20px system-ui' : '20px system-ui';
            ctx.fillText(token, xCursor + 8, sentenceY);

            xCursor += tokenWidth + 10;
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px system-ui';
        ctx.fillText('_', xCursor, sentenceY);

        // === Einzugsbecken ===
        regions.forEach(rg => {
            const isHome = activeParticle && !activeParticle.dead && activeParticle.home.id === rg.id;
            drawBasin(rg.x, rg.y, rg.color, rg.id, isHome);
        });

        // === Generator (Quelle) ===
        const sourcePulse = 1 + 0.20 * Math.sin(t * 0.10);
        // Ausgehende "Emissions"-Ringe
        for (let w = 0; w < 3; w++) {
            const phase = (t * 0.012 + w * 0.33) % 1;
            const wr = 10 + phase * 34;
            ctx.beginPath();
            ctx.arc(sourceX, sourceY, wr, 0, Math.PI * 2);
            ctx.strokeStyle = hexA('#0891b2', 0.25 * (1 - phase));
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sourceX, sourceY, 9 * sourcePulse, 0, Math.PI * 2);
        ctx.fillStyle = '#0891b2';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#0891b2';
        ctx.textAlign = 'center';
        ctx.fillText('Generator', sourceX, sourceY + 30);

        // === Partikel (aktuelles Wort) ===
        if (activeParticle && !activeParticle.dead) {
            const p = activeParticle;

            // Trail
            if (p.trail.length > 1) {
                for (let i = 1; i < p.trail.length; i++) {
                    const alpha = (i / p.trail.length) * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                    ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    ctx.strokeStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            if (p.landed) {
                // Verblassen im Attraktor
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.home.x, p.home.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Wort-Label über dem Partikel
                ctx.font = 'bold 12px system-ui';
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.fillText(p.word, p.x, p.y - 13);
            }
        }

        // Caption oben
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.textAlign = 'center';
        ctx.fillText('Der Generator erzeugt die Wörter des Satzes nacheinander — jedes Wort rollt in sein semantisches Einzugsbecken', W / 2, 22);
        ctx.font = '9px system-ui';
        ctx.fillStyle = 'rgba(100,116,139,0.85)';
        ctx.fillText('«hauptstadt» → Substantive, «frankreich» → Länder, «Paris» → Städte — erst wenn ein Wort gelandet ist, wird das nächste erzeugt', W / 2, 36);

        activeAnimation = requestAnimationFrame(draw);
    }

    startNewCycle();
    draw();
}

// Hilfsfunktion f\u00fcr Region-Labels (au\u00dferhalb der IIFE vermeiden)
function regionLabel(id) {
    if (id === 'funk')    return 'Funktionswort';
    if (id === 'subst')   return 'Substantiv';
    if (id === 'laender') return 'L\u00e4nder';
    if (id === 'staedte') return 'St\u00e4dte';
    return id;
}

    // ============================================================
    // PUBLIC API
    // ============================================================
    function init() {
        const container = document.getElementById('attractor-viz-container');
        if (!container) return;
        currentStep = 0;
        subStep = 0;
        retryCount = 0;
        renderStep(0);
    }

    return {
        init,
        next,
        prev,
        canGoNext,
        canGoPrev,
        reset,
        isOnAttractorSlide
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => AttractorViz.init(), 200));
} else {
    setTimeout(() => AttractorViz.init(), 200);
}

// Handle resize with debounce
let resizeTimeout = null;
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (AttractorViz.isOnAttractorSlide()) {
            AttractorViz.reset();
            AttractorViz.init();
        }
    }, 300);
});
