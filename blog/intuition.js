const EnergyLab = {
    animationFrame: null,
    isRolling: false,
    
    // Current state of the "Ball" (The Model Parameters)
    ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0 },
    
    // Configuration
    config: {
        minX: -2, maxX: 2,
        minY: -2, maxY: 2,
        gridSize: 0.1
    },

    init: function() {
        this.renderLandscape();
        this.resetBall();
        
        // Attach listeners
        document.getElementById('energy-lr').addEventListener('input', (e) => {
            document.getElementById('lr-display').innerText = e.target.value;
        });
        document.getElementById('energy-temp').addEventListener('input', (e) => {
            document.getElementById('temp-display').innerText = e.target.value;
        });
    },

    // The "Energy Function" (Loss Landscape)
    // A non-convex function with global and local minima
    // Z = Loss
    calculateLoss: function(x, y) {
        // A mix of Gaussians and Sines to create valleys
        const term1 = Math.sin(3 * x) * Math.cos(3 * y) * 0.5; // Ripples
        const term2 = 0.5 * (x * x + y * y); // Global Bowl shape (Convex)
        return term1 + term2 + 2; // +2 to keep it above zero
    },

    // Calculate Gradient (Slope) at current position
    // We use numerical differentiation approximation
    calculateGradient: function(x, y) {
        const h = 0.01; // Small step
        const z = this.calculateLoss(x, y);
        const dzdx = (this.calculateLoss(x + h, y) - z) / h;
        const dzdy = (this.calculateLoss(x, y + h) - z) / h;
        return { dx: dzdx, dy: dzdy };
    },

    renderLandscape: function() {
        const x = [];
        const y = [];
        const z = [];

        // Generate Grid Data
        for (let i = this.config.minX; i <= this.config.maxX; i += this.config.gridSize) {
            const rowX = [];
            const rowY = [];
            const rowZ = [];
            for (let j = this.config.minY; j <= this.config.maxY; j += this.config.gridSize) {
                rowX.push(i);
                rowY.push(j);
                rowZ.push(this.calculateLoss(i, j));
            }
            x.push(rowX);
            y.push(rowY);
            z.push(rowZ);
        }

        const surfaceTrace = {
            z: z, x: x, y: y,
            type: 'surface',
            colorscale: 'Viridis',
            opacity: 0.8,
            showscale: false,
            contours: {
                z: { show: true, usecolormap: true, project: { z: true } }
            },
            name: 'Energy Surface'
        };

        // Ball Trace (Initial placeholder)
        const ballTrace = {
            x: [0], y: [0], z: [10],
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 10, color: '#ef4444', symbol: 'circle' },
            name: 'Model State'
        };

        const layout = {
            title: 'Loss Landscape (Energy Function)',
            scene: {
                xaxis: { title: 'Parameter θ1' },
                yaxis: { title: 'Parameter θ2' },
                zaxis: { title: 'Loss / Energy' },
                camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
            },
            margin: { l: 0, r: 0, b: 0, t: 50 }
        };

        Plotly.newPlot('energy-plot', [surfaceTrace, ballTrace], layout);
    },

    resetBall: function() {
        // Stop existing animation
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

        // Start at a random high point (High Energy / Bad Initialization)
        // We pick a spot away from the center (0,0 is usually the minimum in our function)
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.8; // Edge of the map
        
        this.ball.x = Math.cos(angle) * radius;
        this.ball.y = Math.sin(angle) * radius;
        this.ball.z = this.calculateLoss(this.ball.x, this.ball.y);
        this.ball.vx = 0;
        this.ball.vy = 0;

        this.isRolling = true;
        this.animate();
    },

    animate: function() {
        if (!this.isRolling) return;

        const lr = parseFloat(document.getElementById('energy-lr').value);
        const temp = parseFloat(document.getElementById('energy-temp').value);
        const readout = document.getElementById('status-readout');

        // 1. Calculate Gradient (The Slope)
        const grad = this.calculateGradient(this.ball.x, this.ball.y);

        // 2. Apply "Physics" (Gradient Descent with Momentum-like visual)
        // In pure SGD, we just teleport: x = x - lr * grad
        // To make it look like a rolling ball, we add velocity
        
        // Add noise (Temperature / Stochasticity)
        const noiseX = (Math.random() - 0.5) * temp * 0.1;
        const noiseY = (Math.random() - 0.5) * temp * 0.1;

        // Update Position (Gradient Descent Step)
        // We invert the gradient because we want to go DOWN
        const stepX = -(grad.dx * lr) + noiseX;
        const stepY = -(grad.dy * lr) + noiseY;

        this.ball.x += stepX;
        this.ball.y += stepY;

        // Boundary Checks
        if(Math.abs(this.ball.x) > 2) this.ball.x = Math.sign(this.ball.x) * 2;
        if(Math.abs(this.ball.y) > 2) this.ball.y = Math.sign(this.ball.y) * 2;

        // Update Z height
        this.ball.z = this.calculateLoss(this.ball.x, this.ball.y);

        // Update Text
        const energy = this.ball.z.toFixed(4);
        const gradMag = Math.sqrt(grad.dx**2 + grad.dy**2).toFixed(4);
        readout.innerHTML = `Current Energy (Loss): <strong>${energy}</strong> | Gradient Steepness: ${gradMag}`;

        // Stop if we hit a minimum (Gradient is near zero)
        if (Math.sqrt(grad.dx**2 + grad.dy**2) < 0.01 && temp === 0) {
           readout.innerHTML += " <span style='color:green'>[CONVERGED]</span>";
           // We keep animating to keep the plot responsive, but motion stops effectively
        }

        // 3. Update Plotly (Efficiently using animate)
        Plotly.animate('energy-plot', {
            data: [{ x: [this.ball.x], y: [this.ball.y], z: [this.ball.z] }],
            traces: [1] // Update only the ball trace
        }, {
            transition: { duration: 0 },
            frame: { duration: 0, redraw: false }
        });

        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    }
};

// Initialize when DOM is ready
window.addEventListener('load', () => {
    setTimeout(() => EnergyLab.init(), 500);
});
