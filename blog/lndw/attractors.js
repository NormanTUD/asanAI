// ============================================================
// ATTRACTOR BASIN VISUALIZATION v7
// Fixes:
// 1. Punkt-Attraktor: sanfte Bewegung statt abrupter Richtungswechsel
// 2. Torus: deutlich sichtbarer Wireframe mit höherer Opazität
// 3. Lorenz: unverändert (war gut)
// 4. Komplexe Becken: unverändert (war gut)
// 5. 3D überlappende Becken (ersetzt altes "Mehrdimensional")
// 6. "Paris" entfernt (von 5 abgedeckt)
// ============================================================
const AttractorViz = (() => {
    let currentStep = 0;
    let subStep = 0;
    const totalSteps = 5;
    let activeAnimation = null;
    let animationRunning = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    function isOnAttractorSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Attraktoren';
    }

    function canGoNext() {
        if (!isOnAttractorSlide()) return false;
        return currentStep < totalSteps - 1;
    }

    function canGoPrev() {
        if (!isOnAttractorSlide()) return false;
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
            '<b>Punkt-Attraktor:</b> Punkte bewegen sich frei im Raum. Sobald sie in das Becken des Attraktors geraten, werden sie unaufhaltsam hineingezogen.',
            '<b>Torus-Attraktor:</b> ☀️ Sonne → 🌍 Erde kreist darum → 🌑 Mond kreist um die Erde. Die Mondbahn zeichnet einen Torus: ein Kreis um einen Kreis.',
            '<b>Lorenz-Attraktor:</b> Deterministisches Chaos – die Punkte folgen dem Attraktor auf unvorhersagbaren, aber gebundenen Bahnen.',
            '<b>Komplexe Becken:</b> Mehrere Attraktoren mit verschlungenen Einzugsbereichen – je nach Startpunkt landet man in einem anderen Becken.',
            '<b>3D-Becken:</b> In höheren Dimensionen überlappen sich Einzugsbecken auf komplexe Weise – Grenzen sind fraktal und verschlungen.'
        ];
        const captionEl = document.getElementById('attractor-caption');
        if (captionEl) captionEl.innerHTML = captions[step] || '';

        switch (step) {
            case 0: renderPointAttractor(container); break;
            case 1: renderTorusEarth(container); break;
            case 2: renderLorenz(container); break;
            case 3: renderComplexBasins(container); break;
            case 4: render3DBasins(container); break;
        }
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

                    const radialStrength = 0.06 + (1 - dist / basinRadius) * 0.12;
                    const angleToCenter = Math.atan2(dy, dx);
                    p.vx += Math.cos(angleToCenter) * radialStrength;
                    p.vy += Math.sin(angleToCenter) * radialStrength;

                    // Tangential für Spiraleffekt
                    const tangentialStrength = 0.03 * (dist / basinRadius);
                    p.vx += Math.cos(angleToCenter + Math.PI / 2) * tangentialStrength;
                    p.vy += Math.sin(angleToCenter + Math.PI / 2) * tangentialStrength;

                    // Dämpfung
                    p.vx *= 0.93;
                    p.vy *= 0.93;

                    // Speed-Limit
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    const maxSpeed = 2.0 * (dist / basinRadius + 0.15);
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
                    // ===== FREIE BEWEGUNG: SANFT statt abrupt =====
                    
                    // Sanfte Richtungsänderung: Heading dreht sich langsam
                    p.turnChangeTimer--;
                    if (p.turnChangeTimer <= 0) {
                        // Nur die DREHRATE leicht ändern, nicht die Richtung selbst
                        p.turnRate += (Math.random() - 0.5) * 0.02;
                        // Drehrate begrenzen
                        p.turnRate = Math.max(-0.04, Math.min(0.04, p.turnRate));
                        p.turnChangeTimer = 40 + Math.floor(Math.random() * 80);
                    }

                    // Heading sanft drehen
                    p.heading += p.turnRate;

                    // Geschwindigkeit sanft in Richtung des Headings lenken
                    const targetSpeed = 1.5;
                    const targetVx = Math.cos(p.heading) * targetSpeed;
                    const targetVy = Math.sin(p.heading) * targetSpeed;

                    // Sanfte Interpolation (kein abrupter Wechsel!)
                    p.vx += (targetVx - p.vx) * 0.03;
                    p.vy += (targetVy - p.vy) * 0.03;

                    // Sanfte Wandabstoßung: Heading vom Rand wegdrehen
                    const margin = 60;
                    if (p.x < margin) {
                        p.heading += 0.05;
                        p.vx += 0.1;
                    }
                    if (p.x > W - margin) {
                        p.heading -= 0.05;
                        p.vx -= 0.1;
                    }
                    if (p.y < margin) {
                        p.heading += 0.05;
                        p.vy += 0.1;
                    }
                    if (p.y > H - margin) {
                        p.heading -= 0.05;
                        p.vy -= 0.1;
                    }

                    // Absolutes Speed-Limit
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > 2.5) {
                        p.vx *= 2.5 / speed;
                        p.vy *= 2.5 / speed;
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
    // STEP 1: Torus – Erde/Mond/Sonne + SICHTBARER Torus-Wireframe
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

        // Torus parameters – GRÖSSER und sichtbarer
        const torusR = Math.min(W * 0.17, H * 0.22); // Major radius
        const torusr = torusR * 0.38; // Minor radius – etwas größer

        animationRunning = true;
        let t = 0;

        function drawTorusWireframe(cx, cy, R, r, moonTheta, moonPhi) {
            const tiltX = 0.5; // Stärkere Neigung für bessere 3D-Sichtbarkeit
            const tiltZ = t * 0.003;

            function torusTo2D(theta, phi) {
                const x3d = (R + r * Math.cos(phi)) * Math.cos(theta);
                const y3d = (R + r * Math.cos(phi)) * Math.sin(theta);
                const z3d = r * Math.sin(phi);

                const y2 = y3d * Math.cos(tiltX) - z3d * Math.sin(tiltX);
                const z2 = y3d * Math.sin(tiltX) + z3d * Math.cos(tiltX);

                const x2 = x3d * Math.cos(tiltZ) - y2 * Math.sin(tiltZ);
                const yFinal = x3d * Math.sin(tiltZ) + y2 * Math.cos(tiltZ);

                return { x: cx + x2, y: cy + yFinal, z: z2 };
            }

            // Zeichne den Torus mit DEUTLICH höherer Sichtbarkeit
            // Zuerst: gefüllte Fläche als Hintergrund (leichter Schimmer)
            ctx.save();

            // Längskreise (um den großen Radius) – die "Ringe"
            const numLongitudes = 20;
            for (let j = 0; j < numLongitudes; j++) {
                const phi = (j / numLongitudes) * Math.PI * 2;
                ctx.beginPath();
                for (let i = 0; i <= 64; i++) {
                    const theta = (i / 64) * Math.PI * 2;
                    const p = torusTo2D(theta, phi);
                    if (i === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = 'rgba(120, 160, 255, 0.35)';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }

            // Meridiane (Kreise um den Schlauch) – DEUTLICH sichtbar
            const numMeridians = 24;
            for (let i = 0; i < numMeridians; i++) {
                const theta = (i / numMeridians) * Math.PI * 2;
                ctx.beginPath();
                for (let j = 0; j <= 32; j++) {
                    const phi = (j / 32) * Math.PI * 2;
                    const p = torusTo2D(theta, phi);
                    if (j === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            // Highlight: Ein besonders sichtbarer Meridian-Ring (der "aktuelle")
            const highlightTheta = moonTheta;
            ctx.beginPath();
            for (let j = 0; j <= 48; j++) {
                const phi = (j / 48) * Math.PI * 2;
                const p = torusTo2D(highlightTheta, phi);
                if (j === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(255, 200, 50, 0.7)';
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // Highlight: Ein besonders sichtbarer Längskreis
            const highlightPhi = moonPhi;
            ctx.beginPath();
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                const p = torusTo2D(theta, highlightPhi);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(255, 150, 50, 0.5)';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            ctx.restore();

            // Mond-Position auf dem Torus markieren
            const moonPos = torusTo2D(moonTheta, moonPhi);
            
            // Glow um den Mond
            const moonGlow = ctx.createRadialGradient(moonPos.x, moonPos.y, 0, moonPos.x, moonPos.y, 15);
            moonGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            moonGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(moonPos.x, moonPos.y, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(moonPos.x, moonPos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Torus-Label
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
            ctx.textAlign = 'center';
            ctx.fillText('Torus-Attraktor', cx, cy + R + torusr + 25);
            ctx.font = '11px system-ui';
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.fillText('● = Mond-Position', cx, cy + R + torusr + 42);
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

            // Moon
            ctx.font = '14px serif';
            ctx.fillText('🌑', moonX, moonY);

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

            // === RECHTE SEITE: Torus-Wireframe ===
            drawTorusWireframe(rightCx, rightCy, torusR, torusr, earthAngle, moonAngle);

            // Bottom text
            ctx.font = '11px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('Links: Physische Bahnen | Rechts: Abstrakte Torus-Form (Attraktor ist nicht nur ein Punkt!)', W / 2, H - 14);

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
    // STEP 3: Komplexe Becken – ruhig, klar erkennbare Strukturen
    // (unverändert, war gut)
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

        const gridSize = 4;
        const cols = Math.ceil(W / gridSize);
        const rows = Math.ceil(H / gridSize);
        let basinMap = [];

        for (let row = 0; row < rows; row++) {
            basinMap[row] = [];
            for (let col = 0; col < cols; col++) {
                const px = col * gridSize + gridSize / 2;
                const py = row * gridSize + gridSize / 2;

                let x = px, y = py;
                let closestAttr = 0;
                let minDist = Infinity;

                for (let iter = 0; iter < 20; iter++) {
                    let totalFx = 0, totalFy = 0;
                    attractors.forEach((a, idx) => {
                        const dx = a.x - x;
                        const dy = a.y - y;
                        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                        const strength = 80 / (dist * dist);
                        const angle = Math.atan2(dy, dx) + 0.8 / (dist * 0.02 + 1);
                        totalFx += Math.cos(angle) * strength * dist;
                        totalFy += Math.sin(angle) * strength * dist;
                    });

                    const norm = Math.sqrt(totalFx * totalFx + totalFy * totalFy) || 1;
                    x += (totalFx / norm) * 8;
                    y += (totalFy / norm) * 8;
                }

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

        const numParticles = 12;
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

                const angle = Math.atan2(dy, dx);
                const spiralOffset = 0.5 * Math.exp(-dist * 0.005);
                const pullStrength = 0.15 + 0.3 * (1 - dist / (W * 0.5));

                p.vx += Math.cos(angle + spiralOffset) * pullStrength;
                p.vy += Math.sin(angle + spiralOffset) * pullStrength;

                p.vx *= 0.92;
                p.vy *= 0.92;

                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 3.5) {
                    p.vx *= 3.5 / speed;
                    p.vy *= 3.5 / speed;
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
            ctx.fillText('Komplexe Becken – verschlungene Einzugsbereiche', W / 2, 22);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Die Farbe zeigt, zu welchem Attraktor ein Startpunkt gehört. Grenzen sind komplex verschlungen.', W / 2, 40);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 4: 3D-Becken – überlappende, komplexe Becken in 3D
    // Ersetzt das alte "Paris" und "Mehrdimensional"
    // ============================================================
    function render3DBasins(container) {
        // Nutze Plotly für eine echte 3D-Darstellung
        const wrapId = 'attractor-canvas-wrap';
        container.innerHTML = `<div id="${wrapId}" style="position:relative;width:100%;height:480px;overflow:hidden;border-radius:10px;background:#1a1a2e;"></div>`;

        const wrap = document.getElementById(wrapId);
        if (!wrap) return;

        const rect = wrap.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) {
            retryRender(render3DBasins, container, 150);
            return;
        }

        animationRunning = true;

        // Generiere 3D-Becken-Daten: Newton-Fraktal in 3D
        // Wir berechnen für ein 3D-Gitter, zu welchem Attraktor jeder Punkt konvergiert
        const resolution = 60;
        const attractors3D = [
            { x: 1, y: 0, z: 0, color: 'rgba(59, 130, 246, 0.6)', name: 'A' },
            { x: -0.5, y: 0.866, z: 0.5, color: 'rgba(16, 185, 129, 0.6)', name: 'B' },
            { x: -0.5, y: -0.866, z: -0.5, color: 'rgba(245, 158, 11, 0.6)', name: 'C' },
            { x: 0, y: 0, z: 1.2, color: 'rgba(239, 68, 68, 0.6)', name: 'D' },
            { x: 0.3, y: 0.5, z: -1.0, color: 'rgba(139, 92, 246, 0.6)', name: 'E' }
        ];

        // Für jede Becken-Farbe sammeln wir Punkte
        const basinPoints = attractors3D.map(() => ({ x: [], y: [], z: [] }));

        // Berechne Beckenzugehörigkeit für Punkte auf einer Kugeloberfläche (mehrere Schalen)
        const shells = [1.8, 2.2, 2.6];

        shells.forEach(radius => {
            const nPhi = resolution;
            const nTheta = Math.floor(resolution / 2);

            for (let iPhi = 0; iPhi < nPhi; iPhi++) {
                for (let iTheta = 0; iTheta < nTheta; iTheta++) {
                    const phi = (iPhi / nPhi) * Math.PI * 2;
                    const theta = (iTheta / nTheta) * Math.PI;

                    let px = radius * Math.sin(theta) * Math.cos(phi);
                    let py = radius * Math.sin(theta) * Math.sin(phi);
                    let pz = radius * Math.cos(theta);

                    // Iteriere: bewege Punkt Richtung nächsten Attraktor mit Twist
                    let x = px, y = py, z = pz;
                    for (let iter = 0; iter < 15; iter++) {
                        let totalFx = 0, totalFy = 0, totalFz = 0;
                        attractors3D.forEach(a => {
                            const dx = a.x - x;
                            const dy = a.y - y;
                            const dz = a.z - z;
                            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
                            const strength = 1.0 / (dist * dist);
                            // Twist: Rotation um z-Achse proportional zur Distanz
                            const twistAngle = 0.6 / (dist + 0.5);
                            const rotDx = dx * Math.cos(twistAngle) - dy * Math.sin(twistAngle);
                            const rotDy = dx * Math.sin(twistAngle) + dy * Math.cos(twistAngle);
                            totalFx += rotDx * strength;
                            totalFy += rotDy * strength;
                            totalFz += dz * strength;
                        });

                        const norm = Math.sqrt(totalFx * totalFx + totalFy * totalFy + totalFz * totalFz) || 1;
                        x += (totalFx / norm) * 0.3;
                        y += (totalFy / norm) * 0.3;
                        z += (totalFz / norm) * 0.3;
                    }

                    // Finde nächsten Attraktor
                    let minDist = Infinity;
                    let closestIdx = 0;
                    attractors3D.forEach((a, idx) => {
                        const dx = a.x - x;
                        const dy = a.y - y;
                        const dz = a.z - z;
                        const dist = dx * dx + dy * dy + dz * dz;
                        if (dist < minDist) {
                            minDist = dist;
                            closestIdx = idx;
                        }
                    });

                    basinPoints[closestIdx].x.push(px);
                    basinPoints[closestIdx].y.push(py);
                    basinPoints[closestIdx].z.push(pz);
                }
            }
        });

        // Erstelle Plotly-Traces
        const colors3D = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
        ];
        const traces = [];

        // Becken-Punkte
        basinPoints.forEach((bp, idx) => {
            traces.push({
                type: 'scatter3d',
                mode: 'markers',
                x: bp.x,
                y: bp.y,
                z: bp.z,
                marker: {
                    size: 2.5,
                    color: colors3D[idx],
                    opacity: 0.5
                },
                name: `Becken ${attractors3D[idx].name}`,
                hoverinfo: 'name'
            });
        });

        // Attraktor-Punkte (groß)
        traces.push({
            type: 'scatter3d',
            mode: 'markers+text',
            x: attractors3D.map(a => a.x),
            y: attractors3D.map(a => a.y),
            z: attractors3D.map(a => a.z),
            marker: {
                size: 10,
                color: colors3D,
                symbol: 'diamond',
                line: { color: '#fff', width: 2 }
            },
            text: attractors3D.map(a => `Attraktor ${a.name}`),
            textposition: 'top center',
            textfont: { size: 10, color: '#fff' },
            name: 'Attraktoren',
            hoverinfo: 'text'
        });

        const layout = {
            scene: {
                xaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', title: '', showticklabels: false, backgroundcolor: '#1a1a2e' },
                yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', title: '', showticklabels: false, backgroundcolor: '#1a1a2e' },
                zaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', title: '', showticklabels: false, backgroundcolor: '#1a1a2e' },
                bgcolor: '#1a1a2e',
                camera: {
                    eye: { x: 1.8, y: 1.8, z: 1.2 },
                    up: { x: 0, y: 0, z: 1 }
                },
                aspectmode: 'cube'
            },
            paper_bgcolor: '#1a1a2e',
            plot_bgcolor: '#1a1a2e',
            margin: { l: 0, r: 0, t: 40, b: 10 },
            title: {
                text: '3D-Einzugsbecken – 5 Attraktoren mit fraktalen Grenzen',
                font: { color: '#e2e8f0', size: 14 }
            },
            legend: {
                font: { color: '#e2e8f0', size: 10 },
                bgcolor: 'rgba(0,0,0,0.3)',
                bordercolor: 'rgba(255,255,255,0.1)',
                borderwidth: 1
            },
            showlegend: true
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        // Plotly rendern
        if (typeof Plotly !== 'undefined') {
            Plotly.newPlot(wrapId, traces, layout, config).then(() => {
                // Auto-Rotation
                let angle = 0;
                function rotate() {
                    if (!animationRunning) return;
                    angle += 0.005;
                    const eye = {
                        x: 2.2 * Math.cos(angle),
                        y: 2.2 * Math.sin(angle),
                        z: 1.0 + 0.3 * Math.sin(angle * 0.7)
                    };
                    Plotly.relayout(wrapId, { 'scene.camera.eye': eye });
                    activeAnimation = requestAnimationFrame(rotate);
                }
                rotate();
            });
        } else {
            // Fallback wenn Plotly nicht geladen
            wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#e2e8f0;">Plotly nicht geladen – 3D-Visualisierung nicht verfügbar.</div>';
        }
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
