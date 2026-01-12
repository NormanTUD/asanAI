function initLossLab() {
    // --- MSE Logic ---
    const mseTrue = document.getElementById('mse-true');
    const msePred = document.getElementById('mse-pred');
    const mseMath = document.getElementById('mse-math');
    const targetLabel = document.getElementById('mse-target-val');

    function updateMSE() {
        const y = parseFloat(mseTrue.value);
        const yHat = parseFloat(msePred.value);
        const diff = y - yHat;
        const loss = Math.pow(diff, 2);
        
        targetLabel.innerText = y;

        mseMath.innerHTML = `
            $$y = ${y}, \\hat{y} = ${yHat.toFixed(1)}$$
            $$\\text{Error} = ${diff.toFixed(1)}$$
            $$\\text{Loss} = (${diff.toFixed(1)})^2 = \\mathbf{${loss.toFixed(2)}}$$
        `;

        const xVals = [], yVals = [];
        for (let i = 0; i <= 10; i += 0.1) {
            xVals.push(i);
            yVals.push(Math.pow(y - i, 2));
        }

        Plotly.newPlot('plot-mse', [
            { x: xVals, y: yVals, name: 'MSE Curve', line: {color: '#3b82f6'} },
            { x: [yHat], y: [loss], mode: 'markers+text', text: ['AI'], textposition: 'top center', marker: {size: 12, color: '#ef4444'} }
        ], { 
            xaxis: { title: 'AI Prediction' }, yaxis: { title: 'Loss' },
            annotations: [{ x: y, y: 0, text: 'Perfect Truth', showarrow: true, arrowhead: 2, ax: 0, ay: -30 }]
        });

        if (window.MathJax) MathJax.typesetPromise([mseMath]);
    }

    // --- CCE Logic ---
    const dogSlider = document.getElementById('cce-dog');
    const cceMath = document.getElementById('cce-math');

    function updateCCE() {
        const pDog = parseFloat(dogSlider.value);
        const remaining = 1.0 - pDog;
        const pCat = remaining * 0.6; // Dummy split
        const pBird = remaining * 0.4;
        const loss = -Math.log(pDog);

        // Update UI Bars
        document.getElementById('val-dog').innerText = (pDog * 100).toFixed(0) + '%';
        document.getElementById('val-cat').innerText = (pCat * 100).toFixed(0) + '%';
        document.getElementById('val-bird').innerText = (pBird * 100).toFixed(0) + '%';
        document.getElementById('bar-cat').style.width = (pCat * 100) + '%';
        document.getElementById('bar-bird').style.width = (pBird * 100) + '%';

        cceMath.innerHTML = `
            $$\\text{Target is Dog. AI confidence: } P = ${pDog.toFixed(2)}$$
            $$\\text{Loss} = -\\ln(${pDog.toFixed(2)}) = \\mathbf{${loss.toFixed(2)}}$$
        `;

        const xVals = [], yVals = [];
        for (let i = 0.01; i <= 1; i += 0.01) {
            xVals.push(i);
            yVals.push(-Math.log(i));
        }

        Plotly.newPlot('plot-cce', [
            { x: xVals, y: yVals, name: 'Log Loss', line: {color: '#f59e0b'} },
            { x: [pDog], y: [loss], mode: 'markers', marker: {size: 12, color: '#ef4444'} }
        ], {
            xaxis: { title: 'Confidence in Correct Class (Dog)', range: [0, 1] },
            yaxis: { title: 'Loss', range: [0, 5] }
        });

        if (window.MathJax) MathJax.typesetPromise([cceMath]);
    }

    mseTrue.oninput = updateMSE;
    msePred.oninput = updateMSE;
    dogSlider.oninput = updateCCE;

    updateMSE();
    updateCCE();
}

window.addEventListener('load', initLossLab);
