const PositionalLab = {
    d_model: 4, // Matching your transformerlab.js dimension
    
    // Calculate the PE vector for a specific position
    getEncoding: function(pos, d_model) {
        let pe = new Array(d_model).fill(0);
        for (let i = 0; i < d_model; i += 2) {
            let div_term = Math.pow(10000, (2 * i) / d_model);
            pe[i] = Math.sin(pos / div_term);
            if (i + 1 < d_model) {
                pe[i + 1] = Math.cos(pos / div_term);
            }
        }
        return pe;
    },

    renderTable: function(numPositions) {
        const container = document.getElementById('pe-viz-container');
        let html = `<table style="width:100%; border-collapse: collapse; font-family: monospace;">
                    <tr style="background: #f3f4f6;"><th>Pos</th><th>Encoding Vector (Dim 0-3)</th></tr>`;
        
        for (let p = 0; p < numPositions; p++) {
            const vec = this.getEncoding(p, this.d_model);
            const cells = vec.map(v => {
                const alpha = Math.abs(v);
                const color = v > 0 ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
                return `<td style="background: ${color}; border: 1px solid #ddd; padding: 5px; text-align: center;">
                            ${v.toFixed(3)}
                        </td>`;
            }).join('');
            
            html += `<tr><td style="padding: 5px; font-weight: bold;">#${p}</td>${cells}</tr>`;
        }
        container.innerHTML = html + `</table>`;
    }
};


window.addEventListener('DOMContentLoaded', () => PositionalLab.renderTable(5));
