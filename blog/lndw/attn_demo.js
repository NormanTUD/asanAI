const AttentionDemo = {
    currentExample: 0,

	examples: [
		{
			sentence: 'Ich gehe zur <b class="attnexample" style="color:#3b82f6;">Bank</b>.',
			// Kein Kontextwort → "Bank" bleibt in der Mitte (ambig)
			contextWords: [],
			bankShift: [5, 5] // Bleibt genau auf der Basisposition – keine Verschiebung
		},
		{
			sentence: 'Ich bringe mein <b class="attnexample" style="color:#f59e0b;">Geld</b> auf die <b class="attnexample" style="color:#3b82f6;">Bank</b>.',
			// "Bank" wird Richtung "Geld" gezogen (Finanzinstitut)
			contextWords: ['geld'],
			bankShift: [7.5, 2.5] // Richtung Geld (oben rechts = Finanzen)
		},
		{
			sentence: 'Ich sitze im <b class="attnexample" style="color:#10b981;">Park</b> auf der <b class="attnexample" style="color:#3b82f6;">Bank</b>.',
			// "Bank" wird Richtung "Park" gezogen (Sitzgelegenheit)
			contextWords: ['park'],
			bankShift: [2.5, 7.5] // Richtung Park (oben links = Natur/Sitzen)
		},
		{
			sentence: 'Nach dem <b class="attnexample" style="color:#10b981;">Spaziergang</b> im <b class="attnexample" style="color:#10b981;">Park</b> gehe ich zur <b class="attnexample" style="color:#f59e0b;">Bank</b>, um <b class="attnexample" style="color:#f59e0b;">Geld</b> abzuheben.',
			// Beide Kontexte, aber "Geld" + "Bank" (abheben) dominiert → Finanzinstitut
			contextWords: ['park', 'geld'],
			bankShift: [6.8, 3.8] // Stärker Richtung Geld, leicht von Park beeinflusst
		}
	],

    vocabPositions: {
        'bank':  { base: [5, 5], color: '#3b82f6', label: 'Bank' },
        'park':  { base: [1, 9], color: '#10b981', label: 'Park' },
        'geld':  { base: [9, 1], color: '#f59e0b', label: 'Geld' }
    },

    isOnAttentionSlide: function() {
        const slides = document.querySelectorAll('.slide');
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return false;
        return activeSlide.getAttribute('data-title') === 'Attention';
    },

    canGoNext: function() {
        if (!this.isOnAttentionSlide()) return false;
        // Prüfe ob das fragment mit dem Plot schon sichtbar ist
        const plotContainer = document.getElementById('transformer-plot');
        if (!plotContainer) return false;
        const parentFragment = plotContainer.closest('.fragment');
        if (parentFragment && !parentFragment.classList.contains('visible')) return false;
        return this.currentExample < this.examples.length - 1;
    },

    canGoPrev: function() {
        if (!this.isOnAttentionSlide()) return false;
        const plotContainer = document.getElementById('transformer-plot');
        if (!plotContainer) return false;
        const parentFragment = plotContainer.closest('.fragment');
        if (parentFragment && !parentFragment.classList.contains('visible')) return false;
        return this.currentExample > 0;
    },

    next: function() {
        if (this.currentExample < this.examples.length - 1) {
            this.currentExample++;
            this.render();
        }
    },

    prev: function() {
        if (this.currentExample > 0) {
            this.currentExample--;
            this.render();
        }
    },

    reset: function() {
        this.currentExample = 0;
        this.render();
    },

    render: function() {
        const container = 'transformer-plot';
        const plotDiv = document.getElementById(container);
        const sentenceDisplay = document.getElementById('attention-sentence-display');
        if (!plotDiv) return;

        const example = this.examples[this.currentExample];

        // Update sentence display
        if (sentenceDisplay) {
            sentenceDisplay.innerHTML = example.sentence;
        }

        let traces = [];

        // 1. Statische Vokabular-Punkte (Hintergrund)
        Object.keys(this.vocabPositions).forEach(word => {
            const pos = this.vocabPositions[word].base;
            traces.push({
                x: [pos[0]], y: [pos[1]],
                mode: 'markers+text',
                name: this.vocabPositions[word].label,
                text: [this.vocabPositions[word].label],
                textposition: 'bottom center',
                textfont: { size: 13, color: this.vocabPositions[word].color },
                marker: { size: 14, opacity: 0.5, color: this.vocabPositions[word].color },
                type: 'scatter',
                showlegend: false
            });
        });

        // 2. Attention-Linien von Bank zu Kontextwörtern
        const bankBase = this.vocabPositions['bank'].base;

        example.contextWords.forEach(word => {
            if (this.vocabPositions[word]) {
                const otherBase = this.vocabPositions[word].base;
                traces.push({
                    x: [bankBase[0], otherBase[0]],
                    y: [bankBase[1], otherBase[1]],
                    mode: 'lines',
                    line: { color: '#f97316', width: 2.5, dash: 'dot' },
                    hoverinfo: 'none',
                    showlegend: false,
                    type: 'scatter'
                });
            }
        });

        // 3. Kontextualisiertes Embedding (verschobener Punkt)
        traces.push({
            x: [example.bankShift[0]], y: [example.bankShift[1]],
            mode: 'markers+text',
            text: ['"Bank" im Kontext'],
            textposition: 'top center',
            textfont: { size: 12, color: '#1e293b' },
            marker: {
                size: 18,
                color: '#3b82f6',
                symbol: 'diamond',
                line: { color: '#1e293b', width: 2 }
            },
            type: 'scatter',
            showlegend: false
        });

        // 4. Pfeil/Linie von Bank-Basis zum verschobenen Punkt
        traces.push({
            x: [bankBase[0], example.bankShift[0]],
            y: [bankBase[1], example.bankShift[1]],
            mode: 'lines',
            line: { color: '#3b82f6', width: 2, dash: 'solid' },
            hoverinfo: 'none',
            showlegend: false,
            type: 'scatter'
        });

        const layout = {
            margin: { l: 40, r: 40, b: 40, t: 40 },
            hovermode: 'closest',
            xaxis: {
                range: [0, 10],
                title: 'Semantische Dimension A',
                gridcolor: '#e2e8f0',
                zeroline: false
            },
            yaxis: {
                range: [0, 10],
                title: 'Semantische Dimension B',
                gridcolor: '#e2e8f0',
                zeroline: false
            },
            showlegend: false,
            annotations: []
        };

        Plotly.react(container, traces, layout, { displayModeBar: false, responsive: true });
    }
};

// Alte runAttention-Funktion ersetzen
function runAttention() {
    AttentionDemo.render();
}


