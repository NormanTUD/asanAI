// ============================================================
// ATTRACTOR BASIN VISUALIZATION
// "Paris" als Attraktor im Becken von "Frankreich" + "Hauptstadt"
// ============================================================
const AttractorViz = (() => {
    let currentStep = 0;
    const totalSteps = 6;
    let animFrames = [];
    let activeAnimation = null;
    let plotlyDivs = [];

    // --- Utility ---
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
        renderStep(0);
    }

    function stopAllAnimations() {
        if (activeAnimation) {
            cancelAnimationFrame(activeAnimation);
            activeAnimation = null;
        }
    }

    // --- Step Rendering ---
    function renderStep(step) {
        stopAllAnimations();
        const container = document.getElementById('attractor-viz-container');
        if (!container) return;

        // Update step indicators
        document.querySelectorAll('.attr-indicator').forEach(el => {
            const s = parseInt(el.getAttribute('data-step'));
            el.classList.toggle('active', s === step);
        });

        // Update caption
        const captions = [
            '<b>Punkt-Attraktor:</b> Ein stabiler Fixpunkt – alle Bahnen in der Nähe werden angezogen.',
            '<b>Torus-Attraktor:</b> Periodische Systeme kreisen auf einer stabilen Bahn (Limit Cycle).',
            '<b>Lorenz-Attraktor:</b> Komplexe, chaotische Systeme – deterministisch, aber unvorhersagbar.',
            '<b>Attraktorbecken:</b> Jeder Attraktor hat einen Einzugsbereich. Überlappende Becken erzeugen Konkurrenz.',
            '<b>Mehrdimensionale Becken:</b> In hohen Dimensionen ziehen verschiedene Kontexte gleichzeitig.',
            '<b>"Paris" als Attraktor:</b> Im Einzugsbereich von "Frankreich" UND "Hauptstadt" liegt der Attraktor "Paris".'
        ];
        const captionEl = document.getElementById('attractor-caption');
        if (captionEl) captionEl.innerHTML = captions[step];

        switch (step) {
            case 0: renderPointAttractor(container); break;
            case 1: renderTorusAttractor(container); break;
            case 2: renderLorenzAttractor(container); break;
            case 3: renderBasinsOverlapping(container); break;
            case 4: renderMultiDimBasins(container); break;
            case 5: renderParisAttractor(container); break;
        }
    }

    // ============================================================
    // STEP 0: Punkt-Attraktor (2D, Partikel fallen in Fixpunkt)
    // ============================================================
    function renderPointAttractor(container) {
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
        const numParticles = 40;
        let particles = [];
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 100 + Math.random() * 140;
            particles.push({
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
                trail: []
            });
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw basin gradient
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
            grad.addColorStop(0, 'rgba(59,130,246,0.12)');
            grad.addColorStop(1, 'rgba(59,130,246,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 200, 0, Math.PI * 2);
            ctx.fill();

            // Attractor point
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#1e40af';
            ctx.textAlign = 'center';
            ctx.fillText('Fixpunkt-Attraktor', cx, cy + 28);

            // Particles
            let allArrived = true;
            particles.forEach(p => {
                const dx = cx - p.x;
                const dy = cy - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    allArrived = false;
                    const speed = 0.02 + 0.01 * (dist / 200);
                    p.x += dx * speed;
                    p.y += dy * speed;
                }
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 60) p.trail.shift();

                // Draw trail
                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = 'rgba(59,130,246,0.25)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();
            });

            if (!allArrived) {
                activeAnimation = requestAnimationFrame(draw);
            }
        }
        draw();
    }

    // ============================================================
    // STEP 1: Torus-Attraktor (Limit Cycle, Plotly 3D)
    // ============================================================
    function renderTorusAttractor(container) {
        container.innerHTML = '<div id="attractor-plotly" style="width:100%;height:480px;border-radius:10px;"></div>';
        const div = document.getElementById('attractor-plotly');

        // Generate torus
        const R = 3, r = 1;
        const uSteps = 60, vSteps = 30;
        const xData = [], yData = [], zData = [];
        for (let i = 0; i <= uSteps; i++) {
            const xRow = [], yRow = [], zRow = [];
            const u = (i / uSteps) * 2 * Math.PI;
            for (let j = 0; j <= vSteps; j++) {
                const v = (j / vSteps) * 2 * Math.PI;
                xRow.push((R + r * Math.cos(v)) * Math.cos(u));
                yRow.push((R + r * Math.cos(v)) * Math.sin(u));
                zRow.push(r * Math.sin(v));
            }
            xData.push(xRow);
            yData.push(yRow);
            zData.push(zRow);
        }

        // Trajectory on torus
        const trajX = [], trajY = [], trajZ = [];
        for (let t = 0; t < 500; t++) {
            const u = t * 0.05;
            const v = t * 0.13;
            trajX.push((R + r * Math.cos(v)) * Math.cos(u));
            trajY.push((R + r * Math.cos(v)) * Math.sin(u));
            trajZ.push(r * Math.sin(v));
        }

        const traces = [
            {
                type: 'surface',
                x: xData, y: yData, z: zData,
                opacity: 0.3,
                colorscale: [[0, '#bfdbfe'], [1, '#3b82f6']],
                showscale: false,
                hoverinfo: 'skip'
            },
            {
                type: 'scatter3d',
                mode: 'lines',
                x: trajX, y: trajY, z: trajZ,
                line: { color: '#ef4444', width: 4 },
                name: 'Bahn auf dem Torus',
                hoverinfo: 'skip'
            }
        ];

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 30 },
            title: { text: 'Torus-Attraktor (periodische Bahn)', font: { size: 14, family: 'system-ui' } },
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                camera: { eye: { x: 1.8, y: 1.2, z: 0.8 } },
                bgcolor: '#fafafa'
            },
            paper_bgcolor: '#fafafa',
            showlegend: false
        };

        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });
    }

    // ============================================================
    // STEP 2: Lorenz-Attraktor (Plotly 3D)
    // ============================================================
    function renderLorenzAttractor(container) {
        container.innerHTML = '<div id="attractor-plotly" style="width:100%;height:480px;border-radius:10px;"></div>';
        const div = document.getElementById('attractor-plotly');

        // Integrate Lorenz system
        const sigma = 10, rho = 28, beta = 8 / 3;
        const dt = 0.005;
        const steps = 10000;
        let x = 1, y = 1, z = 1;
        const xs = [], ys = [], zs = [];

        for (let i = 0; i < steps; i++) {
            const dx = sigma * (y - x);
            const dy = x * (rho - z) - y;
            const dz = x * y - beta * z;
            x += dx * dt;
            y += dy * dt;
            z += dz * dt;
            xs.push(x);
            ys.push(y);
            zs.push(z);
        }

        // Color by time
        const colors = xs.map((_, i) => i);

        const trace = {
            type: 'scatter3d',
            mode: 'lines',
            x: xs, y: ys, z: zs,
            line: { color: colors, colorscale: 'Portland', width: 2 },
            hoverinfo: 'skip'
        };

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 30 },
            title: { text: 'Lorenz-Attraktor (chaotisches System)', font: { size: 14, family: 'system-ui' } },
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
                camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
                bgcolor: '#fafafa'
            },
            paper_bgcolor: '#fafafa',
            showlegend: false
        };

        Plotly.newPlot(div, [trace], layout, { displayModeBar: false, responsive: true });
    }

    // ============================================================
    // STEP 3: Überlappende Attraktorbecken (Canvas, animiert)
    // ============================================================
    function renderBasinsOverlapping(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // Three attractors with overlapping basins
        const attractors = [
            { x: W * 0.25, y: H * 0.5, color: '#3b82f6', label: 'Berlin', radius: 160 },
            { x: W * 0.55, y: H * 0.35, color: '#10b981', label: 'Paris', radius: 170 },
            { x: W * 0.75, y: H * 0.6, color: '#f59e0b', label: 'Madrid', radius: 150 }
        ];

        // Particles
        const numParticles = 60;
        let particles = [];
        for (let i = 0; i < numParticles; i++) {
            const px = Math.random() * W;
            const py = Math.random() * H;
            // Find nearest attractor
            let nearest = attractors[0];
            let minDist = Infinity;
            attractors.forEach(a => {
                const d = Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2);
                if (d < minDist) { minDist = d; nearest = a; }
            });
            particles.push({
                x: px, y: py,
                target: nearest,
                trail: [],
                speed: 0.015 + Math.random() * 0.01
            });
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw basins (overlapping circles)
            attractors.forEach(a => {
                const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius);
                grad.addColorStop(0, a.color + '25');
                grad.addColorStop(0.7, a.color + '10');
                grad.addColorStop(1, a.color + '00');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx.fill();

                // Basin border
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx.strokeStyle = a.color + '40';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            });

            // Overlap region highlight
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('Überlappende Einzugsbereiche', W * 0.42, H * 0.12);

            // Attractor points
            attractors.forEach(a => {
                ctx.beginPath();
                ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = a.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.font = 'bold 13px system-ui';
                ctx.fillStyle = a.color;
                ctx.textAlign = 'center';
                ctx.fillText(a.label, a.x, a.y + 26);
            });

            // Animate particles
            let allArrived = true;
            particles.forEach(p => {
                const dx = p.target.x - p.x;
                const dy = p.target.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 3) {
                    allArrived = false;
                    p.x += dx * p.speed;
                    p.y += dy * p.speed;
                }
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 40) p.trail.shift();

                // Trail
                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = p.target.color + '30';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = p.target.color + 'aa';
                ctx.fill();
            });

            if (!allArrived) {
                activeAnimation = requestAnimationFrame(draw);
            }
        }
        draw();
    }

    // ============================================================
    // STEP 4: Mehrdimensionale Becken (Plotly 3D, animierte Partikel)
    // ============================================================
    function renderMultiDimBasins(container) {
        container.innerHTML = '<div id="attractor-plotly" style="width:100%;height:480px;border-radius:10px;"></div>';
        const div = document.getElementById('attractor-plotly');

        // 3D basins: multiple attractors in 3D space
        const attractors3D = [
            { x: 2, y: 2, z: 2, label: 'Attraktor A', color: '#3b82f6' },
            { x: -2, y: -2, z: 1, label: 'Attraktor B', color: '#10b981' },
            { x: 2, y: -2, z: -2, label: 'Attraktor C', color: '#f59e0b' },
            { x: -2, y: 2, z: -1, label: 'Attraktor D', color: '#ef4444' }
        ];

        // Generate particle trajectories toward attractors
        const traces = [];

        // Attractor points
        traces.push({
            type: 'scatter3d',
            mode: 'markers+text',
            x: attractors3D.map(a => a.x),
            y: attractors3D.map(a => a.y),
            z: attractors3D.map(a => a.z),
            text: attractors3D.map(a => a.label),
            textposition: 'top center',
            marker: { size: 10, color: attractors3D.map(a => a.color), symbol: 'diamond' },
            hoverinfo: 'text',
            name: 'Attraktoren'
        });

        // Particle paths
        const numPaths = 12;
        attractors3D.forEach(attr => {
            for (let p = 0; p < numPaths; p++) {
                const startX = attr.x + (Math.random() - 0.5) * 6;
                const startY = attr.y + (Math.random() - 0.5) * 6;
                const startZ = attr.z + (Math.random() - 0.5) * 6;
                const pathX = [], pathY = [], pathZ = [];
                let px = startX, py = startY, pz = startZ;
                for (let t = 0; t < 50; t++) {
                    pathX.push(px);
                    pathY.push(py);
                    pathZ.push(pz);
                    px += (attr.x - px) * 0.06;
                    py += (attr.y - py) * 0.06;
                    pz += (attr.z - pz) * 0.06;
                }
                traces.push({
                    type: 'scatter3d',
                    mode: 'lines',
                    x: pathX, y: pathY, z: pathZ,
                    line: { color: attr.color, width: 2 },
                    opacity: 0.5,
                    hoverinfo: 'skip',
                    showlegend: false
                });
            }
        });

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 30 },
            title: { text: 'Mehrdimensionale Attraktorbecken', font: { size: 14, family: 'system-ui' } },
            scene: {
                xaxis: { title: 'Dim 1', gridcolor: '#f1f5f9' },
                yaxis: { title: 'Dim 2', gridcolor: '#f1f5f9' },
                zaxis: { title: 'Dim 3', gridcolor: '#f1f5f9' },
                camera: { eye: { x: 2.0, y: 1.5, z: 1.2 } },
                bgcolor: '#fafafa'
            },
            paper_bgcolor: '#fafafa',
            showlegend: false
        };

        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });
    }

    // ============================================================
    // STEP 5: "Paris" als Attraktor (Canvas, animiert, show don't tell)
    // ============================================================
    function renderParisAttractor(container) {
        container.innerHTML = '<div id="attractor-canvas-wrap" style="position:relative;width:100%;height:480px;"><canvas id="attractor-canvas" style="width:100%;height:100%;display:block;border-radius:10px;"></canvas></div>';
        const canvas = document.getElementById('attractor-canvas');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        // Layout: Two large basins that overlap, Paris at intersection
        const basinFR = { x: W * 0.35, y: H * 0.5, rx: 200, ry: 180, color: '#3b82f6', label: '"Frankreich"' };
        const basinHS = { x: W * 0.65, y: H * 0.5, rx: 200, ry: 180, color: '#8b5cf6', label: '"Hauptstadt"' };
        const parisAttractor = { x: W * 0.5, y: H * 0.48, color: '#ef4444', label: 'Paris' };

        // Other attractors in basins (not at intersection)
        const otherAttractors = [
            { x: W * 0.22, y: H * 0.4, color: '#3b82f6', label: 'Croissant' },
            { x: W * 0.28, y: H * 0.7, color: '#3b82f6', label: 'Eiffelturm' },
            { x: W * 0.78, y: H * 0.35, color: '#8b5cf6', label: 'Berlin' },
            { x: W * 0.8, y: H * 0.65, color: '#8b5cf6', label: 'Tokio' },
        ];

        // Particles that start scattered and converge to Paris (in overlap zone)
        const numParticles = 35;
        let particles = [];
        for (let i = 0; i < numParticles; i++) {
            // Start in the overlap region
            const angle = Math.random() * Math.PI * 2;
            const r = 80 + Math.random() * 120;
            particles.push({
                x: parisAttractor.x + Math.cos(angle) * r,
                y: parisAttractor.y + Math.sin(angle) * r,
                trail: [],
                speed: 0.012 + Math.random() * 0.008,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Some particles go to other attractors
        let otherParticles = [];
        otherAttractors.forEach(attr => {
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 30 + Math.random() * 60;
                otherParticles.push({
                    x: attr.x + Math.cos(angle) * r,
                    y: attr.y + Math.sin(angle) * r,
                    target: attr,
                    trail: [],
                    speed: 0.01 + Math.random() * 0.005
                });
            }
        });

        let t = 0;

        function draw() {
            t++;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Draw basin ellipses
            // Frankreich basin
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(basinFR.x, basinFR.y, basinFR.rx, basinFR.ry, 0, 0, Math.PI * 2);
            const gradFR = ctx.createRadialGradient(basinFR.x, basinFR.y, 0, basinFR.x, basinFR.y, basinFR.rx);
            gradFR.addColorStop(0, basinFR.color + '18');
            gradFR.addColorStop(1, basinFR.color + '05');
            ctx.fillStyle = gradFR;
            ctx.fill();
            ctx.strokeStyle = basinFR.color + '50';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Hauptstadt basin
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(basinHS.x, basinHS.y, basinHS.rx, basinHS.ry, 0, 0, Math.PI * 2);
            const gradHS = ctx.createRadialGradient(basinHS.x, basinHS.y, 0, basinHS.x, basinHS.y, basinHS.rx);
            gradHS.addColorStop(0, basinHS.color + '18');
            gradHS.addColorStop(1, basinHS.color + '05');
            ctx.fillStyle = gradHS;
            ctx.fill();
            ctx.strokeStyle = basinHS.color + '50';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Overlap highlight
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath();
            ctx.ellipse(basinFR.x, basinFR.y, basinFR.rx, basinFR.ry, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.beginPath();
            ctx.ellipse(basinHS.x, basinHS.y, basinHS.rx, basinHS.ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fill();
            ctx.restore();

            // Basin labels
            ctx.font = 'bold 16px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = basinFR.color;
            ctx.fillText(basinFR.label, basinFR.x - 60, H * 0.12);
            ctx.fillStyle = basinHS.color;
            ctx.fillText(basinHS.label, basinHS.x + 60, H * 0.12);

            // "Einzugsbereich" labels
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Einzugsbereich', basinFR.x - 60, H * 0.12 + 18);
            ctx.fillText('Einzugsbereich', basinHS.x + 60, H * 0.12 + 18);

            // Other attractors (smaller)
            otherAttractors.forEach(a => {
                ctx.beginPath();
                ctx.arc(a.x, a.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = a.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.font = '11px system-ui';
                ctx.fillStyle = a.color;
                ctx.textAlign = 'center';
                ctx.fillText(a.label, a.x, a.y + 18);
            });

            // Animate other particles to their attractors
            otherParticles.forEach(p => {
                const dx = p.target.x - p.x;
                const dy = p.target.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    p.x += dx * p.speed;
                    p.y += dy * p.speed;
                }
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 30) p.trail.shift();

                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = p.target.color + '25';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = p.target.color + '80';
                ctx.fill();
            });

            // Paris attractor (big, pulsing)
            const pulse = 1 + 0.08 * Math.sin(t * 0.08);
            ctx.beginPath();
            ctx.arc(parisAttractor.x, parisAttractor.y, 14 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = parisAttractor.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glow around Paris
            const glowGrad = ctx.createRadialGradient(parisAttractor.x, parisAttractor.y, 10, parisAttractor.x, parisAttractor.y, 50);
            glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
            glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(parisAttractor.x, parisAttractor.y, 50, 0, Math.PI * 2);
            ctx.fill();

            // Paris label
            ctx.font = 'bold 18px system-ui';
            ctx.fillStyle = parisAttractor.color;
            ctx.textAlign = 'center';
            ctx.fillText('Paris', parisAttractor.x, parisAttractor.y + 34);

            ctx.font = '11px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Attraktor im Überlappungsbereich', parisAttractor.x, parisAttractor.y + 52);

            // Animate main particles toward Paris
            let allArrived = true;
            particles.forEach(p => {
                const dx = parisAttractor.x - p.x;
                const dy = parisAttractor.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 3) {
                    allArrived = false;
                    // Spiral inward slightly
                    const angle = Math.atan2(dy, dx) + 0.3 * Math.sin(p.phase + t * 0.02);
                    const pullStrength = p.speed * (1 + 0.5 * (1 - dist / 200));
                    p.x += Math.cos(angle) * dist * pullStrength;
                    p.y += Math.sin(angle) * dist * pullStrength;
                }
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 50) p.trail.shift();

                // Trail
                if (p.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let i = 1; i < p.trail.length; i++) {
                        ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    }
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444cc';
                ctx.fill();
            });

            // "Kontext"-Pfeile von Basins to Paris
            if (t > 30) {
                const arrowAlpha = Math.min(0.6, (t - 30) / 60);
                ctx.globalAlpha = arrowAlpha;

                // Arrow from "Frankreich" label area toward Paris
                ctx.beginPath();
                ctx.moveTo(basinFR.x - 60, H * 0.18);
                ctx.quadraticCurveTo(basinFR.x, H * 0.3, parisAttractor.x - 20, parisAttractor.y - 20);
                ctx.strokeStyle = basinFR.color;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow from "Hauptstadt" label area toward Paris
                ctx.beginPath();
                ctx.moveTo(basinHS.x + 60, H * 0.18);
                ctx.quadraticCurveTo(basinHS.x, H * 0.3, parisAttractor.x + 20, parisAttractor.y - 20);
                ctx.strokeStyle = basinHS.color;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.globalAlpha = 1;
            }

            if (!allArrived || t < 200) {
                activeAnimation = requestAnimationFrame(draw);
            }
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
