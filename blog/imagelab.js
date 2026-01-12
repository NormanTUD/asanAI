function initDataBasics() {
    renderBWTable();
    renderRGBCombinedTable();
    updateBWPreview();
    updateRGBPreview();
    refreshMath();
}

/**
 * Ensures numbers are whole (integers) and stay between 0 and 255
 */
function validateInput(el) {
    let val = parseFloat(el.value);
    
    // Default to 0 if input is empty or not a number
    if (isNaN(val)) val = 0;
    
    // 5.6 -> 5 (Force integer)
    let finalVal = Math.floor(val);
    
    // Clamp range (0-255)
    if (finalVal < 0) finalVal = 0;
    if (finalVal > 255) finalVal = 255;
    
    // Put the cleaned number back into the box
    el.value = finalVal;
}

function refreshMath() {
    if (window.MathJax && window.MathJax.typeset) {
        window.MathJax.typeset();
    }
}

function renderBWTable() {
    const container = document.getElementById('bw-matrix-container');
    let html = '<table>';
    for(let r=0; r<3; r++) {
        html += '<tr>';
        for(let c=0; c<3; c++) {
            let val = (r === c) ? 0 : 255; // Initial pattern
            html += `<td class="bw-cell"><input type="number" value="${val}" min="0" max="255" class="bw-cell-input" oninput="validateInput(this); updateBWPreview()" style="width:55px; padding: 6px; border: 1px solid #ccc; font-weight: bold; text-align: center;"></td>`;
        }
        html += '</tr>';
    }
    container.innerHTML = html + '</table>';
}

function renderRGBCombinedTable() {
    const container = document.getElementById('rgb-combined-container');
    let html = '<table style="border-spacing: 8px; border-collapse: separate;">';
    
    for(let r=0; r<3; r++) {
        html += '<tr>';
        for(let c=0; c<3; c++) {
            let rv = (r === 0) ? 255 : 0;
            let gv = (r === 1) ? 255 : 0;
            let bv = (r === 2) ? 255 : 0;
            
            html += `
            <td style="background: #ffffff; border: 1px solid #cbd5e0; padding: 8px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 6px; height: 18px; background: #ef4444; border-radius: 2px;"></div>
                        <input type="number" value="${rv}" class="rgb-c-r" oninput="validateInput(this); updateRGBPreview()" 
                               style="width:55px; font-size:12px; border:1px solid #fee2e2; text-align: center;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 6px; height: 18px; background: #22c55e; border-radius: 2px;"></div>
                        <input type="number" value="${gv}" class="rgb-c-g" oninput="validateInput(this); updateRGBPreview()" 
                               style="width:55px; font-size:12px; border:1px solid #dcfce7; text-align: center;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 6px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
                        <input type="number" value="${bv}" class="rgb-c-b" oninput="validateInput(this); updateRGBPreview()" 
                               style="width:55px; font-size:12px; border:1px solid #dbeafe; text-align: center;">
                    </div>
                </div>
            </td>`;
        }
        html += '</tr>';
    }
    container.innerHTML = html + '</table>';
}

function updateBWPreview() {
    const canvas = document.getElementById('bw-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(3, 3);
    const cells = document.querySelectorAll('.bw-cell-input');
    
    cells.forEach((cell, i) => {
        const val = parseInt(cell.value) || 0;
        imgData.data[i * 4] = val;
        imgData.data[i * 4 + 1] = val;
        imgData.data[i * 4 + 2] = val;
        imgData.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(imgData, 0, 0);
}

function updateRGBPreview() {
    const canvas = document.getElementById('rgb-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(3, 3);
    
    const reds = document.querySelectorAll('.rgb-c-r');
    const greens = document.querySelectorAll('.rgb-c-g');
    const blues = document.querySelectorAll('.rgb-c-b');

    for(let i=0; i<9; i++) {
        imgData.data[i * 4] = parseInt(reds[i].value) || 0;
        imgData.data[i * 4 + 1] = parseInt(greens[i].value) || 0;
        imgData.data[i * 4 + 2] = parseInt(blues[i].value) || 0;
        imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
}

window.addEventListener('load', () => {
    setTimeout(initDataBasics, 200);
});
