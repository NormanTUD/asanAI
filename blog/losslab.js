function initLossLab() {
    // --- MSE Logic ---
    const mseTrue = document.getElementById('mse-true');
    const msePred = document.getElementById('mse-pred');
    const mseMath = document.getElementById('mse-math');

    function updateMSE() {
        const yTarget = parseFloat(mseTrue.value);
        const yHat = parseFloat(msePred.value);
        const error = yTarget - yHat;
        const currentLoss = Math.pow(error, 2);
        const derivative = -2 * error; 

        mseMath.innerHTML = `
            $$\\text{Truth: } y = ${yTarget}$$
            $$\\text{Guess: } \\hat{y} = ${yHat.toFixed(1)}$$
            $$\\text{Loss} = (${yTarget} - ${yHat.toFixed(1)})^2 = \\mathbf{${currentLoss.toFixed(2)}}$$
            $$\\text{Slope: } \\mathbf{${derivative.toFixed(2)}}$$
        `;

        const xVals = [], yVals = [];
        for (let i = 0; i <= 10; i += 0.1) {
            xVals.push(i);
            yVals.push(Math.pow(yTarget - i, 2));
        }

        Plotly.newPlot('plot-mse', [
            { x: xVals, y: yVals, name: 'Loss Bowl', line: {color: '#cbd5e0', width: 2} },
            { x: [yTarget], y: [0], mode: 'markers', name: 'Truth', marker: {size: 18, color: '#10b981', symbol: 'star'} },
            { x: [yHat], y: [currentLoss], mode: 'markers', name: 'AI Guess', marker: {size: 14, color: '#ef4444'} }
        ], {
            xaxis: { title: 'Prediction Value', range: [0, 10] },
            yaxis: { title: 'Loss Amount', range: [-5, 100] },
            showlegend: false,
            margin: { t: 20 },
            annotations: [{
                x: yHat, y: currentLoss, text: 'AI', showarrow: true, arrowhead: 2, ax: (yHat > 5 ? 30 : -30), ay: -30
            }, {
                x: yTarget, y: -2, text: 'TARGET', showarrow: false, font: {color: '#10b981', weight: 'bold'}
            }]
        });

        if (window.MathJax) MathJax.typesetPromise([mseMath]);
    }

    // --- CCE Logic ---
    const targetSlider = document.getElementById('cce-target');
    const cceMath = document.getElementById('cce-math');

    function updateCCE() {
        // Probabilities must sum to 1.0
        const pCat = parseFloat(targetSlider.value);
        const remaining = 1.0 - pCat;
        const pDog = remaining * 0.6; // Split remaining confidence
        const pBird = remaining * 0.4;
        
        // Log Loss: -ln(p)
        // For the target (Cat), we want this low (p -> 1)
        // For others, loss is typically calculated based on their distance from 0
        const lossCat = -Math.log(pCat);
        const lossDog = -Math.log(1 - pDog); // Loss for being "too high" when it should be 0
        const lossBird = -Math.log(1 - pBird);

        // Update UI Text
        document.getElementById('loss-target').innerText = lossCat.toFixed(2);
        document.getElementById('loss-dog').innerText = lossDog.toFixed(2);
        document.getElementById('loss-bird').innerText = lossBird.toFixed(2);
        
        // Update Vector View
        document.getElementById('vec-cat').innerText = pCat.toFixed(2);
        document.getElementById('vec-dog').innerText = pDog.toFixed(2);
        document.getElementById('vec-bird').innerText = pBird.toFixed(2);

        // Update Progress Bars for non-targets
        document.getElementById('bar-dog').style.width = (pDog * 100) + '%';
        document.getElementById('bar-bird').style.width = (pBird * 100) + '%';

        let statusText = "";
        if (pCat < pDog || pCat < pBird) {
            statusText = "\\color{red}{\\text{Wrong Classification!}}";
        } else if (pCat < 0.8) {
            statusText = "\\color{orange}{\\text{Correct Class, Low Confidence}}";
        } else {
            statusText = "\\color{green}{\\text{Optimized: High Confidence}}";
        }

        cceMath.innerHTML = `
            $$\\text{Current Loss: } -\\ln(${pCat.toFixed(2)}) = \\mathbf{${lossCat.toFixed(2)}}$$
            $$${statusText}$$
        `;

        const xVals = [], yVals = [];
        for (let i = 0.01; i <= 1; i += 0.01) {
            xVals.push(i);
            yVals.push(-Math.log(i));
        }

        Plotly.newPlot('plot-cce', [
            { x: xVals, y: yVals, name: 'Log Loss Curve', line: {color: '#e2e8f0'} },
            { x: [pCat], y: [lossCat], name: 'Cat (Target)', mode: 'markers+text', text: 'Cat', textposition: 'top center', marker: {size: 15, color: '#10b981'} },
            { x: [pDog], y: [-Math.log(pDog)], name: 'Dog', mode: 'markers', marker: {size: 10, color: '#ef4444', opacity: 0.4} },
            { x: [pBird], y: [-Math.log(pBird)], name: 'Bird', mode: 'markers', marker: {size: 10, color: '#ef4444', opacity: 0.4} }
        ], {
            xaxis: { title: 'Confidence in Category (0.0 to 1.0)', range: [0, 1] },
            yaxis: { title: 'Loss Magnitude', range: [0, 4] },
            showlegend: false,
            margin: { t: 20 }
        });

        if (window.MathJax) MathJax.typesetPromise([cceMath]);
    }

    mseTrue.oninput = updateMSE;
    msePred.oninput = updateMSE;
    targetSlider.oninput = updateCCE;

    updateMSE();
    updateCCE();
}

window.addEventListener('load', initLossLab);
