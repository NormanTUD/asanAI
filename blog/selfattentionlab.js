const VisualAttentionLab = {
    // EXPLICIT DATASET: No calculations, just fixed logical relationships
    data: {
        tokens: ["The", "hunter", "sees", "the", "bear"],
        matrix: [
            [0.10, 0.80, 0.05, 0.00, 0.05], // "The" -> focus on "hunter"
            [0.05, 0.70, 0.20, 0.00, 0.05], // "hunter" -> focus on self/sees
            [0.00, 0.40, 0.20, 0.00, 0.40], // "sees" -> focus on "hunter" and "bear"
            [0.00, 0.05, 0.05, 0.10, 0.80], // "the" -> focus on "bear"
            [0.00, 0.05, 0.40, 0.05, 0.50]  // "bear" -> focus on "sees"
        ]
    },
    hoverIndex: null,

    init: function() {
        this.renderTokens();
        this.drawTable();
        
        // Handle window resizing for the canvas
        window.addEventListener('resize', () => this.drawWeb());
        
        // Initial draw
        this.drawWeb();
    },

    renderTokens: function() {
        const container = document.getElementById('token-stream');
        container.innerHTML = this.data.tokens.map((word, i) => `
            <div class="token-block" 
                 onmouseover="VisualAttentionLab.hoverIndex=${i}; VisualAttentionLab.drawWeb();" 
                 onmouseout="VisualAttentionLab.hoverIndex=null; VisualAttentionLab.drawWeb();">
                ${word}
            </div>
        `).join('');
    },

    drawWeb: function() {
        const canvas = document.getElementById('attn-canvas');
        const container = document.getElementById('attention-container');
        const chips = document.querySelectorAll('.token-block');
        if (!canvas || chips.length === 0) return;

        const ctx = canvas.getContext('2d');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const containerRect = container.getBoundingClientRect();
        const tokens = this.data.tokens;
        const matrix = this.data.matrix;

        tokens.forEach((_, i) => {
            tokens.forEach((_, j) => {
                if (i === j) return; // Don't draw self-loops as arcs for clarity
                
                const strength = matrix[i][j];
                if (strength < 0.05) return; // Only draw significant relations

                const chip1 = chips[i].getBoundingClientRect();
                const chip2 = chips[j].getBoundingClientRect();

                const x1 = (chip1.left + chip1.width / 2) - containerRect.left;
                const x2 = (chip2.left + chip2.width / 2) - containerRect.left;
                const baseY = (chip1.top - containerRect.top);

                const active = (this.hoverIndex === i);
                const distance = Math.abs(x2 - x1);
                const arcHeight = Math.min(20 + distance * 0.4, 100);

                // Styling
                ctx.beginPath();
                ctx.lineWidth = active ? (1 + strength * 15) : (1 + strength * 3);
                ctx.strokeStyle = active ? `rgba(37, 99, 235, ${0.2 + strength})` : `rgba(148, 163, 184, 0.1)`;
                
                // Draw Bezier Curve
                ctx.moveTo(x1, baseY);
                ctx.bezierCurveTo(x1, baseY - arcHeight, x2, baseY - arcHeight, x2, baseY);
                ctx.stroke();

                // Draw percentage label if active
                if (active && strength > 0.1) {
                    ctx.font = "bold 12px sans-serif";
                    const label = (strength * 100).toFixed(0) + "%";
                    const labelX = (x1 + x2) / 2;
                    const labelY = baseY - arcHeight * 0.8;
                    
                    // Label Background
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillStyle = "white";
                    ctx.fillRect(labelX - textWidth/2 - 4, labelY - 12, textWidth + 8, 16);
                    ctx.strokeStyle = "#2563eb";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(labelX - textWidth/2 - 4, labelY - 12, textWidth + 8, 16);
                    
                    // Label Text
                    ctx.fillStyle = "#2563eb";
                    ctx.fillText(label, labelX - textWidth/2, labelY);
                }
            });
        });
    },

    drawTable: function() {
        const { tokens, matrix } = this.data;
        let html = '<table class="attn-table"><tr><th></th>';
        tokens.forEach(w => html += `<th>${w}</th>`);
        html += '</tr>';

        tokens.forEach((w, i) => {
            html += `<tr><td class="row-label">${w}</td>`;
            matrix[i].forEach(val => {
                // Background color logic: low = white, high = blue
                const color = `rgba(37, 99, 235, ${val})`;
                const textColor = val > 0.4 ? 'white' : '#1e293b';
                html += `<td style="background:${color}; color:${textColor}">${(val * 100).toFixed(0)}%</td>`;
            });
            html += '</tr>';
        });
        document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
    }
};

// Start the lab
document.addEventListener('DOMContentLoaded', () => VisualAttentionLab.init());
