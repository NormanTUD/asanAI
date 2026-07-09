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
        '<b>Torus-Attraktor:</b> ☀️ Sonne → 🌍 Erde kreist darum → 🌕 Mond kreist um die Erde. Die Mondbahn zeichnet einen Torus: ein Kreis um einen Kreis. <br><b>⚠️ Homotopie-Hinweis:</b> Der Torus rechts zeigt die <i>topologische Struktur</i> (Kreis ∘ Kreis), nicht die exakte räumliche Geometrie. Der Mond kreist <u>nicht</u> über die Pole! Seine Bahn liegt fast in der Ekliptikebene (~5° Neigung). Der Torus bildet nur ab, <i>dass</i> es zwei verschachtelte periodische Bewegungen sind – gleiche Struktur, andere Einbettung im Raum.',
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

        // === Torus-Labels ===
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Torus-Attraktor (Homotopie)', cx, cy + R + r + 25);

        ctx.font = '10px system-ui';
        ctx.fillStyle = 'rgba(220, 220, 220, 0.8)';
        ctx.fillText('🌕 = Mond-Position auf dem Torus', cx, cy + R + r + 40);

        // === Homotopie-Hinweis ===
        ctx.font = '9px system-ui';
        ctx.fillStyle = 'rgba(255, 150, 150, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Homotopie: gleiche Topologie (Kreis∘Kreis),', cx, cy + R + r + 55);
        ctx.fillText('nicht gleiche Geometrie! Mond kreist NICHT über die Pole.', cx, cy + R + r + 67);
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

        // Bottom text
        ctx.font = '11px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Links: Physische Bahnen (Ekliptikebene) | Rechts: Topologische Struktur (Homotopie – strukturgleich, nicht formgleich)', W / 2, H - 14);

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
// STEP 4: 3D-Einzugsbecken als Potentiallandschaft
// Darstellung wie eine topografische 3D-Oberfläche mit Tälern
// "Frankreich" und "Hauptstadt" als Becken, "Paris" im Überlappungstal
// ============================================================
function render3DBasins(container) {
    const setup = safeCanvasSetup(container, '#1a1a2e');
    if (!setup) {
        retryRender(render3DBasins, container, 150);
        return;
    }
    const { ctx, W, H } = setup;

    // === Landschafts-Parameter ===
    // Becken (Täler) definiert durch Position und Tiefe
    const basins = [
        { x: -1.2, y: -0.3, depth: 1.0, radius: 1.3, label: '„Frankreich"', color: '#3b82f6' },
        { x: 1.2, y: -0.3, depth: 1.0, radius: 1.3, label: '„Hauptstadt"', color: '#ef4444' },
        { x: 0.0, y: -0.3, depth: 1.4, radius: 0.7, label: '★ „Paris"', color: '#ffd700' },
        { x: 0.0, y: 1.4, depth: 0.8, radius: 1.0, label: '„Kultur"', color: '#10b981' }
    ];

    // Berechne Höhe an einem Punkt (Potentiallandschaft)
    // Niedrig = Attraktor (Tal), Hoch = Grenze (Hügel)
    function getHeight(px, py) {
        let h = 0.0; // Basishöhe

        // Jedes Becken erzeugt ein Tal (negative Gauss-Glocke)
        for (let b of basins) {
            const dx = px - b.x;
            const dy = py - b.y;
            const dist2 = dx * dx + dy * dy;
            const sigma2 = b.radius * b.radius * 0.5;
            h -= b.depth * Math.exp(-dist2 / sigma2);
        }

        // Leichte Wellung für natürlicheres Aussehen
        h += 0.08 * Math.sin(px * 2.5) * Math.cos(py * 2.5);
        h += 0.05 * Math.sin(px * 4 + 1) * Math.sin(py * 3 + 2);

        return h;
    }

    // === 3D-Gitter berechnen ===
    const gridRes = 60;
    const terrainRange = 3.0;
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

    // === Farbpalette: Höhe → Farbe (wie topografische Karte) ===
    function heightToColor(h, normalizedH) {
        // normalizedH: 0 = tiefstes Tal, 1 = höchster Punkt
        // Farbverlauf: dunkelbraun/orange (tief) → gelb → grün → blaugrün (hoch)
        const stops = [
            { t: 0.0, r: 120, g: 60, b: 20 },    // Dunkelbraun (tiefste Täler)
            { t: 0.15, r: 180, g: 100, b: 30 },   // Braun
            { t: 0.3, r: 220, g: 160, b: 50 },    // Orange/Gold
            { t: 0.45, r: 240, g: 210, b: 80 },   // Gelb
            { t: 0.6, r: 180, g: 210, b: 100 },   // Gelbgrün
            { t: 0.75, r: 100, g: 180, b: 100 },  // Grün
            { t: 0.9, r: 60, g: 150, b: 120 },    // Blaugrün
            { t: 1.0, r: 40, g: 120, b: 110 }     // Dunkel Blaugrün
        ];

        let lower = stops[0], upper = stops[stops.length - 1];
        for (let i = 0; i < stops.length - 1; i++) {
            if (normalizedH >= stops[i].t && normalizedH <= stops[i + 1].t) {
                lower = stops[i];
                upper = stops[i + 1];
                break;
            }
        }

        const range = upper.t - lower.t || 1;
        const f = (normalizedH - lower.t) / range;
        const r = Math.round(lower.r + (upper.r - lower.r) * f);
        const g = Math.round(lower.g + (upper.g - lower.g) * f);
        const b = Math.round(lower.b + (upper.b - lower.b) * f);
        return { r, g, b };
    }

    // === Isometrische 3D-Projektion ===
    const heightScale = Math.min(W, H) * 0.12;
    const tileScaleX = Math.min(W, H) * 0.065;
    const tileScaleY = tileScaleX * 0.5;
    let rotAngle = 0.6; // Betrachtungswinkel
    let targetRotAngle = 0.6;
    let tiltAngle = 0.55;

    function projectTerrain(px, py, h) {
        // Rotation um Y-Achse
        const rx = px * Math.cos(rotAngle) - py * Math.sin(rotAngle);
        const ry = px * Math.sin(rotAngle) + py * Math.cos(rotAngle);

        // Isometrische Projektion
        const screenX = W / 2 + rx * tileScaleX;
        const screenY = H / 2 + ry * tileScaleY - h * heightScale;

        return { sx: screenX, sy: screenY, depth: ry };
    }

    // === Bewegte Kugeln die in die Täler rollen ===
    const numBalls = 20;
    let balls = [];

    function spawnBall() {
        const px = (Math.random() * 2 - 1) * terrainRange * 0.8;
        const py = (Math.random() * 2 - 1) * terrainRange * 0.8;
        return {
            x: px, y: py,
            vx: 0, vy: 0,
            trail: [{ x: px, y: py }],
            arrived: false,
            alpha: 1.0,
            age: 0
        };
    }

    for (let i = 0; i < numBalls; i++) {
        const b = spawnBall();
        b.age = Math.floor(Math.random() * 100);
        balls.push(b);
    }

    // === Interaktion: Rotation ===
    let isDragging = false;
    let lastMouseX = 0;
    const canvas = setup.canvas;

    canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMouseX = e.clientX; });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        targetRotAngle += (e.clientX - lastMouseX) * 0.005;
        lastMouseX = e.clientX;
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });
    canvas.addEventListener('touchstart', (e) => { isDragging = true; lastMouseX = e.touches[0].clientX; });
    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging) return; e.preventDefault();
        targetRotAngle += (e.touches[0].clientX - lastMouseX) * 0.005;
        lastMouseX = e.touches[0].clientX;
    });
    canvas.addEventListener('touchend', () => { isDragging = false; });

    // === Animation ===
    animationRunning = true;
    let t = 0;

    function draw() {
        if (!animationRunning) return;
        t++;

        // Auto-Rotation
        if (!isDragging) targetRotAngle += 0.001;
        rotAngle += (targetRotAngle - rotAngle) * 0.05;

        ctx.clearRect(0, 0, W, H);

        // Hintergrund
        ctx.fillStyle = '#f8f6f0';
        ctx.fillRect(0, 0, W, H);

        // === Terrain zeichnen (von hinten nach vorne) ===
        // Sammle alle Quads mit Tiefe
        let quads = [];
        for (let iy = 0; iy < gridRes; iy++) {
            for (let ix = 0; ix < gridRes; ix++) {
                const p00 = heightMap[iy][ix];
                const p10 = heightMap[iy][ix + 1];
                const p01 = heightMap[iy + 1][ix];
                const p11 = heightMap[iy + 1][ix + 1];

                const avgH = (p00.h + p10.h + p01.h + p11.h) / 4;
                const avgX = (p00.x + p10.x + p01.x + p11.x) / 4;
                const avgY = (p00.y + p10.y + p01.y + p11.y) / 4;

                const proj = projectTerrain(avgX, avgY, avgH);

                quads.push({
                    corners: [p00, p10, p11, p01],
                    avgH,
                    depth: proj.depth,
                    ix, iy
                });
            }
        }

        // Sortiere nach Tiefe (hintere zuerst)
        quads.sort((a, b) => a.depth - b.depth);

        // Zeichne Quads
        const hRange = maxH - minH || 1;
        for (let q of quads) {
            const corners = q.corners;
            const projCorners = corners.map(c => projectTerrain(c.x, c.y, c.h));

            // Normalisierte Höhe für Farbe
            const normalizedH = (q.avgH - minH) / hRange;
            const col = heightToColor(q.avgH, normalizedH);

            // Einfache Beleuchtung basierend auf Neigung
            const dx = (corners[1].h - corners[0].h);
            const dy = (corners[3].h - corners[0].h);
            const lightFactor = Math.max(0.6, Math.min(1.3, 1.0 + dx * 2 - dy * 1.5));

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

            // Subtile Gitterlinien
            ctx.strokeStyle = `rgba(0, 0, 0, 0.04)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // === Höhenlinien (Konturen) ===
        const numContours = 8;
        for (let c = 0; c < numContours; c++) {
            const contourH = minH + (c / numContours) * hRange;
            ctx.strokeStyle = `rgba(0, 0, 0, 0.12)`;
            ctx.lineWidth = 0.8;

            for (let iy = 0; iy < gridRes; iy++) {
                for (let ix = 0; ix < gridRes; ix++) {
                    const p0 = heightMap[iy][ix];
                    const p1 = heightMap[iy][ix + 1];

                    // Horizontale Kante: prüfe ob Konturlinie kreuzt
                    if ((p0.h - contourH) * (p1.h - contourH) < 0) {
                        const frac = (contourH - p0.h) / (p1.h - p0.h);
                        const cx1 = p0.x + frac * (p1.x - p0.x);
                        const cy1 = p0.y;

                        // Finde zweiten Kreuzungspunkt in benachbarter Kante
                        const p2 = heightMap[iy + 1] ? heightMap[iy + 1][ix] : null;
                        if (p2 && (p0.h - contourH) * (p2.h - contourH) < 0) {
                            const frac2 = (contourH - p0.h) / (p2.h - p0.h);
                            const cx2 = p0.x;
                            const cy2 = p0.y + frac2 * (p2.y - p0.y);
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

        // === Kugeln die in Täler rollen ===
        balls.forEach((ball, idx) => {
            if (ball.arrived) {
                ball.alpha -= 0.01;
                if (ball.alpha <= 0) { balls[idx] = spawnBall(); }
                return;
            }

            ball.age++;

            // Gradient der Höhenfunktion → Kraft bergab
            const eps = 0.05;
            const hHere = getHeight(ball.x, ball.y);
            const hDx = getHeight(ball.x + eps, ball.y);
            const hDy = getHeight(ball.x, ball.y + eps);
            const gradX = -(hDx - hHere) / eps;
            const gradY = -(hDy - hHere) / eps;

            // Beschleunigung bergab + Dämpfung
            ball.vx += gradX * 0.003;
            ball.vy += gradY * 0.003;
            ball.vx *= 0.96;
            ball.vy *= 0.96;

            ball.x += ball.vx;
            ball.y += ball.vy;

            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 40) ball.trail.shift();

            // Konvergenz-Check
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed < 0.001 && ball.age > 50) {
                ball.arrived = true;
                ball.alpha = 1.0;
            }

            // Clamp
            ball.x = Math.max(-terrainRange, Math.min(terrainRange, ball.x));
            ball.y = Math.max(-terrainRange, Math.min(terrainRange, ball.y));

            // Trail zeichnen
            if (ball.trail.length > 1) {
                for (let i = 1; i < ball.trail.length; i++) {
                    const h1 = getHeight(ball.trail[i-1].x, ball.trail[i-1].y);
                    const h2 = getHeight(ball.trail[i].x, ball.trail[i].y);
                    const p1 = projectTerrain(ball.trail[i-1].x, ball.trail[i-1].y, h1 - 0.02);
                    const p2 = projectTerrain(ball.trail[i].x, ball.trail[i].y, h2 - 0.02);
                    const trailAlpha = (i / ball.trail.length) * 0.6 * ball.alpha;
                    ctx.beginPath();
                    ctx.moveTo(p1.sx, p1.sy);
                    ctx.lineTo(p2.sx, p2.sy);
                    ctx.strokeStyle = `rgba(30, 30, 30, ${trailAlpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            // Kugel zeichnen
            const ballH = getHeight(ball.x, ball.y);
            const ballProj = projectTerrain(ball.x, ball.y, ballH - 0.05);
            const ballSize = 5;

            // Schatten
            ctx.beginPath();
            ctx.ellipse(ballProj.sx + 2, ballProj.sy + 3, ballSize, ballSize * 0.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * ball.alpha})`;
            ctx.fill();

            // Kugel
            ctx.beginPath();
            ctx.arc(ballProj.sx, ballProj.sy, ballSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(40, 40, 60, ${ball.alpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * ball.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // === Becken-Labels mit Pfeilen ===
        basins.forEach((basin, idx) => {
            const bH = getHeight(basin.x, basin.y);
            const bProj = projectTerrain(basin.x, basin.y, bH);

            // Pfeil von oben zum Tal
            const arrowStartY = bProj.sy - 50;
            const arrowEndY = bProj.sy - 15;

            ctx.beginPath();
            ctx.moveTo(bProj.sx, arrowStartY);
            ctx.lineTo(bProj.sx, arrowEndY);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pfeilspitze
            ctx.beginPath();
            ctx.moveTo(bProj.sx, arrowEndY);
            ctx.lineTo(bProj.sx - 5, arrowEndY - 8);
            ctx.lineTo(bProj.sx + 5, arrowEndY - 8);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fill();

            // Label
            ctx.font = 'bold 12px system-ui';
            const labelText = basin.label;
            const textWidth = ctx.measureText(labelText).width;

            // Hintergrund
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(bProj.sx - textWidth / 2 - 8, arrowStartY - 22, textWidth + 16, 20, 4);
            ctx.fill();
            ctx.strokeStyle = basin.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.fillStyle = basin.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, bProj.sx, arrowStartY - 12);
            ctx.textBaseline = 'alphabetic';

            // Stabilitäts-Label
            const stabilityLabel = idx === 2 ? '(Überlappung)' : 'Stabil';
            ctx.font = '9px system-ui';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText(stabilityLabel, bProj.sx, arrowStartY - 32);
        });

        // === Instabiler Punkt (Sattel zwischen Frankreich und Hauptstadt) ===
        // Der Hügel zwischen den Becken
        const saddleX = 0.0;
        const saddleY = -0.3;
        const saddleH = getHeight(saddleX, saddleY);
        // Finde den höchsten Punkt auf der Linie zwischen FR und HS
        let maxSaddleH = -Infinity;
        let saddlePx = 0, saddlePy = -0.3;
        for (let f = 0.2; f < 0.8; f += 0.05) {
            const sx = basins[0].x + (basins[1].x - basins[0].x) * f;
            const sy = basins[0].y;
            const sh = getHeight(sx, sy);
            // Suche den Sattel (lokales Maximum auf der Verbindungslinie)
            // Da Paris dazwischen liegt, ist der Sattel eher seitlich
        }

        // === Titel ===
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('3D-Einzugsbecken – Potentiallandschaft', W / 2, 22);

        ctx.font = '11px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Kugeln rollen bergab in die Täler (Attraktoren). „Paris" liegt im tiefsten Tal der Überlappung.', W / 2, 40);

        // === Legende ===
        const legX = 12, legY = H - 60;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Tief (Attraktor) → Hoch (Grenze)', legX, legY);

        // Farbbalken
        const barW = 120, barH = 10;
        const barGrad = ctx.createLinearGradient(legX, 0, legX + barW, 0);
        barGrad.addColorStop(0, 'rgb(120, 60, 20)');
        barGrad.addColorStop(0.3, 'rgb(220, 160, 50)');
        barGrad.addColorStop(0.6, 'rgb(180, 210, 100)');
        barGrad.addColorStop(1, 'rgb(40, 120, 110)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(legX, legY + 5, barW, barH);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(legX, legY + 5, barW, barH);

        // === Hinweis ===
        ctx.font = '9px system-ui';
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('🖱 Ziehen zum Rotieren · Kugeln rollen in das nächste Tal', W / 2, H - 8);

        activeAnimation = requestAnimationFrame(draw);
    }
    draw();
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
