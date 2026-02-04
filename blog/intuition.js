/**
 * Energy Landscape Visualization
 * * Technical Note: 
 * We use a "momentum-based" update to simulate the physics of a rolling ball.
 * Standard Gradient Descent (SGD) is massless (teleportation), but to make it 
 * intuitive for the user, we give the ball 'velocity'.
 */
const EnergyLab = {
    animationFrame: null,
    isRolling: false,
    
    // The "Ball" State
    ball: { 
        x: 0, 
        y: 0, 
        z: 0, 
        vx: 0, // Velocity X
        vy: 0  // Velocity Y
    },
    
    config: {
        minX: -2, maxX: 2,
        minY: -2, maxY: 2,
        gridStep: 0.1,
        friction: 0.9 // Damping factor so the ball eventually stops
    },

    init: function() {
        this.renderLandscape();
        
        // UI Listeners
        document.getElementById('energy-lr').addEventListener('input', (e) => {
            document.getElementById('lr-display').innerText = parseFloat(e.target.value).toFixed(3);
        });
        document.getElementById('energy-temp').addEventListener('input', (e) => {
            document.getElementById('temp-display').innerText = parseFloat(e.target.value).toFixed(2);
        });
        
        // Auto-start
        setTimeout(() => this.resetBall(), 500);
    },

    // The Energy Function (Loss Landscape)
    // Z = The "Surprise" of the model.
    lossFunction: function(x, y) {
        // A global bowl (convex) to pull everything to center
        const global_bowl = 0.5 * (x*x + y*y); 
        
        // A "ripple" function to create local minima (traps)
        // cos(3x) * sin(3y) creates peaks and valleys
        const ripples = -0.8 * Math.cos(3 * x) * Math.cos(3 * y);
        
        return global_bowl + ripples + 2; // +2 to ensure Z > 0
    },

    // Gradient Calculation (The Slope)
    calculateGradient: function(x, y) {
        const h = 0.01; // Numerical step size
        const z = this.lossFunction(x, y);
        
        // Slope in X direction
        const dz_dx = (this.lossFunction(x + h, y) - z) / h;
        // Slope in Y direction
        const dz_dy = (this.lossFunction(x, y + h) - z) / h;
        
        return { dx: dz_dx, dy: dz_dy };
    },

    renderLandscape: function() {
        const xvals = [];
        const yvals = [];
        const zvals = [];

        // Generate Grid
        for (let x = this.config.minX; x <= this.config.maxX; x += this.config.gridStep) {
            const rowX = [];
            const rowY = [];
            const rowZ = [];
            for (let y = this.config.minY; y <= this.config.maxY; y += this.config.gridStep) {
                rowX.push(x);
                rowY.push(y);
                rowZ.push(this.lossFunction(x, y));
            }
            xvals.push(rowX);
            yvals.push(rowY);
            zvals.push(rowZ);
        }

        const surface = {
            z: zvals, x: xvals, y: yvals,
            type: 'surface',
            colorscale: 'Viridis',
            opacity: 0.85,
            showscale: false,
            contours: {
                z: { show: true, usecolormap: true, project: { z: true } }
            },
            hoverinfo: 'none'
        };

        const ball = {
            x: [0], y: [0], z: [0],
            mode: 'markers',
            type: 'scatter3d',
            marker: { 
                size: 6, 
                color: '#ef4444', 
                symbol: 'circle',
                line: { color: 'white', width: 2 } 
            },
            name: 'Model State'
        };

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: '', showgrid: false, zeroline: false, showticklabels: false },
                yaxis: { title: '', showgrid: false, zeroline: false, showticklabels: false },
                zaxis: { title: 'Loss (Energy)', showgrid: true },
                camera: { eye: { x: 1.4, y: 1.4, z: 1.2 } }
            },
            showlegend: false
        };

        Plotly.newPlot('energy-plot', [surface, ball], layout, {displayModeBar: false});
    },

    resetBall: function() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

        // 1. Pick a random high spot on the rim
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.8;
        
        this.ball.x = Math.cos(angle) * radius;
        this.ball.y = Math.sin(angle) * radius;
        this.ball.z = this.lossFunction(this.ball.x, this.ball.y) + 0.2; // Drop slightly above surface
        
        // 2. Reset Velocity
        this.ball.vx = 0;
        this.ball.vy = 0;

        // 3. Update Visuals Immediately
        this.updatePlot();

        // 4. Start Loop
        this.isRolling = true;
        this.simulationLoop();
    },

    simulationLoop: function() {
        if (!this.isRolling) return;

        const lr = parseFloat(document.getElementById('energy-lr').value);
        const temp = parseFloat(document.getElementById('energy-temp').value);
        const readout = document.getElementById('status-readout');

        // --- PHYSICS ENGINE ---

        // 1. Get Slope (Force)
        const grad = this.calculateGradient(this.ball.x, this.ball.y);

        // 2. Add Force to Velocity (Acceleration)
        // Note: We go opposite to gradient (Downhill)
        this.ball.vx -= grad.dx * lr;
        this.ball.vy -= grad.dy * lr;

        // 3. Add Thermal Noise (Brownian Motion) to Velocity
        // This is the "Jitter"
        if (temp > 0) {
            this.ball.vx += (Math.random() - 0.5) * temp * 0.05;
            this.ball.vy += (Math.random() - 0.5) * temp * 0.05;
        }

        // 4. Apply Velocity to Position
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // 5. Apply Friction (Damping)
        // Without this, the ball would oscillate forever like a pendulum
        this.ball.vx *= this.config.friction;
        this.ball.vy *= this.config.friction;

        // 6. Boundary Constraints (Bouncing off walls)
        if (Math.abs(this.ball.x) > 2) {
            this.ball.x = Math.sign(this.ball.x) * 2;
            this.ball.vx *= -0.5; // Bounce back with energy loss
        }
        if (Math.abs(this.ball.y) > 2) {
            this.ball.y = Math.sign(this.ball.y) * 2;
            this.ball.vy *= -0.5;
        }

        // 7. Snap Z to Surface (plus a tiny offset so it sits "on top")
        this.ball.z = this.lossFunction(this.ball.x, this.ball.y) + 0.1;

        // --- RENDER UPDATES ---

        const speed = Math.sqrt(this.ball.vx**2 + this.ball.vy**2);
        
        // Visual Status
        let status = `Energy: <strong>${(this.ball.z-0.1).toFixed(3)}</strong> | Speed: ${speed.toFixed(3)}`;
        if (speed < 0.005 && temp === 0) {
            status += " <span style='color:green; font-weight:bold;'>[STABLE]</span>";
        }
        readout.innerHTML = status;

        this.updatePlot();

        this.animationFrame = requestAnimationFrame(() => this.simulationLoop());
    },

    updatePlot: function() {
        // Use Plotly.restyle for high-performance updates of a single trace
        // Trace index 1 is the ball
        Plotly.restyle('energy-plot', {
            x: [[this.ball.x]],
            y: [[this.ball.y]],
            z: [[this.ball.z]]
        }, [1]);
    }
};

window.addEventListener('load', () => {
    // Small delay to ensure container is rendered
    setTimeout(() => EnergyLab.init(), 300);
});
