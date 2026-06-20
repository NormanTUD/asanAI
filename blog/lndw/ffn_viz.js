// ============================================================
// STEP 4b: FFN VISUALIZER
// ============================================================

const FFNViz = {
    scenarios: {
        apple_fruit: {
            desc: "Because the context is 'eating', the FFN detects the <b>Food</b> and <b>Nature</b> patterns. It zeroes out the Tech pattern. It then adds fruit-related vocabulary concepts to the residual stream.",
            detectors: [
                { id: 'd1', label: 'Tech Company?', active: false },
                { id: 'd2', label: 'Edible Fruit?', active: true },
                { id: 'd3', label: 'Nature/Tree?', active: true }
            ],
            facts: [
                { id: 'f1', label: 'Add: "Juice", "Pie"', active: true, from: ['d2'] },
                { id: 'f2', label: 'Add: "Mac", "Phone"', active: false, from: [] },
                { id: 'f3', label: 'Add: "Orchard", "Green"', active: true, from: ['d3'] }
            ]
        },
        apple_tech: {
            desc: "Because the context is 'buying', the FFN detects the <b>Tech Company</b> pattern. The fruit patterns remain dormant. It retrieves hardware-related knowledge to predict the next word.",
            detectors: [
                { id: 'd1', label: 'Tech Company?', active: true },
                { id: 'd2', label: 'Edible Fruit?', active: false },
                { id: 'd3', label: 'Nature/Tree?', active: false }
            ],
            facts: [
                { id: 'f1', label: 'Add: "Juice", "Pie"', active: false, from: [] },
                { id: 'f2', label: 'Add: "Mac", "Phone"', active: true, from: ['d1'] },
                { id: 'f3', label: 'Add: "Orchard", "Green"', active: false, from: [] }
            ]
        }
    },

    currentScenario: null,

    setScenario: function(scenarioKey) {
        this.currentScenario = scenarioKey;
        
        // Update Buttons
        document.getElementById('btn-ffn-fruit').style.background = scenarioKey === 'apple_fruit' ? '#fee2e2' : '#fff';
        document.getElementById('btn-ffn-fruit').style.borderColor = scenarioKey === 'apple_fruit' ? '#ef4444' : '#cbd5e1';
        
        document.getElementById('btn-ffn-tech').style.background = scenarioKey === 'apple_tech' ? '#e0e7ff' : '#fff';
        document.getElementById('btn-ffn-tech').style.borderColor = scenarioKey === 'apple_tech' ? '#6366f1' : '#cbd5e1';

        this.render();
    },

    render: function() {
        if (!this.currentScenario) return;
        const data = this.scenarios[this.currentScenario];

        // 1. Render Detectors
        const detContainer = document.getElementById('ffn-detectors');
        detContainer.innerHTML = data.detectors.map(d => `
            <div id="node-${d.id}" style="
                padding: 10px; border-radius: 8px; font-size: 0.85em; font-weight: bold; transition: all 0.4s ease;
                background: ${d.active ? '#fef3c7' : '#f1f5f9'};
                border: 2px solid ${d.active ? '#f59e0b' : '#cbd5e1'};
                color: ${d.active ? '#92400e' : '#94a3b8'};
                box-shadow: ${d.active ? '0 0 10px rgba(245,158,11,0.4)' : 'none'};
            ">
                ${d.label}<br>
                <span style="font-size: 0.8em; color: ${d.active ? '#d97706' : '#cbd5e1'};">
                    ${d.active ? '🔥 FIRES' : '❌ ZEROED (ReLU)'}
                </span>
            </div>
        `).join('');

        // 2. Render Facts
        const factsContainer = document.getElementById('ffn-facts');
        factsContainer.innerHTML = data.facts.map(f => `
            <div id="node-${f.id}" style="
                padding: 10px; border-radius: 8px; font-size: 0.85em; font-weight: bold; transition: all 0.4s ease;
                background: ${f.active ? '#dcfce7' : '#f1f5f9'};
                border: 2px solid ${f.active ? '#10b981' : '#cbd5e1'};
                color: ${f.active ? '#065f46' : '#94a3b8'};
            ">
                ${f.label}
            </div>
        `).join('');

        // 3. Update Explanation
        document.getElementById('ffn-explanation').innerHTML = data.desc;

        // 4. Draw Lines (Wait a tiny bit for DOM to position elements)
        setTimeout(() => this.drawLines(data), 50);
    },

    drawLines: function(data) {
        const svg = document.getElementById('ffn-lines');
        const container = document.getElementById('ffn-viz-container').getBoundingClientRect();
        svg.innerHTML = '';

        const drawCurve = (el1, el2, active) => {
            if (!el1 || !el2) return;
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();

            // Calculate positions relative to container
            const x1 = rect1.right - container.left;
            const y1 = rect1.top + (rect1.height / 2) - container.top;
            const x2 = rect2.left - container.left;
            const y2 = rect2.top + (rect2.height / 2) - container.top;

            // Bezier curve control points
            const cx1 = x1 + 40;
            const cx2 = x2 - 40;

            const color = active ? '#f59e0b' : '#e2e8f0';
            const width = active ? 3 : 1;
            const dash = active ? '' : 'stroke-dasharray="4 4"';

            svg.innerHTML += `<path d="M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}" 
                                stroke="${color}" stroke-width="${width}" fill="transparent" ${dash} 
                                style="transition: all 0.4s ease;"/>`;
        };

        const inputBox = document.getElementById('ffn-input-box');
        const outputBox = document.getElementById('ffn-output-box');

        // Input -> Detectors
        data.detectors.forEach(d => {
            const detNode = document.getElementById(`node-${d.id}`);
            drawCurve(inputBox, detNode, d.active);
        });

        // Detectors -> Facts
        data.facts.forEach(f => {
            const factNode = document.getElementById(`node-${f.id}`);
            f.from.forEach(sourceId => {
                const sourceNode = document.getElementById(`node-${sourceId}`);
                drawCurve(sourceNode, factNode, true);
            });
            // If fact is inactive, just draw a faint line from a random inactive detector for visual completeness
            if (!f.active) {
                const inactiveDet = document.getElementById(`node-d2`); // arbitrary
                drawCurve(inactiveDet, factNode, false);
            }
            
            // Facts -> Output
            drawCurve(factNode, outputBox, f.active);
        });
    }
};


