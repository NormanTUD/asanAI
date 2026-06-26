// ============================================================
// KNOWLEDGE STORAGE VISUALIZATION
// ============================================================
const KnowledgeViz = {
    canvas: null,
    ctx: null,
    currentStep: 0,
    animFrame: null,
    animProgress: 0,
    animating: false,

    W: 900,
    H: 480,

    // Embedding data for step 0
    countries: [
        { name: 'Frankreich', x: 0.25, y: 0.55, color: '#3b82f6' },
        { name: 'Deutschland', x: 0.25, y: 0.35, color: '#10b981' },
        { name: 'Spanien', x: 0.25, y: 0.75, color: '#f59e0b' },
        { name: 'Italien', x: 0.25, y: 0.15, color: '#8b5cf6' },
    ],
    capitals: [
        { name: 'Paris', x: 0.55, y: 0.55, color: '#3b82f6' },
        { name: 'Berlin', x: 0.55, y: 0.35, color: '#10b981' },
        { name: 'Madrid', x: 0.55, y: 0.75, color: '#f59e0b' },
        { name: 'Rom', x: 0.55, y: 0.15, color: '#8b5cf6' },
    ],

    // Neurons for step 2
    neurons: [
        { label: 'Hauptstadt?', active: true },
        { label: 'Europa?', active: true },
        { label: 'Frankreich?', active: true },
        { label: 'Fluss?', active: false },
        { label: 'Person?', active: false },
        { label: 'Tier?', active: false },
        { label: 'Verb?', active: false },
        { label: 'Plural?', active: false },
        { label: 'Negation?', active: false },
        { label: 'Zeitform?', active: false },
        { label: 'Geographie?', active: true },
        { label: 'Politik?', active: false },
        { label: 'Sprache?', active: false },
        { label: 'Größe?', active: false },
        { label: 'Ort?', active: true },
        { label: 'Abstrakt?', active: false },
    ],

    init: function() {
        const container = document.getElementById('knowledge-viz-container');
        if (!container) return;
        
        this.canvas = document.getElementById('knowledge-canvas');
        if (!this.canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.W = rect.width || 900;
        this.H = 480;
        
        this.canvas.width = this.W * dpr;
        this.canvas.height = this.H * dpr;
        this.canvas.style.height = this.H + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);

        this.setStep(0);
    },

	setStep: function(step) {
		this.currentStep = step;
		this.animProgress = 0;
		this.animating = true;

		// Update indicator styles (replaces old button logic)
		document.querySelectorAll('.know-indicator').forEach(el => {
			const s = parseInt(el.getAttribute('data-step'));
			el.classList.toggle('active', s === step);
		});

		// Update explanation
		const explanations = [
			'🧭️ <b>Schritt 1: Embedding-Richtung.</b> Liegt <i>irgendwo</i> im Raum',
			'👁️ <b>Schritt 2: Attention sammelt Kontext.</b> Schaut sich alle Tokens an und bestimmt, wo die Bedeutung insgesamt liegt',
			'🔥 <b>Schritt 3: FFN-Neuronen werden stark aktiviert.</b> Welche Neuronen stark aktiviert werden bestimmt, welche Themengebiete aktiv werden (Coding, Geographie, ...)',
			'🎯 <b>Gesamtbild:</b> Am Ende wird das (hoffentlich) nächste sinnvolle Wort ausgewählt'
		];
		const el = document.getElementById('knowledge-explanation');
		if (el) el.innerHTML = explanations[step];

		this.startAnimation();
	},

    startAnimation: function() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        const self = this;
        function loop() {
            self.animProgress = Math.min(1, self.animProgress + 0.02);
            self.render();
            if (self.animProgress < 1) {
                self.animFrame = requestAnimationFrame(loop);
            } else {
                self.animating = false;
            }
        }
        loop();
    },

    render: function() {
        const ctx = this.ctx;
        if (!ctx) return;
        const W = this.W;
        const H = this.H;
        const t = this.easeInOut(this.animProgress);

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, W, H);

        switch(this.currentStep) {
            case 0: this.renderEmbedding(ctx, W, H, t); break;
            case 1: this.renderAttention(ctx, W, H, t); break;
            case 2: this.renderFFN(ctx, W, H, t); break;
            case 3: this.renderFull(ctx, W, H, t); break;
        }
    },

    easeInOut: function(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    // ========== STEP 0: Embedding Direction ==========
    renderEmbedding: function(ctx, W, H, t) {
        const padL = 80, padR = 80, padT = 50, padB = 50;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;

        // Title
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('Embedding-Raum: "Hauptstadt-von"-Richtung', W/2, 30);

        // Draw arrows from countries to capitals
        for (let i = 0; i < this.countries.length; i++) {
            const c = this.countries[i];
            const cap = this.capitals[i];
            const x1 = padL + c.x * plotW;
            const y1 = padT + c.y * plotH;
            const x2 = padL + cap.x * plotW;
            const y2 = padT + cap.y * plotH;

            // Animate arrow drawing
            const ax = x1 + (x2 - x1) * t;
            const ay = y1 + (y2 - y1) * t;

            // Arrow line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(ax, ay);
            ctx.strokeStyle = c.color + '80';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrowhead
            if (t > 0.8) {
                const angle = Math.atan2(y2 - y1, x2 - x1);
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax - 12 * Math.cos(angle - 0.4), ay - 12 * Math.sin(angle - 0.4));
                ctx.lineTo(ax - 12 * Math.cos(angle + 0.4), ay - 12 * Math.sin(angle + 0.4));
                ctx.closePath();
                ctx.fillStyle = c.color + '80';
                ctx.fill();
            }

            // Country dot
            ctx.beginPath();
            ctx.arc(x1, y1, 10, 0, Math.PI * 2);
            ctx.fillStyle = c.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Country label
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = c.color;
            ctx.textAlign = 'right';
            ctx.fillText(c.name, x1 - 16, y1 + 5);

            // Capital dot (fade in)
            if (t > 0.3) {
                const alpha = Math.min(1, (t - 0.3) / 0.3);
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x2, y2, 12, 0, Math.PI * 2);
                ctx.fillStyle = c.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Capital label
                ctx.font = 'bold 14px system-ui';
                ctx.textAlign = 'left';
                ctx.fillText(cap.name, x2 + 18, y2 + 5);
                ctx.globalAlpha = 1;
            }
        }

        // "Hauptstadt-Richtung" label
        if (t > 0.6) {
            const alpha = Math.min(1, (t - 0.6) / 0.3);
            ctx.globalAlpha = alpha;
            
            // Big arrow showing the direction
            const arrowY = padT + 0.92 * plotH;
            ctx.beginPath();
            ctx.moveTo(padL + 0.28 * plotW, arrowY);
            ctx.lineTo(padL + 0.52 * plotW, arrowY);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(padL + 0.52 * plotW, arrowY);
            ctx.lineTo(padL + 0.52 * plotW - 14, arrowY - 7);
            ctx.lineTo(padL + 0.52 * plotW - 14, arrowY + 7);
            ctx.closePath();
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('← "Hauptstadt-von"-Richtung →', padL + 0.4 * plotW, arrowY - 14);

            ctx.globalAlpha = 1;
        }

        // Key insight box
        if (t > 0.8) {
            const alpha = Math.min(1, (t - 0.8) / 0.2);
            ctx.globalAlpha = alpha;
            const boxX = padL + 0.62 * plotW + 50;
            const boxY = padT + 0.1 * plotH;
            const boxW = 260;
            const boxH = 100;
            
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 10);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#92400e';
            ctx.textAlign = 'left';
            ctx.fillText('💡 Idee:', boxX + 14, boxY + 22);
            ctx.font = '11px system-ui';
            ctx.fillText('Alle Pfeile zeigen in dieselbe', boxX + 14, boxY + 42);
            ctx.fillText('Richtung! Das Wissen "X ist', boxX + 14, boxY + 58);
            ctx.fillText('Hauptstadt von Y" ist als', boxX + 14, boxY + 74);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 11px system-ui';
            ctx.fillText('geometrische Richtung kodiert.', boxX + 14, boxY + 90);
            ctx.globalAlpha = 1;
        }
    },

    // ========== STEP 1: Attention ==========
    renderAttention: function(ctx, W, H, t) {
        const tokens = ['Die', 'Hauptstadt', 'von', 'Frankreich', 'ist', '___'];
        const tokenW = 100;
        const startX = (W - tokens.length * tokenW) / 2;
        const tokenY = 80;

        // Title
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('Attention: Kontext sammeln für "___", Routing an die richtigen Neuronen', W/2, 30);

        // Draw tokens
        const tokenColors = ['#94a3b8', '#8b5cf6', '#94a3b8', '#3b82f6', '#94a3b8', '#ef4444'];
        tokens.forEach((tok, i) => {
            const x = startX + i * tokenW + tokenW/2;
            const isTarget = i === 5;
            const isImportant = i === 1 || i === 3;

            // Token box
            ctx.beginPath();
            ctx.roundRect(x - 40, tokenY - 18, 80, 36, 8);
            ctx.fillStyle = isTarget ? '#fef2f2' : isImportant ? '#eff6ff' : '#f8fafc';
            ctx.fill();
            ctx.strokeStyle = tokenColors[i];
            ctx.lineWidth = isTarget || isImportant ? 2.5 : 1;
            ctx.stroke();

            // Token text
            ctx.font = isTarget || isImportant ? 'bold 14px system-ui' : '13px system-ui';
            ctx.fillStyle = tokenColors[i];
            ctx.textAlign = 'center';
            ctx.fillText(tok, x, tokenY + 5);
        });

        // Attention arrows (from ___ back to "Hauptstadt" and "Frankreich")
        const targetX = startX + 5 * tokenW + tokenW/2;
        const targetY = tokenY + 18;

        const attentionSources = [
            { idx: 1, strength: 0.9, color: '#8b5cf6', label: 'Was wird gefragt?' },
            { idx: 3, strength: 0.95, color: '#3b82f6', label: 'Wovon?' },
        ];

        attentionSources.forEach((src, si) => {
            const srcX = startX + src.idx * tokenW + tokenW/2;
            const srcY = tokenY + 18;
            const delay = si * 0.3;
            const localT = Math.max(0, Math.min(1, (t - delay) / 0.5));

            if (localT > 0) {
                // Curved attention arrow
                const midY = tokenY + 80 + si * 50;
                const progress = this.easeInOut(localT);

                ctx.beginPath();
                ctx.moveTo(targetX, targetY);
                const cpX = (targetX + srcX) / 2;
                const cpY = midY;
                
                // Draw partial curve
                for (let p = 0; p <= progress * 20; p++) {
                    const pt = p / 20;
                    const px = (1-pt)*(1-pt)*targetX + 2*(1-pt)*pt*cpX + pt*pt*srcX;
                    const py = (1-pt)*(1-pt)*targetY + 2*(1-pt)*pt*cpY + pt*pt*srcY;
                    if (p === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.strokeStyle = src.color;
                ctx.lineWidth = 3 * src.strength;
                ctx.globalAlpha = 0.7;
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Label on curve
                if (localT > 0.5) {
                    const labelAlpha = Math.min(1, (localT - 0.5) / 0.3);
                    ctx.globalAlpha = labelAlpha;
                    ctx.font = 'bold 11px system-ui';
                    ctx.fillStyle = src.color;
                    ctx.textAlign = 'center';
                    ctx.fillText(src.label, cpX, cpY - 8);
                    ctx.globalAlpha = 1;
                }
            }
        });

        // Result: combined vector
        if (t > 0.7) {
            const alpha = Math.min(1, (t - 0.7) / 0.3);
            ctx.globalAlpha = alpha;

            const boxY = 280;
            const boxW = 500;
            const boxX = (W - boxW) / 2;

            ctx.fillStyle = '#f0fdf4';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, 140, 12);
            ctx.fill();
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#065f46';
            ctx.textAlign = 'center';
            ctx.fillText('Ergebnis: Der Vektor von "___" trägt jetzt:', W/2, boxY + 28);

            // Vector representation
            const vecY = boxY + 55;
            const dims = ['Hauptstadt?', 'Frankreich?', 'Frage?', 'Ort?', '...'];
            const vals = [0.92, 0.88, 0.75, 0.81, '...'];
            const dimW = boxW / dims.length;

            dims.forEach((dim, i) => {
                const dx = boxX + i * dimW + dimW/2;
                const val = vals[i];
                const isNum = typeof val === 'number';
                
                // Dimension box
                ctx.beginPath();
                ctx.roundRect(dx - 38, vecY, 76, 50, 6);
                ctx.fillStyle = isNum ? `rgba(16, 185, 129, ${val * 0.3})` : '#f1f5f9';
                ctx.fill();
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.font = '10px system-ui';
                ctx.fillStyle = '#64748b';
                ctx.textAlign = 'center';
                ctx.fillText(dim, dx, vecY + 16);

                ctx.font = 'bold 16px monospace';
                ctx.fillStyle = isNum ? '#065f46' : '#94a3b8';
                ctx.fillText(isNum ? val.toFixed(2) : val, dx, vecY + 40);
            });

            ctx.font = '12px system-ui';
            ctx.fillStyle = '#475569';
            ctx.fillText('→ Der Punkt "weiß" jetzt: "Hier wird nach einer Hauptstadt gefragt, und zwar von Frankreich"', W/2, boxY + 128);

            ctx.globalAlpha = 1;
        }
    },

    // ========== STEP 2: FFN Neurons ==========
    renderFFN: function(ctx, W, H, t) {
        // Title
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('FFN: Detektor-Neuronen erkennen das Muster', W/2, 30);

        // Input vector (left)
        const inputX = 80;
        const inputY = H/2 - 30;
        
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Eingang:', inputX, inputY - 30);
        ctx.fillText('"Hauptstadt +', inputX, inputY - 14);
        ctx.fillText('Frankreich"', inputX, inputY + 2);

        // Input dot
        ctx.beginPath();
        ctx.arc(inputX, inputY + 40, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Neuron wall (center)
        const neuronStartX = 200;
        const neuronEndX = 580;
        const neuronY = 60;
        const neuronH = 28;
        const neuronGap = 4;
        const cols = 4;
        const rows = Math.ceil(this.neurons.length / cols);

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText('Tausende "Detektor-Neuronen" (hier 16 gezeigt):', (neuronStartX + neuronEndX) / 2, neuronY - 8);

        this.neurons.forEach((neuron, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const nw = (neuronEndX - neuronStartX) / cols - neuronGap;
            const nx = neuronStartX + col * (nw + neuronGap);
            const ny = neuronY + row * (neuronH + neuronGap) + 10;

            const delay = neuron.active ? i * 0.03 : 0;
            const localT = Math.max(0, Math.min(1, (t - delay) / 0.4));
            const isLit = neuron.active && localT > 0.5;

            // Neuron box
            ctx.beginPath();
            ctx.roundRect(nx, ny, nw, neuronH, 5);
            if (isLit) {
                const glow = 0.3 + 0.7 * Math.min(1, (localT - 0.5) * 2);
                ctx.fillStyle = `rgba(245, 158, 11, ${glow})`;
            } else {
                ctx.fillStyle = '#f1f5f9';
            }
            ctx.fill();
            ctx.strokeStyle = isLit ? '#d97706' : '#e2e8f0';
            ctx.lineWidth = isLit ? 2 : 1;
            ctx.stroke();

            // Neuron label
            ctx.font = isLit ? 'bold 10px system-ui' : '9px system-ui';
            ctx.fillStyle = isLit ? '#92400e' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(neuron.label, nx + nw/2, ny + neuronH/2 + 4);

            // Fire indicator
            if (isLit) {
                ctx.font = '10px system-ui';
                ctx.fillText('🔥', nx + nw - 12, ny + 10);
            }

            // Connection line from input to active neurons
            if (isLit && localT > 0.3) {
                ctx.beginPath();
                ctx.moveTo(inputX + 14, inputY + 40);
                ctx.lineTo(nx, ny + neuronH/2);
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });

        // Output: shift vector (right)
        if (t > 0.5) {
            const alpha = Math.min(1, (t - 0.5) / 0.4);
            ctx.globalAlpha = alpha;

            const outX = 680;
            const outY = H/2 - 20;

            // Arrow from neurons to output
            ctx.beginPath();
            ctx.moveTo(neuronEndX + 10, H/2);
            ctx.lineTo(outX - 40, H/2);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(outX - 40, H/2);
            ctx.lineTo(outX - 52, H/2 - 7);
            ctx.lineTo(outX - 52, H/2 + 7);
            ctx.closePath();
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // Output point
            ctx.beginPath();
            ctx.arc(outX, outY + 20, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('Ausgang:', outX, outY - 10);
            ctx.fillText('→ Richtung', outX, outY + 50);
            ctx.fillText('"Paris"', outX, outY + 66);

            ctx.globalAlpha = 1;
        }

        // Counter
        if (t > 0.6) {
            const alpha = Math.min(1, (t - 0.6) / 0.3);
            ctx.globalAlpha = alpha;
            const activeCount = this.neurons.filter(n => n.active).length;
            const totalCount = this.neurons.length;

            ctx.globalAlpha = 1;
        }
    },

    // ========== STEP 3: Full Picture ==========
    renderFull: function(ctx, W, H, t) {
        // Title
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('Gesamtbild: Wie "Paris = Hauptstadt von Frankreich" gespeichert ist', W/2, 30);

        // Three columns
        const colW = W / 3;
        const colY = 60;
        const colH = H - 100;

        // Column 1: Embedding
        const col1X = colW * 0.5;
        this.drawColumn(ctx, col1X, colY, colW - 20, colH, t, 0, {
            icon: '🗺️',
            title: '1. Embedding',
            subtitle: 'Richtung im Raum',
            color: '#3b82f6',
            description: [
                'Frankreich → Paris',
                'Deutschland → Berlin',
                'Gleiche Richtung!',
            ],
            drawContent: function(ctx, x, y, w, h, t) {
                // Mini embedding visualization
                const pairs = [
                    { from: 'FR', to: 'Paris', fy: 0.3, ty: 0.3 },
                    { from: 'DE', to: 'Berlin', fy: 0.5, ty: 0.5 },
                    { from: 'ES', to: 'Madrid', fy: 0.7, ty: 0.7 },
                ];
                const colors = ['#3b82f6', '#10b981', '#f59e0b'];
                
                pairs.forEach((pair, i) => {
                    const localT = Math.max(0, Math.min(1, (t - i * 0.15) / 0.5));
                    if (localT <= 0) return;
                    
                    const fx = x + w * 0.15;
                    const tx = x + w * 0.15 + (w * 0.55) * localT;
                    const py = y + h * pair.fy;
                    
                    // Arrow
                    ctx.beginPath();
                    ctx.moveTo(fx, py);
                    ctx.lineTo(tx, py);
                    ctx.strokeStyle = colors[i];
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                    
                    // Arrowhead
                    if (localT > 0.8) {
                        ctx.beginPath();
                        ctx.moveTo(tx, py);
                        ctx.lineTo(tx - 8, py - 4);
                        ctx.lineTo(tx - 8, py + 4);
                        ctx.closePath();
                        ctx.fillStyle = colors[i];
                        ctx.fill();
                    }
                    
                    // Labels
                    ctx.font = '11px system-ui';
                    ctx.fillStyle = colors[i];
                    ctx.textAlign = 'right';
                    ctx.fillText(pair.from, fx - 4, py + 4);
                    if (localT > 0.8) {
                        ctx.textAlign = 'left';
                        ctx.fillText(pair.to, tx + 6, py + 4);
                    }
                });
            }
        });

        // Column 2: Attention
        const col2X = colW * 1.5;
        this.drawColumn(ctx, col2X, colY, colW - 20, colH, t, 0.2, {
            icon: '👁️',
            title: '2. Attention',
            subtitle: 'Kontext sammeln',
            color: '#8b5cf6',
            description: [
                '"Hauptstadt" + "Frankreich"',
                '→ in einen Vektor gepackt',
                '→ "Was? Von wo?"',
            ],
            drawContent: function(ctx, x, y, w, h, t) {
                // Tokens flowing together
                const tokens = ['Hauptstadt', 'von', 'Frankreich', '___'];
                const tokenY = y + h * 0.2;
                const targetY = y + h * 0.7;
                
                tokens.forEach((tok, i) => {
                    const tx = x + w * (0.15 + i * 0.22);
                    const isTarget = i === 3;
                    const isKey = i === 0 || i === 2;
                    
                    ctx.font = isKey ? 'bold 10px system-ui' : '9px system-ui';
                    ctx.fillStyle = isKey ? '#8b5cf6' : '#94a3b8';
                    ctx.textAlign = 'center';
                    ctx.fillText(tok, tx, tokenY);
                    
                    // Draw attention lines to target
                    if (isKey && t > 0.4) {
                        const lineT = Math.min(1, (t - 0.4) / 0.4);
                        ctx.beginPath();
                        ctx.moveTo(tx, tokenY + 6);
                        ctx.lineTo(tx + (x + w * 0.81 - tx) * lineT, tokenY + 6 + (targetY - tokenY - 12) * lineT);
                        ctx.strokeStyle = '#8b5cf680';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                });
                
                // Result vector
                if (t > 0.7) {
                    const alpha = Math.min(1, (t - 0.7) / 0.3);
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.roundRect(x + w * 0.2, targetY, w * 0.6, 24, 6);
                    ctx.fillStyle = '#f0fdf4';
                    ctx.fill();
                    ctx.strokeStyle = '#34d399';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.font = 'bold 10px system-ui';
                    ctx.fillStyle = '#065f46';
                    ctx.textAlign = 'center';
                    ctx.fillText('Kontext: Hauptstadt+FR', x + w * 0.5, targetY + 15);
                    ctx.globalAlpha = 1;
                }
            }
        });

        // Column 3: FFN
        const col3X = colW * 2.5;
        this.drawColumn(ctx, col3X, colY, colW - 20, colH, t, 0.4, {
            icon: '🔥',
            title: '3. FFN',
            subtitle: 'Neuronen werden stark aktiviert',
            color: '#d97706',
            description: [
                'Muster erkannt!',
                '→ Verschiebung',
                '→ Richtung "Paris"',
            ],
            drawContent: function(ctx, x, y, w, h, t) {
                // Neurons
                const numNeurons = 8;
                const activeIdx = [1, 4, 6];
                const neuronSize = 16;
                const startY = y + h * 0.15;
                
                for (let i = 0; i < numNeurons; i++) {
                    const nx = x + w * (0.15 + (i % 4) * 0.22);
                    const ny = startY + Math.floor(i / 4) * (neuronSize + 12);
                    const isActive = activeIdx.includes(i);
                    const delay = isActive ? 0.3 + activeIdx.indexOf(i) * 0.1 : 0;
                    const localT = Math.max(0, Math.min(1, (t - delay) / 0.3));
                    
                    ctx.beginPath();
                    ctx.arc(nx, ny, neuronSize / 2, 0, Math.PI * 2);
                    if (isActive && localT > 0.5) {
                        ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + localT * 0.7})`;
                    } else {
                        ctx.fillStyle = '#f1f5f9';
                    }
                    ctx.fill();
                    ctx.strokeStyle = isActive && localT > 0.5 ? '#d97706' : '#e2e8f0';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    
                    if (isActive && localT > 0.5) {
                        ctx.font = '8px system-ui';
                        ctx.fillStyle = '#92400e';
                        ctx.textAlign = 'center';
                        ctx.fillText('🔥', nx, ny + 3);
                    }
                }
                
                // Result arrow
                if (t > 0.7) {
                    const alpha = Math.min(1, (t - 0.7) / 0.3);
                    ctx.globalAlpha = alpha;
                    const arrowY = startY + 80;
                    ctx.beginPath();
                    ctx.moveTo(x + w * 0.3, arrowY);
                    ctx.lineTo(x + w * 0.7, arrowY);
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(x + w * 0.7, arrowY);
                    ctx.lineTo(x + w * 0.7 - 10, arrowY - 5);
                    ctx.lineTo(x + w * 0.7 - 10, arrowY + 5);
                    ctx.closePath();
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();
                    
                    ctx.font = 'bold 11px system-ui';
                    ctx.fillStyle = '#ef4444';
                    ctx.textAlign = 'center';
                    ctx.fillText('→ "Paris"', x + w * 0.5, arrowY + 20);
                    ctx.globalAlpha = 1;
                }
            }
        });

        // Bottom summary
        if (t > 0.8) {
            const alpha = Math.min(1, (t - 0.8) / 0.2);
            ctx.globalAlpha = alpha;
            
            const boxY = H - 55;
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.roundRect(40, boxY, W - 80, 45, 10);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#92400e';
            ctx.textAlign = 'center';
            ctx.fillText('💡 Es gibt KEINE Zelle "Paris = Hauptstadt von Frankreich". Das Wissen steckt verteilt in Millionen von Gewichten.', W/2, boxY + 28);
            ctx.globalAlpha = 1;
        }
    },

    // Helper: Draw a column with animation
    drawColumn: function(ctx, centerX, y, w, h, globalT, delay, config) {
        const t = Math.max(0, Math.min(1, (globalT - delay) / (1 - delay)));
        if (t <= 0) return;
        
        const x = centerX - w/2;
        
        // Background
        ctx.globalAlpha = t;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = config.color + '40';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon and title
        ctx.font = '24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(config.icon, centerX, y + 30);
        
        ctx.font = 'bold 13px system-ui';
        ctx.fillStyle = config.color;
        ctx.fillText(config.title, centerX, y + 52);
        
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.fillText(config.subtitle, centerX, y + 68);
        
        // Content area
        if (config.drawContent) {
            config.drawContent(ctx, x + 10, y + 80, w - 20, h * 0.45, t);
        }
        
        // Description
        const descY = y + h * 0.7;
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        config.description.forEach((line, i) => {
            ctx.fillText(line, centerX, descY + i * 16);
        });
        
        ctx.globalAlpha = 1;
    },

    // ========== INITIALIZATION ==========
};

// Initialize when DOM is ready
function initKnowledgeViz() {
    setTimeout(() => {
        KnowledgeViz.init();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKnowledgeViz);
} else {
    initKnowledgeViz();
}

// Handle resize
window.addEventListener('resize', () => {
    if (KnowledgeViz.canvas) {
        KnowledgeViz.init();
    }
});
