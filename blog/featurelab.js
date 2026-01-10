window.FeatureLab = {
    // Definition der drei spezialisierten Filter
    filterSpecs: [
        { 
            name: "Horizontaler Detektor", 
            kernel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], 
            color: "#3b82f6" 
        },
        { 
            name: "Vertikaler Detektor", 
            kernel: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], 
            color: "#10b981" 
        },
        { 
            name: "45° Diagonal (links-oben)", 
            kernel: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], 
            color: "#f59e0b" 
        }
    ],

    init: function() {
        this.container = document.getElementById('feature-maps-container');
        this.setupCanvases();
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "example.jpg"; // Deine Bildquelle
        img.onload = () => {
            const ctx = document.getElementById('feat-src').getContext('2d');
            ctx.drawImage(img, 0, 0, 100, 100);
            this.run();
        };
    },

    setupCanvases: function() {
        this.container.innerHTML = "";
        this.filterSpecs.forEach((spec, index) => {
            const wrapper = document.createElement('div');
            wrapper.style = "text-align: center; border: 1px solid #eee; padding: 10px; border-radius: 8px;";
            wrapper.innerHTML = `
                <strong style="color: ${spec.color}; display:block; margin-bottom: 5px;">${spec.name}</strong>
                <div style="font-family: monospace; font-size: 0.7rem; margin-bottom: 10px; background: #f1f5f9; padding: 5px;">
                    ${spec.kernel[0].join(' ')}<br>${spec.kernel[1].join(' ')}<br>${spec.kernel[2].join(' ')}
                </div>
                <canvas id="res-canvas-${index}" width="100" height="100" style="width:100%; border: 2px solid ${spec.color}; image-rendering: pixelated;"></canvas>
            `;
            this.container.appendChild(wrapper);
        });
    },

    run: async function() {
        const srcCanvas = document.getElementById('feat-src');
        
        try {
            tf.tidy(() => {
                // 1. Eingabebild vorbereiten [1, H, W, 1]
                const input = tf.browser.fromPixels(srcCanvas)
                    .mean(2)
                    .expandDims(-1)
                    .expandDims(0)
                    .toFloat();

                // 2. Jeden Filter einzeln anwenden und visualisieren
                this.filterSpecs.forEach((spec, index) => {
                    const resCanvas = document.getElementById(`res-canvas-${index}`);
                    
                    // Kernel konvertieren zu [H, W, In_Channels, Out_Channels]
                    const kernel = tf.tensor2d(spec.kernel, [3, 3])
                        .expandDims(-1)
                        .expandDims(-1);
                    
                    // Faltung (Convolution)
                    let conv = tf.conv2d(input, kernel, 1, 'same').squeeze();
                    
                    // Normalisierung für die Darstellung (0 bis 1)
                    const min = conv.min();
                    const max = conv.max();
                    const normalized = conv.sub(min).div(max.sub(min).add(0.00001));
                    
                    tf.browser.toPixels(normalized, resCanvas);
                });
            });
        } catch (e) {
            console.error("TFJS Multi-Filter Error:", e);
        }
    }
};

if (document.readyState === 'complete') { FeatureLab.init(); } 
else { window.addEventListener('load', () => FeatureLab.init()); }
