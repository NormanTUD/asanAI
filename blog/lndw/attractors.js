// ============================================================
// ATTRACTOR BASIN VISUALIZATION v2
// Komplett überarbeitet: mehr Animation, 3D, dynamische Systeme
// ============================================================
const AttractorViz = (() => {
    let currentStep = 0;
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
        return currentStep < totalSteps - 1;
    }

    function canGoPrev() {
        if (!isOnAttractorSlide()) return false;
        return currentStep > 0;
    }

    function next() {
        if (canGoNext()) {
            currentStep++;
            renderStep(currentStep);
        }
    }

    function prev() {
        if (canGoPrev()) {
            currentStep--;
            renderStep(currentStep);
        }
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

    function renderStep(step) {
        stopAllAnimations();
        const container = document.getElementById('attractor-viz-container');
        if (!container) return;

        document.querySelectorAll('.attr-indicator').forEach(el => {
            const s = parseInt(el.getAttribute('data-step'));
            el.classList.toggle('active', s === step);
        });

        const captions = [
            '<b>Punkt-Attraktor (3D):</b> Ein stabiler Fixpunkt – alle Bahnen spiralen auf verschiedenen Wegen hinein. Das System ist dynamisch: neue Punkte starten immer wieder.',
            '<b>Torus-Attraktor:</b> ☀️ Sonne im Zentrum, 🌍 Erde kreist darum, 🌙 Mond kreist um die Erde – eine Bahn auf einem Torus (Kreis um einen Kreis).',
            '<b>Lorenz-Attraktor:</b> Punkte bewegen sich auf der chaotischen Bahn – deterministisch, aber unvorhersagbar. Beobachte, wie sie zwischen den zwei "Flügeln" wechseln.',
            '<b>Attraktorbecken (3D):</b> Drei Becken im Raum. Punkte spiralen auf komplexen Bahnen zu ihrem jeweiligen Attraktor. In Überlappungszonen herrscht Konkurrenz.',
            '<b>Mehrdimensionale Becken (3D):</b> Drei Attraktorbecken mit Punkten auf komplexen, spiralförmigen Bahnen – nicht nur gerade Linien, sondern echte Dynamik.',
            '<b>"Paris" als Attraktor:</b> Der Kontext "Hauptstadt" UND "Frankreich" wird aktiv – beide Becken ziehen gleichzeitig, bis die Punkte bei "Paris" ankommen.'
        ];
        const captionEl = document.getElementById('attractor-caption');
        if (captionEl) captionEl.innerHTML = captions[step];

        switch (step) {
            case 0: renderPointAttractor3D(container); break;
            case 1: renderTorusOrbits(container); break;
            case 2: renderLorenzAnimated(container); break;
            case 3: renderBasins3D(container); break;
            case 4: renderMultiDimBasins3D(container); break;
            case 5: renderParisInteractive(container); break;
        }
    }

    // ============================================================
    // STEP 0: 3D Punkt-Attraktor mit spiralförmigen Bahnen (Endlosschleife)
    // ============================================================
    function renderPointAttractor3D(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const cx = W / 2, cy = H / 2;

        const numParticles = 60;
        let particles = [];

        function spawnParticle() {
            const angle = Math.random() * Math.PI * 2;
            const r = 150 + Math.random() * 120;
            const spinDir = Math.random() > 0.5 ? 1 : -1;
            return {
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
                angle: angle,
                radius: r,
                spinDir: spinDir,
                spinSpeed: 0.02 + Math.random() * 0.03,
                shrinkSpeed: 0.985 + Math.random() * 0.01,
                trail: [],
                alpha: 1,
                arrived: false,
                z: (Math.random() - 0.5) * 200 // fake depth
            };
        }

        for (let i = 0; i < numParticles; i++) {
            particles.push(spawnParticle());
        }

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // 3D-ish basin gradient (concentric rings for depth)
            for (let ring = 5; ring >= 0; ring--) {
                const rr = 40 + ring * 40;
                const grad = ctx.createRadialGradient(cx, cy, rr - 30, cx, cy, rr);
                grad.addColorStop(0, `rgba(59,130,246,${0.03 + ring * 0.015})`);
                grad.addColorStop(1, 'rgba(59,130,246,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, rr, 0, Math.PI * 2);
                ctx.fill();
            }

            // "Trichter"-Linien für 3D-Effekt
            ctx.strokeStyle = 'rgba(59,130,246,0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }

            // Attractor point (pulsing)
            const pulse = 1 + 0.1 * Math.sin(t * 0.05);
            ctx.beginPath();
            ctx.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#1e40af';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#1e40af';
            ctx.textAlign = 'center';
            ctx.fillText('Fixpunkt', cx, cy + 28);

            // Sort by z for pseudo-3D
            particles.sort((a, b) => a.z - b.z);

            particles.forEach((p, idx) => {
                if (!p.arrived) {
                    // Spiral inward
                    p.angle += p.spinDir * p.spinSpeed;
                    p.radius *= p.shrinkSpeed;
                    p.z *= 0.99;

                    // Perspective factor
                    const perspective = 1 + p.z / 400;
                    p.x = cx + Math.cos(p.angle) * p.radius * perspective;
                    p.y = cy + Math.sin(p.angle) * p.radius * (0.6 + 0.4 * perspective); // elliptical for 3D

                    p.trail.push({ x: p.x, y: p.y });
                    if (p.trail.length > 80) p.trail.shift();

                    if (p.radius < 5) {
                        p.arrived = true;
                        p.alpha = 1;
                    }
                } else {
                    // Fade out and respawn
                    p.alpha -= 0.02;
                    if (p.alpha <= 0) {
                        particles[idx] = spawnParticle();
                    }
                }

                // Draw trail
                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = `rgba(59,130,246,${0.2 * p.alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Draw particle (size varies with z for depth)
                const size = 3 + (p.z + 100) / 80;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(2, size), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59,130,246,${0.8 * p.alpha})`;
                ctx.fill();
            });

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 1: Torus – Sonne/Erde/Mond animiert
    // ============================================================
    function renderTorusOrbits(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        const cx = W / 2, cy = H / 2;

        const earthOrbitR = 160;
        const moonOrbitR = 40;
        const earthSpeed = 0.008;
        const moonSpeed = 0.05;

        let earthAngle = 0;
        let moonAngle = 0;
        let earthTrail = [];
        let moonTrail = [];

        animationRunning = true;

        function draw() {
            if (!animationRunning) return;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#0a0a2a';
            ctx.fillRect(0, 0, W, H);

            // Stars
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let i = 0; i < 80; i++) {
                const sx = ((i * 137.5) % W);
                const sy = ((i * 97.3 + 50) % H);
                ctx.fillRect(sx, sy, 1, 1);
            }

            // Earth orbit path
            ctx.beginPath();
            ctx.arc(cx, cy, earthOrbitR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100,180,255,0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Earth position
            earthAngle += earthSpeed;
            const earthX = cx + Math.cos(earthAngle) * earthOrbitR;
            const earthY = cy + Math.sin(earthAngle) * earthOrbitR * 0.4; // perspective

            // Moon orbit path around earth
            ctx.beginPath();
            ctx.arc(earthX, earthY, moonOrbitR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200,200,200,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Moon position
            moonAngle += moonSpeed;
            const moonX = earthX + Math.cos(moonAngle) * moonOrbitR;
            const moonY = earthY + Math.sin(moonAngle) * moonOrbitR * 0.6;

            // Trails
            earthTrail.push({ x: earthX, y: earthY });
            if (earthTrail.length > 300) earthTrail.shift();
            moonTrail.push({ x: moonX, y: moonY });
            if (moonTrail.length > 300) moonTrail.shift();

            // Draw earth trail
            if (earthTrail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(earthTrail[0].x, earthTrail[0].y);
                for (let i = 1; i < earthTrail.length; i++) {
                    ctx.lineTo(earthTrail[i].x, earthTrail[i].y);
                }
                ctx.strokeStyle = 'rgba(100,180,255,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Draw moon trail (this is the torus shape!)
            if (moonTrail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(moonTrail[0].x, moonTrail[0].y);
                for (let i = 1; i < moonTrail.length; i++) {
                    ctx.lineTo(moonTrail[i].x, moonTrail[i].y);
                }
                ctx.strokeStyle = 'rgba(220,220,220,0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Sun
            const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
            sunGrad.addColorStop(0, '#ffdd00');
            sunGrad.addColorStop(0.6, '#ff9900');
            sunGrad.addColorStop(1, 'rgba(255,150,0,0)');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☀️', cx, cy);

            // Earth
            ctx.font = '20px serif';
            ctx.fillText('🌍', earthX, earthY);

            // Moon
            ctx.font = '14px serif';
            ctx.fillText('🌙', moonX, moonY);

            // Labels
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#ffdd00';
            ctx.textAlign = 'center';
            ctx.fillText('Sonne (Zentrum)', cx, cy + 40);
            ctx.fillStyle = '#64b5f6';
            ctx.fillText('Erde (Kreis 1)', earthX, earthY + 22);
            ctx.fillStyle = '#ccc';
            ctx.fillText('Mond (Kreis um Kreis = Torus)', moonX, moonY + 18);

            // Explanation
            ctx.font = '13px system-ui';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Die Bahn des Mondes ist ein Kreis um einen Kreis → Torus-Attraktor', cx, H - 30);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 2: Lorenz-Attraktor mit animierten Punkten
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

        // Pre-compute full path for background
        let bgPath = [];
        {
            let x = 1, y = 1, z = 1;
            for (let i = 0; i < 8000; i++) {
                const dx = sigma * (y - x);
                const dy = x * (rho - z) - y;
                const dz = x * y - beta * z;
                x += dx * dt; y += dy * dt; z += dz * dt;
                bgPath.push({ x, y, z });
            }
        }

        // Multiple animated particles
        const numParticles = 5;
        let particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: 1 + (Math.random() - 0.5) * 2,
                y: 1 + (Math.random() - 0.5) * 2,
                z: 1 + (Math.random() - 0.5) * 2,
                trail: [],
                color: `hsl(${i * 72}, 80%, 55%)`
            });
        }

        const scale = 5.5;
        const offsetX = W / 2;
        const offsetY = H * 0.75;

        function project(x, y, z) {
            return {
                px: offsetX + x * scale,
                py: offsetY - z * scale * 0.55
            };
        }

        animationRunning = true;
        let frame = 0;

        function draw() {
            if (!animationRunning) return;
            frame++;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw background path (faint)
            ctx.beginPath();
            const p0 = project(bgPath[0].x, bgPath[0].y, bgPath[0].z);
            ctx.moveTo(p0.px, p0.py);
            for (let i = 1; i < bgPath.length; i += 2) {
                const p = project(bgPath[i].x, bgPath[i].y, bgPath[i].z);
                ctx.lineTo(p.px, p.py);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Advance and draw particles
            particles.forEach(part => {
                // Integrate 4 steps per frame for speed
                for (let s = 0; s < 4; s++) {
                    const dx = sigma * (part.y - part.x);
                    const dy = part.x * (rho - part.z) - part.y;
                    const dz = part.x * part.y - beta * part.z;
                    part.x += dx * dt;
                    part.y += dy * dt;
                    part.z += dz * dt;
                }

                const pp = project(part.x, part.y, part.z);
                part.trail.push({ px: pp.px, py: pp.py });
                if (part.trail.length > 200) part.trail.shift();

                // Draw trail
                if (part.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(part.trail[0].px, part.trail[0].py);
                    for (let i = 1; i < part.trail.length; i++) {
                        ctx.lineTo(part.trail[i].px, part.trail[i].py);
                    }
                    ctx.strokeStyle = part.color;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.6;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // Draw particle head
                ctx.beginPath();
                ctx.arc(pp.px, pp.py, 5, 0, Math.PI * 2);
                ctx.fillStyle = part.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Title
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('Lorenz-Attraktor – 5 Punkte auf chaotischen Bahnen', W / 2, 24);

            activeAnimation = requestAnimationFrame(draw);
        }
        draw();
    }

    // ============================================================
    // STEP 3: 3D Attraktorbecken mit spiralförmigen Bahnen
    // ============================================================
    function renderBasins3D(container) {
        container.innerHTML = '<div id="attractor-plotly" style="width:100%;height:480px;border-radius:10px;"></div>';
        const div = document.getElementById('attractor-plotly');

        const attractors = [
            { x: 3, y: 3, z: 2, label: 'Berlin', color: '#3b82f6' },
            { x: -2, y: 2, z: -1, label: 'Paris', color: '#10b981' },
            { x: 1, y: -3, z: 1, label: 'Madrid', color: '#f59e0b' }
        ];

        const traces = [];

        // Attractor points
        traces.push({
            type: 'scatter3d',
            mode: 'markers+text',
            x: attractors.map(a => a.x),
            y: attractors.map(a => a.y),
            z: attractors.map(a => a.z),
            text: attractors.map(a => a.label),
            textposition: 'top center',
            textfont: { size: 12, color: attractors.map(a => a.color) },
            marker: { size: 12, color: attractors.map(a => a.color), symbol: 'diamond' },
            hoverinfo: 'text',
            showlegend: false
        });

        // Generate spiral paths to each attractor
        const pathsPerAttractor = 8;
        attractors.forEach(attr => {
            for (let p = 0; p < pathsPerAttractor; p++) {
                const startAngle = Math.random() * Math.PI * 2;
                const startR = 3 + Math.random() * 3;
                const startZ = attr.z + (Math.random() - 0.5) * 5;
                const spinDir = Math.random() > 0.5 ? 1 : -1;
                const spinSpeed = 0.1 + Math.random() * 0.15;
                const shrink = 0.93 + Math.random() * 0.04;

                const pathX = [], pathY = [], pathZ = [];
                let angle = startAngle;
                let r = startR;
                let z = startZ;

                for (let t = 0; t < 60; t++) {
                    pathX.push(attr.x + Math.cos(angle) * r);
                    pathY.push(attr.y + Math.sin(angle) * r);
                    pathZ.push(z);
                    angle += spinDir * spinSpeed;
                    r *= shrink;
                    z += (attr.z - z) * 0.08;
                }

                traces.push({
                    type: 'scatter3d',
                    mode: 'lines',
                    x: pathX, y: pathY, z: pathZ,
                    line: { color: attr.color, width: 3 },
                    opacity: 0.5,
                    hoverinfo: 'skip',
                    showlegend: false
                });

                // Endpoint marker (particle)
                traces.push({
                    type: 'scatter3d',
                    mode: 'markers',
                    x: [pathX[0]],
                    y: [pathY[0]],
                    z: [pathZ[0]],
                    marker: { size: 4, color: attr.color },
                    hoverinfo: 'skip',
                    showlegend: false
                });
            }
        });

        // Basin spheres (transparent)
        attractors.forEach(attr => {
            const u = [], v = [], w = [];
            for (let i = 0; i <= 20; i++) {
                const uRow = [], vRow = [], wRow = [];
                const phi = (i / 20) * Math.PI;
                for (let j = 0; j <= 20; j++) {
                    const theta = (j / 20) * 2 * Math.PI;
                    const R = 3.5;
                    uRow.push(attr.x + R * Math.sin(phi) * Math.cos(theta));
                    vRow.push(attr.y + R * Math.sin(phi) * Math.sin(theta));
                    wRow.push(attr.z + R * Math.cos(phi));
                }
                u.push(uRow); v.push(vRow); w.push(wRow);
            }
            traces.push({
                type: 'surface',
                x: u, y: v, z: w,
                opacity: 0.07,
                colorscale: [[0, attr.color], [1, attr.color]],
                showscale: false,
                hoverinfo: 'skip'
            });
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 30 },
            title: { text: '3D Attraktorbecken mit Spiralbahnen', font: { size: 14, family: 'system-ui' } },
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                camera: { eye: { x: 2.0, y: 1.5, z: 1.2 } },
                bgcolor: '#fafafa'
            },
            paper_bgcolor: '#fafafa',
            showlegend: false
        };

        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });

        // Animate camera rotation
        animationRunning = true;
        let camAngle = 0;
        function rotateCamera() {
            if (!animationRunning) return;
            camAngle += 0.005;
            Plotly.relayout(div, {
                'scene.camera.eye': {
                    x: 2.2 * Math.cos(camAngle),
                    y: 2.2 * Math.sin(camAngle),
                    z: 1.2
                }
            });
            activeAnimation = requestAnimationFrame(rotateCamera);
        }
        rotateCamera();
    }

    // ============================================================
    // STEP 4: Mehrdimensionale Becken – 3 Attraktoren, komplexe Bahnen
    // ============================================================
    function renderMultiDimBasins3D(container) {
        container.innerHTML = '<div id="attractor-plotly" style="width:100%;height:480px;border-radius:10px;"></div>';
        const div = document.getElementById('attractor-plotly');

        const attractors = [
            { x: 4, y: 0, z: 0, label: 'Attraktor A', color: '#3b82f6' },
            { x: -3, y: 3, z: 2, label: 'Attraktor B', color: '#10b981' },
            { x: 0, y: -4, z: -2, label: 'Attraktor C', color: '#f59e0b' }
        ];

        const traces = [];

        // Attractor points
        traces.push({
            type: 'scatter3d',
            mode: 'markers+text',
            x: attractors.map(a => a.x),
            y: attractors.map(a => a.y),
            z: attractors.map(a => a.z),
            text: attractors.map(a => a.label),
            textposition: 'top center',
            textfont: { size: 12, color: attractors.map(a => a.color) },
            marker: { size: 12, color: attractors.map(a => a.color), symbol: 'diamond' },
            hoverinfo: 'text',
            showlegend: false
        });

        // Generate complex spiral paths to each attractor
        const pathsPerAttractor = 10;
        attractors.forEach(attr => {
            for (let p = 0; p < pathsPerAttractor; p++) {
                const startAngle = Math.random() * Math.PI * 2;
                const startElev = (Math.random() - 0.5) * Math.PI;
                const startR = 4 + Math.random() * 3;
                const spinDir = Math.random() > 0.5 ? 1 : -1;
                const spinSpeed = 0.12 + Math.random() * 0.18;
                const elevOscSpeed = 0.08 + Math.random() * 0.1;
                const shrink = 0.92 + Math.random() * 0.04;

                const pathX = [], pathY = [], pathZ = [];
                let angle = startAngle;
                let elev = startElev;
                let r = startR;

                for (let t = 0; t < 70; t++) {
                    // Spiral with elevation oscillation for complex 3D paths
                    pathX.push(attr.x + Math.cos(angle) * Math.cos(elev) * r);
                    pathY.push(attr.y + Math.sin(angle) * Math.cos(elev) * r);
                    pathZ.push(attr.z + Math.sin(elev) * r * 0.6);
                    angle += spinDir * spinSpeed;
                    elev += Math.sin(t * elevOscSpeed) * 0.05;
                    r *= shrink;
                }

                traces.push({
                    type: 'scatter3d',
                    mode: 'lines',
                    x: pathX, y: pathY, z: pathZ,
                    line: { color: attr.color, width: 3 },
                    opacity: 0.5,
                    hoverinfo: 'skip',
                    showlegend: false
                });

                // Particle at start of path
                traces.push({
                    type: 'scatter3d',
                    mode: 'markers',
                    x: [pathX[0]],
                    y: [pathY[0]],
                    z: [pathZ[0]],
                    marker: { size: 4, color: attr.color },
                    hoverinfo: 'skip',
                    showlegend: false
                });
            }
        });

        // Basin spheres (transparent)
        attractors.forEach(attr => {
            const u = [], v = [], w = [];
            for (let i = 0; i <= 16; i++) {
                const uRow = [], vRow = [], wRow = [];
                const phi = (i / 16) * Math.PI;
                for (let j = 0; j <= 16; j++) {
                    const theta = (j / 16) * 2 * Math.PI;
                    const R = 4.0;
                    uRow.push(attr.x + R * Math.sin(phi) * Math.cos(theta));
                    vRow.push(attr.y + R * Math.sin(phi) * Math.sin(theta));
                    wRow.push(attr.z + R * Math.cos(phi));
                }
                u.push(uRow); v.push(vRow); w.push(wRow);
            }
            traces.push({
                type: 'surface',
                x: u, y: v, z: w,
                opacity: 0.06,
                colorscale: [[0, attr.color], [1, attr.color]],
                showscale: false,
                hoverinfo: 'skip'
            });
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 30 },
            title: { text: 'Mehrdimensionale Attraktorbecken – komplexe Spiralbahnen', font: { size: 14, family: 'system-ui' } },
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                camera: { eye: { x: 2.2, y: 1.8, z: 1.4 } },
                bgcolor: '#fafafa'
            },
            paper_bgcolor: '#fafafa',
            showlegend: false
        };

        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });

        // Animate camera rotation
        animationRunning = true;
        let camAngle = 0;
        function rotateCamera() {
            if (!animationRunning) return;
            camAngle += 0.004;
            Plotly.relayout(div, {
                'scene.camera.eye': {
                    x: 2.5 * Math.cos(camAngle),
                    y: 2.5 * Math.sin(camAngle),
                    z: 1.4 + 0.3 * Math.sin(camAngle * 0.7)
                }
            });
            activeAnimation = requestAnimationFrame(rotateCamera);
        }
        rotateCamera();
    }

    // ============================================================
    // STEP 5: "Paris" – Zwei Becken interagieren, ziehen gemeinsam
    // ============================================================
    function renderParisInteractive(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // Layout: "Die Hauptstadt von Frankreich ist ___"
        // Two active basins: "Hauptstadt" (left) and "Frankreich" (right)
        // Both pull toward "Paris" in the center
        const basinHauptstadt = { x: W * 0.22, y: H * 0.45, rx: 180, ry: 160, color: '#8b5cf6', label: '"Hauptstadt"' };
        const basinFrankreich = { x: W * 0.78, y: H * 0.45, rx: 180, ry: 160, color: '#3b82f6', label: '"Frankreich"' };
        const parisTarget = { x: W * 0.5, y: H * 0.52 };

        // Other words in each basin (competitors)
        const hauptstadtWords = [
            { x: W * 0.15, y: H * 0.3, label: 'Berlin', strength: 0.3 },
            { x: W * 0.12, y: H * 0.6, label: 'Tokio', strength: 0.2 },
            { x: W * 0.28, y: H * 0.7, label: 'London', strength: 0.25 },
            { x: W * 0.08, y: H * 0.45, label: 'Rom', strength: 0.15 },
        ];
        const frankreichWords = [
            { x: W * 0.85, y: H * 0.3, label: 'Croissant', strength: 0.15 },
            { x: W * 0.9, y: H * 0.6, label: 'Eiffelturm', strength: 0.2 },
            { x: W * 0.72, y: H * 0.72, label: 'Lyon', strength: 0.2 },
            { x: W * 0.88, y: H * 0.45, label: 'Baguette', strength: 0.1 },
        ];

        // Particles: start from the context phrase and get pulled by BOTH basins
        const numParticles = 50;
        let particles = [];
        for (let i = 0; i < numParticles; i++) {
            // Start from top center (where the "prompt" is)
            const startX = W * 0.35 + Math.random() * W * 0.3;
            const startY = H * 0.08 + Math.random() * H * 0.12;
            particles.push({
                x: startX,
                y: startY,
                vx: 0,
                vy: 0,
                trail: [],
                phase: Math.random() * Math.PI * 2,
                arrived: false,
                alpha: 1
            });
        }

        animationRunning = true;
        let t = 0;

        function draw() {
            if (!animationRunning) return;
            t++;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw prompt text at top
            ctx.font = 'bold 15px system-ui';
            ctx.fillStyle = '#334155';
            ctx.textAlign = 'center';
            ctx.fillText('"Die Hauptstadt von Frankreich ist ___"', W / 2, 28);

            // Activation indicators
            const activationPulse = 0.5 + 0.5 * Math.sin(t * 0.04);

            // Draw basin: Hauptstadt
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(basinHauptstadt.x, basinHauptstadt.y, basinHauptstadt.rx, basinHauptstadt.ry, 0, 0, Math.PI * 2);
            const gradH = ctx.createRadialGradient(basinHauptstadt.x, basinHauptstadt.y, 0, basinHauptstadt.x, basinHauptstadt.y, basinHauptstadt.rx);
            gradH.addColorStop(0, `rgba(139,92,246,${0.12 + 0.06 * activationPulse})`);
            gradH.addColorStop(1, 'rgba(139,92,246,0.02)');
            ctx.fillStyle = gradH;
            ctx.fill();
            ctx.strokeStyle = `rgba(139,92,246,${0.4 + 0.2 * activationPulse})`;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Draw basin: Frankreich
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(basinFrankreich.x, basinFrankreich.y, basinFrankreich.rx, basinFrankreich.ry, 0, 0, Math.PI * 2);
            const gradF = ctx.createRadialGradient(basinFrankreich.x, basinFrankreich.y, 0, basinFrankreich.x, basinFrankreich.y, basinFrankreich.rx);
            gradF.addColorStop(0, `rgba(59,130,246,${0.12 + 0.06 * activationPulse})`);
            gradF.addColorStop(1, 'rgba(59,130,246,0.02)');
            ctx.fillStyle = gradF;
            ctx.fill();
            ctx.strokeStyle = `rgba(59,130,246,${0.4 + 0.2 * activationPulse})`;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Overlap region highlight
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(basinHauptstadt.x, basinHauptstadt.y, basinHauptstadt.rx, basinHauptstadt.ry, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.beginPath();
            ctx.ellipse(basinFrankreich.x, basinFrankreich.y, basinFrankreich.rx, basinFrankreich.ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239, 68, 68, ${0.06 + 0.04 * activationPulse})`;
            ctx.fill();
            ctx.restore();

            // Basin labels with "AKTIV" indicator
            ctx.font = 'bold 15px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = basinHauptstadt.color;
            ctx.fillText(basinHauptstadt.label, basinHauptstadt.x, H * 0.1);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.fillText('⚡ AKTIV', basinHauptstadt.x, H * 0.1 + 16);

            ctx.font = 'bold 15px system-ui';
            ctx.fillStyle = basinFrankreich.color;
            ctx.fillText(basinFrankreich.label, basinFrankreich.x, H * 0.1);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.fillText('⚡ AKTIV', basinFrankreich.x, H * 0.1 + 16);

            // Draw competitor words in Hauptstadt basin (faded)
            hauptstadtWords.forEach(w => {
                ctx.beginPath();
                ctx.arc(w.x, w.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(139,92,246,0.3)';
                ctx.fill();
                ctx.font = '11px system-ui';
                ctx.fillStyle = 'rgba(139,92,246,0.5)';
                ctx.textAlign = 'center';
                ctx.fillText(w.label, w.x, w.y + 16);
            });

            // Draw competitor words in Frankreich basin (faded)
            frankreichWords.forEach(w => {
                ctx.beginPath();
                ctx.arc(w.x, w.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59,130,246,0.3)';
                ctx.fill();
                ctx.font = '11px system-ui';
                ctx.fillStyle = 'rgba(59,130,246,0.5)';
                ctx.textAlign = 'center';
                ctx.fillText(w.label, w.x, w.y + 16);
            });

            // Paris attractor (pulsing, in overlap)
            const pulse = 1 + 0.1 * Math.sin(t * 0.06);
            ctx.beginPath();
            ctx.arc(parisTarget.x, parisTarget.y, 16 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glow
            const glowGrad = ctx.createRadialGradient(parisTarget.x, parisTarget.y, 12, parisTarget.x, parisTarget.y, 60);
            glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(parisTarget.x, parisTarget.y, 60, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 18px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('Paris', parisTarget.x, parisTarget.y + 36);
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Attraktor im Schnittbereich', parisTarget.x, parisTarget.y + 52);

            // Force arrows from both basins toward Paris (showing the "pull")
            if (t > 20) {
                const arrowAlpha = Math.min(0.7, (t - 20) / 50);
                ctx.globalAlpha = arrowAlpha;

                // Animated dashes
                const dashOffset = t * 0.5;

                // Arrow from Hauptstadt basin center toward Paris
                ctx.beginPath();
                ctx.moveTo(basinHauptstadt.x + 40, basinHauptstadt.y);
                ctx.quadraticCurveTo(W * 0.35, H * 0.42, parisTarget.x - 25, parisTarget.y - 10);
                ctx.strokeStyle = basinHauptstadt.color;
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = -dashOffset;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineDashOffset = 0;

                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(parisTarget.x - 25, parisTarget.y - 10);
                ctx.lineTo(parisTarget.x - 35, parisTarget.y - 18);
                ctx.lineTo(parisTarget.x - 30, parisTarget.y - 4);
                ctx.fillStyle = basinHauptstadt.color;
                ctx.fill();

                // Arrow from Frankreich basin center toward Paris
                ctx.beginPath();
                ctx.moveTo(basinFrankreich.x - 40, basinFrankreich.y);
                ctx.quadraticCurveTo(W * 0.65, H * 0.42, parisTarget.x + 25, parisTarget.y - 10);
                ctx.strokeStyle = basinFrankreich.color;
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = -dashOffset;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineDashOffset = 0;

                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(parisTarget.x + 25, parisTarget.y - 10);
                ctx.lineTo(parisTarget.x + 35, parisTarget.y - 18);
                ctx.lineTo(parisTarget.x + 30, parisTarget.y - 4);
                ctx.fillStyle = basinFrankreich.color;
                ctx.fill();

                // Labels on arrows
                ctx.font = 'bold 11px system-ui';
                ctx.textAlign = 'center';
                ctx.fillStyle = basinHauptstadt.color;
                ctx.fillText('zieht →', W * 0.33, H * 0.36);
                ctx.fillStyle = basinFrankreich.color;
                ctx.fillText('← zieht', W * 0.67, H * 0.36);

                ctx.globalAlpha = 1;
            }

            // Animate particles: pulled by BOTH basins toward Paris
            particles.forEach((p, idx) => {
                if (p.arrived) {
                    p.alpha -= 0.008;
                    if (p.alpha <= 0) {
                        // Respawn
                        p.x = W * 0.35 + Math.random() * W * 0.3;
                        p.y = H * 0.08 + Math.random() * H * 0.12;
                        p.vx = 0;
                        p.vy = 0;
                        p.trail = [];
                        p.arrived = false;
                        p.alpha = 1;
                    }
                    return;
                }

                // Force from Hauptstadt basin toward Paris
                const dxH = parisTarget.x - p.x;
                const dyH = parisTarget.y - p.y;
                const distH = Math.sqrt(dxH * dxH + dyH * dyH);

                // Force from Frankreich basin toward Paris
                const dxF = parisTarget.x - p.x;
                const dyF = parisTarget.y - p.y;

                // Combined pull with spiral component
                const spiralAngle = Math.atan2(dyH, dxH) + 0.4 * Math.sin(p.phase + t * 0.015);
                const pullStrength = 0.0004 * (1 + 200 / (distH + 50));

                p.vx += Math.cos(spiralAngle) * distH * pullStrength;
                p.vy += Math.sin(spiralAngle) * distH * pullStrength;

                // Damping
                p.vx *= 0.96;
                p.vy *= 0.96;

                p.x += p.vx;
                p.y += p.vy;

                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 60) p.trail.shift();

                if (distH < 18) {
                    p.arrived = true;
                }

                // Draw trail
                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    // Color gradient: purple near Hauptstadt side, blue near Frankreich side
                    const xRatio = (p.x - W * 0.2) / (W * 0.6);
                    const r = Math.round(139 * (1 - xRatio) + 59 * xRatio);
                    const g = Math.round(92 * (1 - xRatio) + 130 * xRatio);
                    const b = Math.round(246);
                    ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 * p.alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(239,68,68,${0.7 * p.alpha})`;
                ctx.fill();
            });

            // Explanation text at bottom
            ctx.font = '12px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('Beide Kontexte ("Hauptstadt" + "Frankreich") sind gleichzeitig aktiv und ziehen den Zustand zu "Paris"', W / 2, H - 16);

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
