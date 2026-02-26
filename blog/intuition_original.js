/**
 * Action Plan:
 * 1. Default isRolling to false to prevent auto-start.
 * 2. Calculate ball.z in resetBall before the first render to fix the "floating" issue.
 * 3. Use Plotly.restyle specifically for the marker trace to prevent scene redraws.
 * 4. Ensure uirevision is a persistent string in the layout to allow manual rotation.
 */

const EnergyLab = {
	animationFrame: null,
	isRolling: false,
	hasRendered: false, // Track if Plotly has initialized

	ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0 },

	config: {
		minX: -2, maxX: 2,
		minY: -2, maxY: 2,
		gridStep: 0.1,
		friction: 0.9,
		uiRevision: 'interaction-friendly-key'
	},

	init: function() {
		// Setup UI listeners (Non-intensive)
		const ids = ['energy-lr', 'energy-temp'];
		ids.forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.addEventListener('input', () => {
					const display = document.getElementById(id === 'energy-lr' ? 'lr-display' : 'temp-display');
					if (display) display.innerText = parseFloat(el.value).toFixed(id === 'energy-lr' ? 3 : 2);
				});
			}
		});

		// Start observing the plot container
		this.setupObserver();

		const btn = document.getElementById('toggle-roll');
		if (btn) btn.innerText = "Start Animation";
	},

	setupObserver: function() {
		const target = document.getElementById('energy-plot');
		if (!target) return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					// 1. Initial Render if it hasn't happened yet
					if (!this.hasRendered) {
						this.renderLandscape();
						this.resetBall();
						this.hasRendered = true;
					}
					// 2. Resume animation if it was previously rolling
					if (this.isRolling && !this.animationFrame) {
						this.simulationLoop();
					}
				} else {
					// 3. Pause loop when out of view to save resources
					if (this.animationFrame) {
						cancelAnimationFrame(this.animationFrame);
						this.animationFrame = null;
					}
				}
			});
		}, { threshold: 0.1 }); // Trigger when 10% of the plot is visible

		observer.observe(target);
	},

	lossFunction: function(x, y) {
		// A standard non-convex landscape (Ackley-ish / Rippled Bowl)
		const global_bowl = 0.5 * (x*x + y*y); 
		const ripples = -0.8 * Math.cos(3 * x) * Math.cos(3 * y);
		return global_bowl + ripples + 2;
	},

	calculateGradient: function(x, y) {
		const h = 0.001; // Smaller step for precision
		const z = this.lossFunction(x, y);
		const dx = (this.lossFunction(x + h, y) - z) / h;
		const dy = (this.lossFunction(x, y + h) - z) / h;
		return { dx, dy };
	},

	toggle: function() {
		this.isRolling = !this.isRolling;
		const btn = document.getElementById('toggle-roll');
		if (btn) btn.innerText = this.isRolling ? "Pause Animation" : "Resume Animation";

		if (this.isRolling) {
			this.simulationLoop(); 
		} else {
			if (this.animationFrame) {
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = null;
			}
		}
	},

	renderLandscape: function() {
		const axis = [];
		for (let i = this.config.minX; i <= this.config.maxX; i += this.config.gridStep) {
			axis.push(i);
		}

		const zvals = axis.map(y => axis.map(x => this.lossFunction(x, y)));

		const surface = {
			z: zvals, x: axis, y: axis,
			type: 'surface',
			colorscale: 'Viridis',
			opacity: 0.8,
			showscale: false,
			contours: {
				z: { show: true, usecolormap: true, project: { z: true } }
			}
		};

		const ball = {
			x: [0], y: [0], z: [0],
			mode: 'markers',
			type: 'scatter3d',
			marker: { 
				size: 10, 
				color: '#ef4444', 
				line: { color: '#ffffff', width: 2 } 
			},
			name: 'State'
		};

		const layout = {
			margin: { l: 0, r: 0, b: 0, t: 0 },
			scene: {
				xaxis: { visible: false },
				yaxis: { visible: false },
				zaxis: { title: 'Loss', range: [0, 6] },
				camera: { eye: { x: 1.8, y: 1.8, z: 1.5 } }
			},
			uirevision: this.config.uiRevision,
			showlegend: false
		};

		Plotly.newPlot('energy-plot', [surface, ball], layout, { responsive: true, displayModeBar: false });
	},

	resetBall: function() {
		// Random starting position on the perimeter
		const angle = Math.random() * Math.PI * 2;
		this.ball.x = Math.cos(angle) * 1.6;
		this.ball.y = Math.sin(angle) * 1.6;
		this.ball.vx = 0;
		this.ball.vy = 0;

		// FIX: Calculate Z immediately so the "Drop" doesn't start at Z=0
		this.ball.z = this.lossFunction(this.ball.x, this.ball.y) + 0.2;

		this.updatePlot();
	},

	simulationLoop: function() {
		// Added safety check for visibility
		if (!this.isRolling) return;

		const lr = parseFloat(document.getElementById('energy-lr')?.value || 0.02);
		const temp = parseFloat(document.getElementById('energy-temp')?.value || 0);

		const grad = this.calculateGradient(this.ball.x, this.ball.y);

		this.ball.vx -= grad.dx * lr;
		this.ball.vy -= grad.dy * lr;

		if (temp > 0) {
			this.ball.vx += (Math.random() - 0.5) * temp * 0.1;
			this.ball.vy += (Math.random() - 0.5) * temp * 0.1;
		}

		this.ball.x += this.ball.vx;
		this.ball.y += this.ball.vy;
		this.ball.vx *= this.config.friction;
		this.ball.vy *= this.config.friction;

		if (Math.abs(this.ball.x) > 2) { this.ball.x = Math.sign(this.ball.x) * 2; this.ball.vx *= -0.5; }
		if (Math.abs(this.ball.y) > 2) { this.ball.y = Math.sign(this.ball.y) * 2; this.ball.vy *= -0.5; }

		this.ball.z = this.lossFunction(this.ball.x, this.ball.y) + 0.2;

		const readout = document.getElementById('status-readout');
		if (readout) readout.innerHTML = `Loss: <strong>${(this.ball.z - 0.2).toFixed(4)}</strong>`;

		this.updatePlot();
		this.animationFrame = requestAnimationFrame(() => this.simulationLoop());
	},

	updatePlot: function() {
		Plotly.restyle('energy-plot', {
			x: [[this.ball.x]],
			y: [[this.ball.y]],
			z: [[this.ball.z]]
		}, [1]);
	}
};

async function loadIntuitionModule() {
	updateLoadingStatus("Loading section about Intuition...");
	EnergyLab.init();
	return Promise.resolve();
}
