/**
 * Action Plan:
 * 1. Update resetBall to calculate the Z-coordinate immediately to prevent "floating" balls.
 * 2. Refine updatePlot to use a more stable restyle approach.
 * 3. Ensure the simulation loop maintains the uirevision key consistently.
 */
const EnergyLab = {
    animationFrame: null,
    isRolling: true,
    
    ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0 },
    
    config: {
        minX: -2, maxX: 2,
        minY: -2, maxY: 2,
        gridStep: 0.1,
        friction: 0.9,
        uiRevision: 'energy-landscape-v1' 
    },

    init: function() {
        this.renderLandscape();
        
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

        setTimeout(() => this.resetBall(), 500);
    },

    lossFunction: function(x, y) {
        const global_bowl = 0.5 * (x*x + y*y); 
        const ripples = -0.8 * Math.cos(3 * x) * Math.cos(3 * y);
        return global_bowl + ripples + 2;
    },

    calculateGradient: function(x, y) {
        const h = 0.01;
        const z = this.lossFunction(x, y);
        const dz_dx = (this.lossFunction(x + h, y) - z) / h;
        const dz_dy = (this.lossFunction(x, y + h) - z) / h;
        return { dx: dz_dx, dy: dz_dy };
    },

    toggle: function() {
        this.isRolling = !this.isRolling;
        const btn = document.getElementById('toggle-roll');
        if (btn) btn.innerText = this.isRolling ? "Pause Animation" : "Resume Animation";
        
        if (this.isRolling) {
            this.simulationLoop(); 
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
            opacity: 0.85,
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
                size: 8, 
                color: '#ef4444', 
                line: { color: '#000', width: 2 } 
            },
            name: 'Model State'
        };

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { visible: false },
                yaxis: { visible: false },
                zaxis: { title: 'Loss', range: [0, 5] },
                camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
            },
            uirevision: this.config.uiRevision,
            showlegend: false
        };

        Plotly.newPlot('energy-plot', [surface, ball], layout, {displayModeBar: false});
    },

    resetBall: function() {
        const angle = Math.random() * Math.PI * 2;
        // Keep within bounds of the landscape (-2 to 2)
        this.ball.x = Math.cos(angle) * 1.7;
        this.ball.y = Math.sin(angle) * 1.7;
        this.ball.vx = 0;
        this.ball.vy = 0;
        
        // Fix: Immediately calculate Z so it doesn't drop at Z=0
        this.ball.z = this.lossFunction(this.ball.x, this.ball.y) + 0.1;
        
        this.updatePlot();
        
        if (this.isRolling && !this.animationFrame) {
            this.simulationLoop();
        }
    },

    simulationLoop: function() {
        if (!this.isRolling) {
            this.animationFrame = null;
            return; 
        }

        const lr = parseFloat(document.getElementById('energy-lr')?.value || 0.02);
        const temp = parseFloat(document.getElementById('energy-temp')?.value || 0);
        
        const grad = this.calculateGradient(this.ball.x, this.ball.y);

        this.ball.vx -= grad.dx * lr;
        this.ball.vy -= grad.dy * lr;

        if (temp > 0) {
            this.ball.vx += (Math.random() - 0.5) * temp * 0.05;
            this.ball.vy += (Math.random() - 0.5) * temp * 0.05;
        }

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vx *= this.config.friction;
        this.ball.vy *= this.config.friction;

        // Bounce constraints
        if (Math.abs(this.ball.x) > 2) { this.ball.x = Math.sign(this.ball.x) * 2; this.ball.vx *= -0.5; }
        if (Math.abs(this.ball.y) > 2) { this.ball.y = Math.sign(this.ball.y) * 2; this.ball.vy *= -0.5; }

        this.ball.z = this.lossFunction(this.ball.x, this.ball.y) + 0.1;

        const readout = document.getElementById('status-readout');
        if (readout) {
            readout.innerHTML = `Energy: <strong>${(this.ball.z-0.1).toFixed(3)}</strong>`;
        }

        this.updatePlot();
        this.animationFrame = requestAnimationFrame(() => this.simulationLoop());
    },

    updatePlot: function() {
        // Trace 1 is the ball. 
        // We ensure uirevision is set in the update call to strictly forbid camera resets.
        Plotly.update('energy-plot', {
            x: [[this.ball.x]],
            y: [[this.ball.y]],
            z: [[this.ball.z]]
        }, {
            uirevision: this.config.uiRevision
        }, [1]);
    }
};

window.addEventListener('load', () => EnergyLab.init());
