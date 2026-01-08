/**
 * PATH: asanai/blog/embeddinglab.js
 */

const evoSpaces = {
    '1d': {
        vocab: { 
            'Eisig': [-15,0,0], 'Kalt': [-8,0,0], 'Lauwarm': [2,0,0], 
            'Warm': [10,0,0], 'Heiß': [18,0,0], 'Siedend': [25,0,0] 
        },
        axes: { x: 'Temperatur' }, dims: 1
    },
    '2d': {
        vocab: { 
            'Man': [5,-5,0], 'Woman': [5,5,0], 
            'King': [15,-5,0], 'Queen': [15,5,0],
            'Boy': [-8,-5,0], 'Girl': [-8,5,0], 
            'Power': [10,0,0], 'Childhood': [-15,0,0]
        },
        axes: { x: 'Power/Age', y: 'Gender' }, dims: 2
    },
'3d': {
	vocab: {
		// BASIS (Macht = 0, Spezies = 0)
		'Human': [0, 0, 0],
		'Man': [0, -10, 0], 
		'Woman': [0, 10, 0], 

		// POWER-UPGRADES (Macht = 15)
		'Power': [15, 0, 0],   // Reiner Macht-Vektor
		'King': [15, -10, 0], 
		'Queen': [15, 10, 0],
		'Prince': [8, -10, 0], 
		'Princess': [8, 10, 0],

		// GÖTTLICHKEIT (Macht = 25, Spezies = 25)
		'Divine': [0, 0, 25],  // Reiner Spezies-Vektor
		'God': [25, -10, 25], 
		'Goddess': [25, 10, 25], 

		// TIERE (Spezies = -20)
		'Animal': [0, 0, -20],
		'Dog': [0, -5, -20], 
		'Cat': [0, 5, -20], 
		'Lion': [18, -5, -20], 
		'Lioness': [18, 5, -20],

		// OBJEKTE
		'Apple': [-5, 0, -20], 
		'Pizza': [5, 0, -20]
	},
	axes: { x: 'Power (Macht)', y: 'Gender', z: 'Species (Natur)' }, dims: 3
}
};

window.addEventListener('load', () => {
    setTimeout(() => {
        Object.keys(evoSpaces).forEach(key => renderSpace(key));
    }, 200);
});

function renderSpace(key, highlightPos = null, steps = []) {
    const divId = `plot-${key}`;
    const plotDiv = document.getElementById(divId);
    if (!plotDiv) return;

    const space = evoSpaces[key];
    const is3D = (space.dims === 3);
    let traces = [];

    // Basis-Vokabular
    Object.keys(space.vocab).forEach(word => {
        const v = space.vocab[word];
        let trace = {
            x: [v[0]], y: [v[1]],
            mode: 'markers+text',
            name: word, text: [word], textposition: 'top center',
            marker: { size: 6, opacity: 0.5, color: '#94a3b8' }
        };
        if (is3D) {
            trace.type = 'scatter3d';
            trace.z = [v[2]];
        } else {
            trace.type = 'scatter';
        }
        traces.push(trace);
    });

    // Pfad-Visualisierung (Blaue Pfeile)
    steps.forEach(step => {
        // Die Linie
        let line = {
            x: [step.from[0], step.to[0]],
            y: [step.from[1], step.to[1]],
            mode: 'lines',
            line: { color: '#3b82f6', width: 3 },
            hoverinfo: 'skip'
        };

        if (is3D) {
            line.type = 'scatter3d';
            line.z = [step.from[2], step.to[2]];
            traces.push(line);
            
            // 3D Cone (Pfeilspitze)
            traces.push({
                type: 'cone', x: [step.to[0]], y: [step.to[1]], z: [step.to[2]],
                u: [step.to[0]-step.from[0]], v: [step.to[1]-step.from[1]], w: [step.to[2]-step.from[2]],
                sizemode: 'absolute', sizeref: 2, showscale: false, colorscale: [[0, '#3b82f6'], [1, '#3b82f6']]
            });
        } else {
            line.type = 'scatter';
            traces.push(line);
            
            // 2D Pfeilspitze via Marker
            traces.push({
                x: [step.to[0]], y: [step.to[1]],
                mode: 'markers',
                marker: { symbol: 'arrow-bar-up', size: 10, color: '#3b82f6', angleref: 'previous' },
                type: 'scatter', hoverinfo: 'skip'
            });
        }
    });

    if (highlightPos) {
        let res = {
            x: [highlightPos[0]], y: [highlightPos[1]],
            mode: 'markers', marker: { size: 12, color: '#ef4444', symbol: 'diamond' }
        };
        if (is3D) {
            res.type = 'scatter3d';
            res.z = [highlightPos[2]];
        } else {
            res.type = 'scatter';
        }
        traces.push(res);
    }

    const layout = {
        margin: { l: 20, r: 20, b: 20, t: 20 },
        showlegend: false,
        xaxis: { range: [-30, 30], title: space.axes.x },
        yaxis: { range: [-20, 20], title: space.axes.y || '', visible: space.dims > 1 }
    };

    if (is3D) {
        layout.scene = {
            xaxis: { title: space.axes.x, range: [-30, 30] },
            yaxis: { title: space.axes.y, range: [-30, 30] },
            zaxis: { title: space.axes.z, range: [-30, 30] }
        };
    }

    if (plotDiv.classList.contains('js-plotly-plot')) {
        Plotly.react(divId, traces, layout);
    } else {
        Plotly.newPlot(divId, traces, layout);
    }
}

function calcEvo(key) {
    const inputVal = document.getElementById(`input-${key}`).value;
    const space = evoSpaces[key];
    const tokens = inputVal.match(/[a-zA-ZäöüÄÖÜ]+|[0-9.]+|[\+\-\*\/]/g);
    if (!tokens) return;

    let pos = 0;
    let steps = [];

    function parse() {
        let first = tokens[pos++];
        let node = [...(space.vocab[first] || [0,0,0])];
        
        while (pos < tokens.length) {
            let op = tokens[pos++];
            let next = tokens[pos++];
            if (!next) break;
            
            let right = isNaN(next) ? [...(space.vocab[next] || [0,0,0])] : [parseFloat(next), 0, 0];
            let prev = [...node];
            
            if (op === '+') node = node.map((v, i) => v + (right[i] || 0));
            if (op === '-') node = node.map((v, i) => v - (right[i] || 0));
            
            steps.push({ from: prev, to: [...node] });
        }
        return node;
    }

    try {
        const finalVec = parse();
        let nearest = "None";
        let minDist = Infinity;
        
        Object.keys(space.vocab).forEach(w => {
            const v = space.vocab[w];
            const d = Math.sqrt(v.reduce((s, val, i) => s + Math.pow(val - finalVec[i], 2), 0));
            if (d < minDist) { minDist = d; nearest = w; }
        });

        document.getElementById(`res-${key}`).innerText = `Match: ${nearest}`;
        renderSpace(key, finalVec, steps);
    } catch(e) { console.error(e); }
}
