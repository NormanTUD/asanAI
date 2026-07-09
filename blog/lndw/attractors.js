// ============================================================
// ATTRACTOR BASIN VISUALIZATION v3
// Komplett überarbeitet: echte 3D, dynamische Animationen, 
// lebendige Becken, interaktive Schritte
// ============================================================
const AttractorViz = (() => {
    let currentStep = 0;
    let subStep = 0; // für Part 1: 0 = nur Punkt, 1 = Becken sichtbar
    const totalSteps = 6;
    let activeAnimation = null;
    let animationRunning = false;

    function isOnAttractorSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Attraktoren';
    }

    function canGoNext() {
        if (!isOnAttractorSlide()) return false;
        // Part 1 hat einen Sub-Step
        if (currentStep === 0 && subStep === 0) return true;
        return currentStep < totalSteps - 1;
    }

    function canGoPrev() {
        if (!isOnAttractorSlide()) return false;
        if (currentStep === 0 && subStep === 1) return true;
        return currentStep > 0;
    }

    function next() {
        if (!canGoNext()) return;
        if (currentStep === 0 && subStep === 0) {
            subStep = 1;
            renderStep(currentStep);
            return;
        }
        currentStep++;
        subStep = 0;
        renderStep(currentStep);
    }

    function prev() {
        if (!canGoPrev()) return;
        if (currentStep === 0 && subStep === 1) {
            subStep = 0;
            renderStep(currentStep);
            return;
        }
        currentStep--;
        subStep = 0;
        renderStep(currentStep);
    }

    function reset() {
        currentStep = 0;
        subStep = 0;
        stopAllAnimations();
    }

    function stopAllAnimations() {
        animationRunning = false;
        if (activeAnimation) {
            cancelAnimationFrame(activeAnimation);
            activeAnimation = null;
        }
    }

    function renderStep(step) {
        stopAllAnimations();
        const container = document.getElementById('attractor-viz-container');
        if (!container) return;

        document.querySelectorAll('.attr-indicator').forEach(el => {
            const s = parseInt(el.getAttribute('data-step'));
            el.classList.toggle('active', s === step);
        });

        const captions = [
            subStep === 0
                ? '<b>Punkt-Attraktor (3D):</b> Ein stabiler Fixpunkt – alle Bahnen spiralen aus allen Richtungen des Raums hinein. <i>→ Drücke Pfeil-rechts für das Attraktorbecken.</i>'
                : '<b>Attraktorbecken:</b> Der Trichter zeigt den Einzugsbereich – egal wo ein Punkt startet, er wird unweigerlich hineingezogen.',
            '<b>Torus-Attraktor:</b> ☀️ Sonne im Zentrum, 🌍 Erde kreist darum, 🌔 Mond kreist um die Erde – eine Bahn auf einem Torus (Kreis um einen Kreis).',
            '<b>Lorenz-Attraktor:</b> Der Attraktor selbst bewegt sich leicht – die Punkte folgen ihm auf chaotischen, aber deterministischen Bahnen.',
            '<b>Attraktorbecken (3D):</b> Drei dynamische Becken. Punkte spiralen auf komplexen Bahnen – beobachte wie sie sich wirklich bewegen und ankommen.',
            '<b>Mehrdimensionale Becken:</b> Keine einfachen Kugeln – die Becken sind verzerrte, pulsierende Felder. Punkte bewegen sich auf verschlungenen Pfaden.',
            '<b>"Paris" als Attraktor (3D):</b> Zwei Becken ("Hauptstadt" + "Frankreich") überlappen sich im 3D-Raum und bilden im Schnittbereich einen neuen, stärkeren Attraktor: "Paris".'
        ];
        const captionEl = document.getElementById('attractor-caption');
        if (captionEl) captionEl.innerHTML = captions[step];

        switch (step) {
            case 0: renderPointAttractor3D(container); break;
            case 1: renderTorusOrbits(container); break;
            case 2: renderLorenzAnimated(container); break;
            case 3: renderBasins3D(container); break;
            case 4: renderMultiDimBasins3D(container); break;
            case 5: renderParisInteractive3D(container); break;
        }
    }

    // ============================================================
    // STEP 0: 3D Punkt-Attraktor – drehendes Modell, Becken auf Tastendruck
    // ============================================================
    function renderPointAttractor3D(container) {
        container.innerHTML = '<div id="attractor-plotly" style="width:100%;height:480px;border-radius:10px;"></div>';
        const div = document.getElementById('attractor-plotly');

        const traces = [];
        const numPaths = 40;
        const showBasin = subStep >= 1;

        // Attractor point at origin
        traces.push({
            type: 'scatter3d',
            mode: 'markers+text',
            x: [0], y: [0], z: [0],
            text: ['Fixpunkt'],
            textposition: 'top center',
            textfont: { size: 13, color: '#1e40af', family: 'system-ui' },
            marker: { size: 10, color: '#1e40af', symbol: 'diamond' },
            hoverinfo: 'text',
            showlegend: false
        });

        // Generate spiral paths from all directions toward origin
        for (let i = 0; i < numPaths; i++) {
            // Random start point on a sphere
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const startR = 4 + Math.random() * 2;
            const sx = startR * Math.sin(phi) * Math.cos(theta);
            const sy = startR * Math.sin(phi) * Math.sin(theta);
            const sz = startR * Math.cos(phi);

            const pathX = [], pathY = [], pathZ = [];
            let x = sx, y = sy, z = sz;
            const spinAxis = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
            const norm = Math.sqrt(spinAxis[0]**2 + spinAxis[1]**2 + spinAxis[2]**2);
            spinAxis[0] /= norm; spinAxis[1] /= norm; spinAxis[2] /= norm;

            for (let t = 0; t < 80; t++) {
                pathX.push(x);
                pathY.push(y);
                pathZ.push(z);
                // Pull toward center
                x *= 0.96;
                y *= 0.96;
                z *= 0.96;
                // Add spiral component (cross product with axis)
                const cx = spinAxis[1] * z - spinAxis[2] * y;
                const cy = spinAxis[2] * x - spinAxis[0] * z;
                const cz = spinAxis[0] * y - spinAxis[1] * x;
                const spiralStrength = 0.08;
                x += cx * spiralStrength;
                y += cy * spiralStrength;
                z += cz * spiralStrength;
            }

            traces.push({
                type: 'scatter3d',
                mode: 'lines',
                x: pathX, y: pathY, z: pathZ,
                line: { color: `hsla(${(i / numPaths) * 360}, 70%, 55%, 0.6)`, width: 2.5 },
                hoverinfo: 'skip',
                showlegend: false
            });

            // Arrow head (start point)
            traces.push({
                type: 'scatter3d',
                mode: 'markers',
                x: [pathX[0]], y: [pathY[0]], z: [pathZ[0]],
                marker: { size: 3.5, color: `hsl(${(i / numPaths) * 360}, 70%, 55%)` },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        // Basin funnel (only if subStep >= 1)
        if (showBasin) {
            // Create funnel/cone shape as basin
            const funnelU = [], funnelV = [], funnelW = [];
            for (let ring = 0; ring <= 30; ring++) {
                const uRow = [], vRow = [], wRow = [];
                const t = ring / 30;
                const R = 5.5 * t; // radius grows outward
                const Z = -3 * (1 - t * t); // depth (paraboloid)
                for (let j = 0; j <= 30; j++) {
                    const angle = (j / 30) * 2 * Math.PI;
                    uRow.push(R * Math.cos(angle));
                    vRow.push(R * Math.sin(angle));
                    wRow.push(Z);
                }
                funnelU.push(uRow);
                funnelV.push(vRow);
                funnelW.push(wRow);
            }
            traces.push({
                type: 'surface',
                x: funnelU, y: funnelV, z: funnelW,
                opacity: 0.12,
                colorscale: [[0, '#3b82f6'], [0.5, '#8b5cf6'], [1, '#3b82f6']],
                showscale: false,
                hoverinfo: 'skip'
            });

            // Rim of basin
            const rimX = [], rimY = [], rimZ = [];
            for (let j = 0; j <= 60; j++) {
                const angle = (j / 60) * 2 * Math.PI;
                rimX.push(5.5 * Math.cos(angle));
                rimY.push(5.5 * Math.sin(angle));
                rimZ.push(0);
            }
            traces.push({
                type: 'scatter3d',
                mode: 'lines',
                x: rimX, y: rimY, z: rimZ,
                line: { color: '#6366f1', width: 4, dash: 'dash' },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 10 },
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '', range: [-7, 7] },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '', range: [-7, 7] },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '', range: [-5, 7] },
                camera: { eye: { x: 1.8, y: 1.2, z: 1.0 } },
                bgcolor: '#fafafa',
                aspectmode: 'cube'
            },
            paper_bgcolor: '#fafafa',
            showlegend: false
        };

        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });

        // Slow rotation
        animationRunning = true;
        let camAngle = 0;
        function rotateCamera() {
            if (!animationRunning) return;
            camAngle += 0.003;
            Plotly.relayout(div, {
                'scene.camera.eye': {
                    x: 2.0 * Math.cos(camAngle),
                    y: 2.0 * Math.sin(camAngle),
                    z: 0.9 + 0.3 * Math.sin(camAngle * 0.5)
                }
            });
            activeAnimation = requestAnimationFrame(rotateCamera);
        }
        rotateCamera();
    }

    // ============================================================
    // STEP 1: Torus – Clean, smooth, Emojis
    // ============================================================
    function renderTorusOrbits(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;background:#0a0a2a;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const cx = W / 2, cy = H / 2;

        const earthOrbitR = Math.min(W, H) * 0.28;
        const moonOrbitR = earthOrbitR * 0.25;
        const earthSpeed = 0.006;
        const moonSpeed = 0.042;

        let earthAngle = 0;
        let moonAngle = 0;
        let moonTrail = [];
        const maxTrail = 600;

        animationRunning = true;

        function draw() {
            if (!animationRunning) return;

            ctx.clearRect(0, 0, W, H);

            // Subtle starfield
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i = 0; i < 50; i++) {
                const sx = ((i * 173.7 + 31) % W);
                const sy = ((i * 89.3 + 47) % H);
                ctx.beginPath();
                ctx.arc(sx, sy, 0.5 + (i % 3) * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Earth orbit path (subtle)
            ctx.beginPath();
            ctx.ellipse(cx, cy, earthOrbitR, earthOrbitR * 0.4, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100,180,255,0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Earth position
            earthAngle += earthSpeed;
            const earthX = cx + Math.cos(earthAngle) * earthOrbitR;
            const earthY = cy + Math.sin(earthAngle) * earthOrbitR * 0.4;

            // Moon position
            moonAngle += moonSpeed;
            const moonX = earthX + Math.cos(moonAngle) * moonOrbitR;
            const moonY = earthY + Math.sin(moonAngle) * moonOrbitR * 0.55;

            // Moon trail (the torus surface trace)
            moonTrail.push({ x: moonX, y: moonY });
            if (moonTrail.length > maxTrail) moonTrail.shift();

            // Draw moon trail with gradient
            if (moonTrail.length > 2) {
                for (let i = 1; i < moonTrail.length; i++) {
                    const alpha = (i / moonTrail.length) * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(moonTrail[i - 1].x, moonTrail[i - 1].y);
                    ctx.lineTo(moonTrail[i].x, moonTrail[i].y);
                    ctx.strokeStyle = `rgba(200,200,255,${alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            // Sun (glow + emoji)
            const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
            sunGlow.addColorStop(0, 'rgba(255,220,0,0.4)');
            sunGlow.addColorStop(1, 'rgba(255,150,0,0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☀️', cx, cy);

            // Earth
            ctx.font = '26px serif';
            ctx.fillText('🌍', earthX, earthY);

            // Moon
            ctx.font = '16px serif';
            ctx.fillText('🌔', moonX, moonY);

            // Clean labels
            ctx.font = '13px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('Sonne', cx, cy + 32);
            ctx.fillStyle = 'rgba(100,180,255,0.8)';
            ctx.fillText('Erde', earthX, earthY + 24);
            ctx.fillStyle = 'rgba(200,200,200,0.7)';
            ctx.fillText('Mond', moonX, moonY + 16);

            // Bottom explanation
            ctx.font = '12px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.textAlign = 'center';
            ctx.fillText('Die Spur des Mondes bildet einen Torus – ein Kreis um einen Kreis', cx, H - 20);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 2: Lorenz-Attraktor – bewegt sich hin und her
    // ============================================================
    function renderLorenzAnimated(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        const sigma = 10, rho = 28, beta = 8 / 3;
        const dt = 0.005;

        // Pre-compute background path
        let bgPath = [];
        {
            let x = 1, y = 1, z = 1;
            for (let i = 0; i < 10000; i++) {
                const dx = sigma * (y - x);
                const dy = x * (rho - z) - y;
                const dz = x * y - beta * z;
                x += dx * dt; y += dy * dt; z += dz * dt;
                bgPath.push({ x, y, z });
            }
        }

        // Animated particles
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
            return {
                px: offsetX + x * scale,
                py: offsetY - z * scale * 0.5
            };
        }

        function draw() {
            if (!animationRunning) return;
            frame++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // The attractor itself moves gently
            const wobbleX = Math.sin(frame * 0.008) * 20;
            const wobbleY = Math.cos(frame * 0.006) * 10;
            const offsetX = W / 2 + wobbleX;
            const offsetY = H * 0.72 + wobbleY;

            // Draw background path (faint)
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

            // Advance and draw particles
            particles.forEach(part => {
                for (let s = 0; s < 5; s++) {
                    const dx = sigma * (part.y - part.x);
                    const dy = part.x * (rho - part.z) - part.y;
                    const dz = part.x * part.y - beta * part.z;
                    part.x += dx * dt;
                    part.y += dy * dt;
                    part.z += dz * dt;
                }

                const pp = project(part.x, part.y, part.z, offsetX, offsetY);
                part.trail.push({ px: pp.px, py: pp.py });
                if (part.trail.length > 250) part.trail.shift();

                // Draw trail with fading
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

                // Particle head with glow
                ctx.beginPath();
                ctx.arc(pp.px, pp.py, 5, 0, Math.PI * 2);
                ctx.fillStyle = part.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Title
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
    // STEP 3: Becken – komplett neu, animierte Punkte
    // ============================================================
    function renderBasins3D(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        const attractors = [
            { x: W * 0.2, y: H * 0.4, label: 'Berlin', color: '#3b82f6', hue: 220 },
            { x: W * 0.5, y: H * 0.65, label: 'Paris', color: '#10b981', hue: 160 },
            { x: W * 0.8, y: H * 0.35, label: 'Madrid', color: '#f59e0b', hue: 40 }
        ];

        // Particles for each attractor
        const particlesPerAttractor = 20;
        let allParticles = [];

        function spawnParticle(attr) {
            const angle = Math.random() * Math.PI * 2;
            const r = 100 + Math.random() * 120;
            return {
                x: attr.x + Math.cos(angle) * r,
                y: attr.y + Math.sin(angle) * r,
                vx: 0,
                vy: 0,
                targetX: attr.x,
                targetY: attr.y,
                trail: [],
                phase: Math.random() * Math.PI * 2,
                spinDir: Math.random() > 0.5 ? 1 : -1,
                color: attr.color,
                hue: attr.hue,
                alpha: 1,
                arrived: false
            };
        }

        attractors.forEach(attr => {
            for (let i = 0; i < particlesPerAttractor; i++) {
                allParticles.push(spawnParticle(attr));
            }
        });

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw basins as gradient fields (not just circles)
            attractors.forEach(attr => {
                // Multiple concentric, slightly irregular rings
                for (let ring = 6; ring >= 0; ring--) {
                    const baseR = 30 + ring * 25;
                    ctx.beginPath();
                    for (let a = 0; a <= 64; a++) {
                        const angle = (a / 64) * Math.PI * 2;
                        const wobble = 1 + 0.1 * Math.sin(angle * 3 + t * 0.01 + ring);
                        const r = baseR * wobble;
                        const px = attr.x + Math.cos(angle) * r;
                        const py = attr.y + Math.sin(angle) * r;
                        if (a === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = `hsla(${attr.hue}, 60%, 55%, ${0.06 + ring * 0.02})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Center gradient
                const grad = ctx.createRadialGradient(attr.x, attr.y, 0, attr.x, attr.y, 160);
                grad.addColorStop(0, `hsla(${attr.hue}, 60%, 55%, 0.15)`);
                grad.addColorStop(0.5, `hsla(${attr.hue}, 60%, 55%, 0.05)`);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(attr.x, attr.y, 160, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw attractor points
            attractors.forEach(attr => {
                const pulse = 1 + 0.08 * Math.sin(t * 0.05);
                ctx.beginPath();
                ctx.arc(attr.x, attr.y, 10 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = attr.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.font = 'bold 13px system-ui';
                ctx.fillStyle = attr.color;
                ctx.textAlign = 'center';
                ctx.fillText(attr.label, attr.x, attr.y + 26);
            });

            // Animate particles
            allParticles.forEach((p, idx) => {
                if (p.arrived) {
                    p.alpha -= 0.015;
                    if (p.alpha <= 0) {
                        // Find which attractor this belongs to
                        const attr = attractors.find(a => a.color === p.color);
                        allParticles[idx] = spawnParticle(attr);
                    }
                    return;
                }

                // Spiral toward target
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Spiral force toward target
                const angle = Math.atan2(dy, dx) + 0.5 * Math.sin(p.phase + t * 0.02) * p.spinDir;
                const pullStrength = 0.0005 * (1 + 150 / (dist + 30));

                p.vx += Math.cos(angle) * dist * pullStrength;
                p.vy += Math.sin(angle) * dist * pullStrength;

                // Damping
                p.vx *= 0.95;
                p.vy *= 0.95;

                p.x += p.vx;
                p.y += p.vy;

                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 60) p.trail.shift();

                if (dist < 12) {
                    p.arrived = true;
                    p.alpha = 1;
                }

                // Draw trail
                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = `hsla(${p.hue}, 60%, 55%, ${0.3 * p.alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Draw particle
                const size = 3 + (1 - dist / 200) * 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(2, size), 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 60%, 55%, ${0.8 * p.alpha})`;
                ctx.fill();
            });

            // Title
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Drei Attraktorbecken – Punkte spiralen auf dynamischen Bahnen', W / 2, 22);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 4: Mehrdimensionale Becken – verzerrte Felder, bewegte Punkte
    // ============================================================
    function renderMultiDimBasins3D(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        const attractors = [
            { x: W * 0.2, y: H * 0.35, label: 'Attraktor A', color: '#3b82f6', hue: 220 },
            { x: W * 0.55, y: H * 0.7, label: 'Attraktor B', color: '#10b981', hue: 160 },
            { x: W * 0.82, y: H * 0.3, label: 'Attraktor C', color: '#f59e0b', hue: 40 }
        ];

        // Particles
        const particlesPerAttractor = 18;
        let allParticles = [];

        function spawnParticle(attr) {
            const angle = Math.random() * Math.PI * 2;
            const r = 80 + Math.random() * 140;
            return {
                x: attr.x + Math.cos(angle) * r,
                y: attr.y + Math.sin(angle) * r,
                vx: 0,
                vy: 0,
                targetX: attr.x,
                targetY: attr.y,
                trail: [],
                phase: Math.random() * Math.PI * 2,
                spinDir: Math.random() > 0.5 ? 1 : -1,
                color: attr.color,
                hue: attr.hue,
                alpha: 1,
                arrived: false,
                wobbleFreq: 0.01 + Math.random() * 0.02
            };
        }

        attractors.forEach(attr => {
            for (let i = 0; i < particlesPerAttractor; i++) {
                allParticles.push(spawnParticle(attr));
            }
        });

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw basins as warped, pulsating fields (not simple spheres!)
            attractors.forEach(attr => {
                // Multiple warped contour lines
                for (let ring = 5; ring >= 0; ring--) {
                    const baseR = 25 + ring * 28;
                    ctx.beginPath();
                    for (let a = 0; a <= 80; a++) {
                        const angle = (a / 80) * Math.PI * 2;
                        // Warping: different frequencies per ring for organic look
                        const warp1 = 1 + 0.15 * Math.sin(angle * 2 + t * 0.008 + ring * 1.3);
                        const warp2 = 1 + 0.1 * Math.cos(angle * 3 - t * 0.012 + ring * 0.7);
                        const warp3 = 1 + 0.05 * Math.sin(angle * 5 + t * 0.005);
                        const r = baseR * warp1 * warp2 * warp3;
                        const px = attr.x + Math.cos(angle) * r;
                        const py = attr.y + Math.sin(angle) * r;
                        if (a === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = `hsla(${attr.hue}, 50%, 55%, ${0.04 + ring * 0.025})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Fill innermost rings lightly
                    if (ring <= 2) {
                        ctx.fillStyle = `hsla(${attr.hue}, 50%, 55%, ${0.02 + (2 - ring) * 0.015})`;
                        ctx.fill();
                    }
                }

                // Pulsating gradient field
                const pulseR = 140 + 10 * Math.sin(t * 0.02 + attr.hue);
                const grad = ctx.createRadialGradient(attr.x, attr.y, 0, attr.x, attr.y, pulseR);
                grad.addColorStop(0, `hsla(${attr.hue}, 60%, 55%, 0.12)`);
                grad.addColorStop(0.6, `hsla(${attr.hue}, 60%, 55%, 0.04)`);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(attr.x, attr.y, pulseR, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw attractor centers
            attractors.forEach(attr => {
                const pulse = 1 + 0.1 * Math.sin(t * 0.04 + attr.hue);
                ctx.beginPath();
                ctx.arc(attr.x, attr.y, 9 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = attr.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.font = 'bold 12px system-ui';
                ctx.fillStyle = attr.color;
                ctx.textAlign = 'center';
                ctx.fillText(attr.label, attr.x, attr.y + 24);
            });

            // Animate particles
            allParticles.forEach((p, idx) => {
                if (p.arrived) {
                    p.alpha -= 0.012;
                    if (p.alpha <= 0) {
                        const attr = attractors.find(a => a.color === p.color);
                        allParticles[idx] = spawnParticle(attr);
                    }
                    return;
                }

                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Complex spiral with wobble
                const baseAngle = Math.atan2(dy, dx);
                const spiralOffset = 0.6 * Math.sin(p.phase + t * p.wobbleFreq) * p.spinDir;
                const angle = baseAngle + spiralOffset;
                const pullStrength = 0.0004 * (1 + 120 / (dist + 20));

                p.vx += Math.cos(angle) * dist * pullStrength;
                p.vy += Math.sin(angle) * dist * pullStrength;

                // Add some turbulence
                p.vx += (Math.random() - 0.5) * 0.1;
                p.vy += (Math.random() - 0.5) * 0.1;

                p.vx *= 0.94;
                p.vy *= 0.94;

                p.x += p.vx;
                p.y += p.vy;

                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 70) p.trail.shift();

                if (dist < 10) {
                    p.arrived = true;
                    p.alpha = 1;
                }

                // Draw trail with gradient
                if (p.trail.length > 1) {
                    for (let i = 1; i < p.trail.length; i++) {
                        const alpha = (i / p.trail.length) * 0.4 * p.alpha;
                        ctx.beginPath();
                        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                        ctx.strokeStyle = `hsla(${p.hue}, 60%, 55%, ${alpha})`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 60%, 55%, ${0.85 * p.alpha})`;
                ctx.fill();
            });

            // Title
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Mehrdimensionale Becken – verzerrte, pulsierende Felder', W / 2, 22);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Keine einfachen Kugeln – die Becken sind organisch und lebendig', W / 2, 40);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 5: "Paris" – 3D, komplexe Becken, Schnittbecken
    // ============================================================
    function renderParisInteractive3D(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // 3D projection parameters
        let camAngle = 0;
        const focalLength = 600;
        const centerX = W / 2, centerY = H / 2;

        function project3D(x, y, z) {
            // Rotate around Y axis
            const cosA = Math.cos(camAngle);
            const sinA = Math.sin(camAngle);
            const rx = x * cosA - z * sinA;
            const rz = x * sinA + z * cosA;
            const ry = y;

            // Perspective projection
            const scale = focalLength / (focalLength + rz + 300);
            return {
                px: centerX + rx * scale,
                py: centerY + ry * scale,
                scale: scale,
                depth: rz
            };
        }

        // Basin centers in 3D space
        const basinHauptstadt = { x: -120, y: 0, z: -50, label: '"Hauptstadt"', color: '#8b5cf6', hue: 270 };
        const basinFrankreich = { x: 120, y: 0, z: -50, label: '"Frankreich"', color: '#3b82f6', hue: 220 };
        const parisTarget = { x: 0, y: 0, z: 50, label: 'Paris', color: '#ef4444' };

        // Particles in 3D
        const numParticles = 40;
        let particles = [];

        function spawnParticle3D() {
            const startX = (Math.random() - 0.5) * 400;
            const startY = -150 - Math.random() * 100;
            const startZ = (Math.random() - 0.5) * 200;
            return {
                x: startX, y: startY, z: startZ,
                vx: 0, vy: 0, vz: 0,
                trail: [],
                phase: Math.random() * Math.PI * 2,
                arrived: false,
                alpha: 1
            };
        }

        for (let i = 0; i < numParticles; i++) {
            particles.push(spawnParticle3D());
        }

        animationRunning = true;
        let t = 0;

        function drawBasinField3D(basin, radius, numRings) {
            for (let ring = 0; ring < numRings; ring++) {
                const baseR = 20 + ring * (radius / numRings);
                ctx.beginPath();
                let first = true;
                for (let a = 0; a <= 48; a++) {
                    const angle = (a / 48) * Math.PI * 2;
                    const warp = 1 + 0.12 * Math.sin(angle * 3 + t * 0.01 + ring);
                    const r = baseR * warp;
                    // Points on a tilted disk in 3D
                    const px3d = basin.x + Math.cos(angle) * r;
                    const py3d = basin.y + Math.sin(angle) * r * 0.3; // flatten for 3D look
                    const pz3d = basin.z + Math.sin(angle) * r * 0.5;
                    const proj = project3D(px3d, py3d, pz3d);
                    if (first) { ctx.moveTo(proj.px, proj.py); first = false; }
                    else ctx.lineTo(proj.px, proj.py);
                }
                ctx.closePath();
                ctx.strokeStyle = `hsla(${basin.hue}, 50%, 55%, ${0.06 + ring * 0.02})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        function draw() {
            if (!animationRunning) return;
            t++;
            camAngle = Math.sin(t * 0.003) * 0.3; // gentle oscillation

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw prompt
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('"Die Hauptstadt von Frankreich ist ___"', W / 2, 24);

            // Draw basin fields
            drawBasinField3D(basinHauptstadt, 130, 5);
            drawBasinField3D(basinFrankreich, 130, 5);

            // Draw overlap/intersection basin (Paris) – stronger, different shape
            for (let ring = 0; ring < 4; ring++) {
                const baseR = 15 + ring * 18;
                ctx.beginPath();
                let first = true;
                for (let a = 0; a <= 48; a++) {
                    const angle = (a / 48) * Math.PI * 2;
                    const warp = 1 + 0.2 * Math.sin(angle * 4 + t * 0.015 + ring * 2);
                    const r = baseR * warp;
                    const px3d = parisTarget.x + Math.cos(angle) * r;
                    const py3d = parisTarget.y + Math.sin(angle) * r * 0.3;
                    const pz3d = parisTarget.z + Math.sin(angle) * r * 0.5;
                    const proj = project3D(px3d, py3d, pz3d);
                    if (first) { ctx.moveTo(proj.px, proj.py); first = false; }
                    else ctx.lineTo(proj.px, proj.py);
                }
                ctx.closePath();
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.1 + ring * 0.04})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                if (ring <= 1) {
                    ctx.fillStyle = `rgba(239, 68, 68, ${0.04 + (1 - ring) * 0.02})`;
                    ctx.fill();
                }
            }

            // Basin labels
            const projH = project3D(basinHauptstadt.x, basinHauptstadt.y - 80, basinHauptstadt.z);
            const projF = project3D(basinFrankreich.x, basinFrankreich.y - 80, basinFrankreich.z);
            const projP = project3D(parisTarget.x, parisTarget.y + 50, parisTarget.z);

            ctx.font = 'bold 13px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = basinHauptstadt.color;
            ctx.fillText(basinHauptstadt.label, projH.px, projH.py);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.fillText('⚡ AKTIV', projH.px, projH.py + 14);

            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = basinFrankreich.color;
            ctx.fillText(basinFrankreich.label, projF.px, projF.py);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.fillText('⚡ AKTIV', projF.px, projF.py + 14);

            // Paris attractor point
            const projParis = project3D(parisTarget.x, parisTarget.y, parisTarget.z);
            const pulse = 1 + 0.12 * Math.sin(t * 0.05);
            ctx.beginPath();
            ctx.arc(projParis.px, projParis.py, 14 * pulse * projParis.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glow
            const glowGrad = ctx.createRadialGradient(projParis.px, projParis.py, 10, projParis.px, projParis.py, 50);
            glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(projParis.px, projParis.py, 50, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('Paris', projP.px, projP.py);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Neuer Attraktor im Schnittbereich', projP.px, projP.py + 14);

            // Draw connection arrows (dashed, animated)
            const dashOffset = t * 0.5;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -dashOffset;

            // Arrow from Hauptstadt to Paris
            const projHC = project3D(basinHauptstadt.x + 40, basinHauptstadt.y, basinHauptstadt.z);
            const projPC = project3D(parisTarget.x - 20, parisTarget.y, parisTarget.z);
            ctx.beginPath();
            ctx.moveTo(projHC.px, projHC.py);
            ctx.quadraticCurveTo((projHC.px + projPC.px) / 2, projHC.py - 30, projPC.px, projPC.py);
            ctx.strokeStyle = basinHauptstadt.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Arrow from Frankreich to Paris
            const projFC = project3D(basinFrankreich.x - 40, basinFrankreich.y, basinFrankreich.z);
            const projPC2 = project3D(parisTarget.x + 20, parisTarget.y, parisTarget.z);
            ctx.beginPath();
            ctx.moveTo(projFC.px, projFC.py);
            ctx.quadraticCurveTo((projFC.px + projPC2.px) / 2, projFC.py - 30, projPC2.px, projPC2.py);
            ctx.strokeStyle = basinFrankreich.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;

            // Animate particles toward Paris (pulled by both basins)
            particles.forEach((p, idx) => {
                if (p.arrived) {
                    p.alpha -= 0.01;
                    if (p.alpha <= 0) {
                        particles[idx] = spawnParticle3D();
                    }
                    return;
                }

                // Pull toward Paris target
                const dx = parisTarget.x - p.x;
                const dy = parisTarget.y - p.y;
                const dz = parisTarget.z - p.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                // Spiral component
                const spiralAngle = Math.atan2(dy, dx) + 0.4 * Math.sin(p.phase + t * 0.012);
                const pullStrength = 0.0003 * (1 + 100 / (dist + 20));

                p.vx += Math.cos(spiralAngle) * dist * pullStrength;
                p.vy += dy * pullStrength * 0.8;
                p.vz += dz * pullStrength * 0.6;

                p.vx *= 0.96;
                p.vy *= 0.96;
                p.vz *= 0.96;

                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                const proj = project3D(p.x, p.y, p.z);
                p.trail.push({ px: proj.px, py: proj.py });
                if (p.trail.length > 50) p.trail.shift();

                if (dist < 15) {
                    p.arrived = true;
                    p.alpha = 1;
                }

                // Draw trail
                if (p.trail.length > 1) {
                    for (let i = 1; i < p.trail.length; i++) {
                        const alpha = (i / p.trail.length) * 0.3 * p.alpha;
                        ctx.beginPath();
                        ctx.moveTo(p.trail[i - 1].px, p.trail[i - 1].py);
                        ctx.lineTo(p.trail[i].px, p.trail[i].py);
                        // Color blend: purple to blue to red as it approaches
                        const progress = 1 - (dist / 300);
                        const r = Math.round(139 + progress * 100);
                        const g = Math.round(92 * (1 - progress));
                        const b = Math.round(246 * (1 - progress) + 68 * progress);
                        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(proj.px, proj.py, 3 * proj.scale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${0.7 * p.alpha})`;
                ctx.fill();
            });

            // Bottom explanation
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('Beide Becken überlappen sich im 3D-Raum → im Schnittbereich entsteht ein neuer, stärkerer Attraktor: "Paris"', W / 2, H - 16);

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
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => AttractorViz.init(), 150));
} else {
    setTimeout(() => AttractorViz.init(), 150);
}

// Handle resize
window.addEventListener('resize', () => {
    if (AttractorViz.isOnAttractorSlide()) {
        AttractorViz.reset();
    }
});
