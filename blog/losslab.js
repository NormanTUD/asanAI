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
            annotations: [{
                x: yHat, y: currentLoss, text: 'AI', showarrow: true, arrowhead: 2, ax: (yHat > 5 ? 30 : -30), ay: -30
            }, {
                x: yTarget, y: -2, text: 'TARGET', showarrow: false, font: {color: '#10b981', weight: 'bold'}
            }]
        });

        if (window.MathJax) MathJax.typesetPromise([mseMath]);
    }

    // --- CCE Logic ---
    const dogSlider = document.getElementById('cce-dog');
    const cceMath = document.getElementById('cce-math');

    function updateCCE() {
        const pDog = parseFloat(dogSlider.value);
        const remaining = 1.0 - pDog;
        const pCat = remaining * 0.7; 
        const pBird = remaining * 0.3;
        
        const lossDog = -Math.log(pDog);
        const lossCat = -Math.log(pCat);
        const lossBird = -Math.log(pBird);

        document.getElementById('loss-dog').innerText = lossDog.toFixed(2);
        document.getElementById('loss-cat').innerText = lossCat.toFixed(2);
        document.getElementById('loss-bird').innerText = lossBird.toFixed(2);
        
        document.getElementById('bar-cat').style.width = (pCat * 100) + '%';
        document.getElementById('bar-bird').style.width = (pBird * 100) + '%';

        // Visualization of optimization status
        let statusText = "";
        if (pDog < pCat || pDog < pBird) {
            statusText = "\\color{red}{\\text{Wrong Category! (Loss High)}}";
        } else if (pDog < 0.8) {
            statusText = "\\color{orange}{\\text{Correct Category, but Unsure}}";
        } else {
            statusText = "\\color{green}{\\text{Optimized: High Confidence}}";
        }

        cceMath.innerHTML = `
            $$\\text{Total Loss} = \\mathbf{${lossDog.toFixed(2)}}$$
            $$${statusText}$$
        `;

        const xVals = [], yVals = [];
        for (let i = 0; i <= 1; i += 0.01) {
            xVals.push(i);
            yVals.push(-Math.log(i));
        }

        Plotly.newPlot('plot-cce', [
            { x: xVals, y: yVals, name: 'Log Loss Curve', line: {color: '#e2e8f0'} },
            { x: [pDog], y: [lossDog], name: 'Dog (Target)', mode: 'markers+text', text: 'Dog', textposition: 'top center', marker: {size: 15, color: '#10b981'} },
            { x: [pCat], y: [lossCat], name: 'Cat', mode: 'markers', marker: {size: 10, color: '#ef4444', opacity: 0.6} },
            { x: [pBird], y: [lossBird], name: 'Bird', mode: 'markers', marker: {size: 10, color: '#ef4444', opacity: 0.6} }
        ], {
            xaxis: { title: 'Confidence Score', range: [0, 1] },
            yaxis: { title: 'Loss Magnitude', range: [0, 4] },
            showlegend: false
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
