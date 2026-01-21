function initHallucinations() {
    renderTokenPrediction();
    renderTemperatureDemo();
    refreshMathHallucinations();
}

function refreshMathHallucinations() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        // Typeset specific containers if needed, or the whole page
        window.MathJax.typesetPromise().catch((err) => console.log(err.message));
    }
}

/**
 * Demo 1: Visualizing Next-Token Prediction
 * Shows a static bar chart of what word comes next after "The sky is..."
 */
function renderTokenPrediction() {
    const words = ['Blue', 'Cloudy', 'Dark', 'Green', 'Cheese'];
    const probs = [0.85, 0.10, 0.04, 0.009, 0.001];

    const data = [{
        x: words,
        y: probs,
        type: 'bar',
        marker: {
            color: ['#3b82f6', '#93c5fd', '#cbd5e0', '#fca5a5', '#ef4444']
        },
        text: probs.map(p => (p * 100).toFixed(1) + '%'),
        textposition: 'auto'
    }];

    const layout = {
        title: 'Probability of next word after: "The sky is..."',
        xaxis: { title: 'Possible Next Token' },
        yaxis: { title: 'Probability (0-1)', range: [0, 1] },
        margin: { t: 40, b: 40, l: 40, r: 20 }
    };

    Plotly.newPlot('token-prediction-plot', data, layout);
}

/**
 * Demo 2: The Effect of Temperature
 * Allows user to slide "Temperature" and see how the AI gets "creative" (and wrong).
 */
function renderTemperatureDemo() {
    const slider = document.getElementById('slider-temperature');
    const plotId = 'temperature-plot';
    const outputText = document.getElementById('temp-output-text');
    
    // Base "Logits" (Raw scores before probability) for the sentence: "The capital of France is..."
    // Paris (Correct), Lyon (Plausible), Berlin (Wrong), Frog (Nonsense)
    const tokens = ['Paris', 'Lyon', 'Berlin', 'Frog'];
    const logits = [6.0, 2.0, 0.5, -1.0]; 

    function softmax(logits, temperature) {
        // Avoid division by zero
        if (temperature <= 0.01) temperature = 0.01;
        
        const expValues = logits.map(z => Math.exp(z / temperature));
        const sumExp = expValues.reduce((a, b) => a + b, 0);
        return expValues.map(val => val / sumExp);
    }

    function update() {
        const temp = parseFloat(slider.value);
        document.getElementById('temp-value-display').innerText = temp.toFixed(1);

        const probs = softmax(logits, temp);
        
        // Determine the "Selected" word based on highest probability (simplified for viz)
        // In reality, AI samples randomly based on these weights.
        let colorScale = probs.map((p, i) => {
             if (i === 0) return '#22c55e'; // Paris (Green/Safe)
             if (i === 3) return '#ef4444'; // Frog (Red/Hallucination)
             return '#3b82f6'; // Others (Blue)
        });

        const data = [{
            x: tokens,
            y: probs,
            type: 'bar',
            marker: { color: colorScale },
            text: probs.map(p => (p * 100).toFixed(1) + '%'),
            textposition: 'auto'
        }];

        const layout = {
            title: `Distribution at Temperature = ${temp}`,
            yaxis: { range: [0, 1], title: 'Probability' },
            margin: { t: 40, b: 40, l: 40, r: 20 }
        };

        Plotly.react(plotId, data, layout);

        // Update explanation text
        if (temp < 0.3) {
            outputText.innerHTML = "<strong>Low Temp (Precise):</strong> The AI is almost 100% certain to pick 'Paris'. It is factual, but repetitive.";
        } else if (temp < 1.0) {
            outputText.innerHTML = "<strong>Medium Temp (Balanced):</strong> 'Paris' is still likely, but there is a small chance it might pick 'Lyon'.";
        } else {
            outputText.innerHTML = "<strong>High Temp (Creative/Hallucinating):</strong> The probabilities flatten out. The AI might randomly pick 'Frog'. This is a <strong>Hallucination</strong>.";
        }
    }

    slider.addEventListener('input', update);
    update(); // Initial render
}

window.addEventListener('load', () => {
    setTimeout(initHallucinations, 200);
});
