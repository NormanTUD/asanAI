// Renamed to SelfAttentionLab to avoid generic naming conflicts
const SelfAttentionLab = {
    data: {
        tokens: ["The", "hunter", "sees", "the", "bear"],
        matrix: [
            [0.10, 0.85, 0.05, 0.00, 0.00], 
            [0.10, 0.60, 0.25, 0.00, 0.05], 
            [0.00, 0.45, 0.10, 0.00, 0.45], 
            [0.00, 0.00, 0.05, 0.10, 0.85], 
            [0.00, 0.05, 0.45, 0.05, 0.45]  
        ]
    },
    hoverIndex: null,

    init: function() {
        this.renderTokens();
        this.drawTable();
        // Specific namespaced event listener
        window.addEventListener('resize', () => this.drawWeb());
        this.drawWeb();
    },

    renderTokens: function() {
        // Updated to namespaced ID: sa-token-stream
        const container = document.getElementById('sa-token-stream');
        if (!container) return;
        
        container.innerHTML = this.data.tokens.map((word, i) => `
            <div class="sa-token-block" 
                 onmouseover="SelfAttentionLab.hoverIndex=${i}; SelfAttentionLab.drawWeb();" 
                 onmouseout="SelfAttentionLab.hoverIndex=null; SelfAttentionLab.drawWeb();">
                ${word}
            </div>
        `).join('');
    },

    drawWeb: function() {
        // Updated to namespaced IDs and Classes
        const canvas = document.getElementById('sa-attn-canvas');
        const container = document.getElementById('sa-attention-container');
        const chips = document.querySelectorAll('.sa-token-block');
        
        if (!canvas || !container || chips.length === 0) return;

        const ctx = canvas.getContext('2d');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const containerRect = container.getBoundingClientRect();

        this.data.tokens.forEach((_, i) => {
            this.data.tokens.forEach((_, j) => {
                if (i === j) return;
                
                const strength = this.data.matrix[i][j];
                if (strength < 0.01) return;

                const chip1 = chips[i].getBoundingClientRect();
                const chip2 = chips[j].getBoundingClientRect();

                const x1 = (chip1.left + chip1.width / 2) - containerRect.left;
                const x2 = (chip2.left + chip2.width / 2) - containerRect.left;
                const baseY = (chip1.top - containerRect.top);

                const isSource = (this.hoverIndex === i);
                
                ctx.beginPath();
                if (isSource) {
                    ctx.lineWidth = 2 + strength * 20;
                    ctx.strokeStyle = `rgba(37, 99, 235, ${0.3 + strength * 0.7})`;
                } else {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = `rgba(203, 213, 225, 0.2)`;
                }

                const dist = Math.abs(x2 - x1);
                const h = Math.min(dist * 0.5, 150);

                ctx.moveTo(x1, baseY);
                ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
                ctx.stroke();

                if (isSource && strength > 0.05) {
                    ctx.fillStyle = "#1e40af";
                    ctx.font = "bold 14px Inter, sans-serif";
                    const txt = Math.round(strength * 100) + "%";
                    ctx.fillText(txt, (x1 + x2)/2 - 10, baseY - h/1.5);
                }
            });
        });
    },

    drawTable: function() {
        const { tokens, matrix } = this.data;
        let html = '<table class="sa-attn-table"><tr><th>Source Word</th>';
        tokens.forEach(w => html += `<th>Attends to: ${w}</th>`);
        html += '</tr>';

        tokens.forEach((w, i) => {
            html += `<tr><td class="sa-row-label">${w}</td>`;
            matrix[i].forEach(val => {
                const color = `rgba(37, 99, 235, ${val})`;
                const textColor = val > 0.3 ? 'white' : '#475569';
                html += `<td style="background:${color}; color:${textColor}">${(val * 100).toFixed(0)}%</td>`;
            });
            html += '</tr>';
        });
        document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
    }
};

// Initialized via namespaced object
document.addEventListener('DOMContentLoaded', () => SelfAttentionLab.init());
