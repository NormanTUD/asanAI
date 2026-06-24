// ============================================================
// RESIDUAL STREAM NOTEBOOK ANIMATION
// Visualisiert den Residual Stream als Notizbuch, auf das
// mehrere "Experten" (Layer) nacheinander schreiben.
// ============================================================
const ResidualNotebook = (() => {
    let currentLayer = 0;
    let animationRunning = false;
    let container = null;

    const baseText = "The cat sat on the mat because it was tired";

    // Annotations für jede Schicht (Layer)
    const layers = [
        {
            name: "Layer 1 — Syntax-Experte",
            color: "#e63946",
            annotations: [
                { type: "underline", start: 0, end: 7, color: "#e63946", label: "Subjekt" },        // "The cat"
                { type: "underline", start: 8, end: 11, color: "#457b9d", label: "Verb" },           // "sat"
                { type: "arrow", from: 8, to: 0, color: "#e63946", label: "Verb → Subjekt" },
                { type: "margin-note", x: "right", y: 30, text: "Subjekt-Verb\nAgreement ✓", color: "#e63946" },
                { type: "circle", start: 8, end: 11, color: "#e63946" },                            // circle "sat"
                { type: "bracket", start: 12, end: 25, color: "#457b9d", label: "Präpositionalphrase" }, // "on the mat"
            ]
        },
        {
            name: "Layer 2 — Koreferenz-Experte",
            color: "#2a9d8f",
            annotations: [
                { type: "highlight", start: 34, end: 36, color: "rgba(42, 157, 143, 0.3)" },        // "it"
                { type: "arrow", from: 34, to: 0, color: "#2a9d8f", label: "it → cat" },
                { type: "strikethrough", start: 26, end: 33, color: "#999", label: "" },             // "because" leicht
                { type: "margin-note", x: "left", y: 80, text: "\"it\" bezieht sich\nauf \"cat\" (nicht \"mat\"!)", color: "#2a9d8f" },
                { type: "underline", start: 37, end: 44, color: "#2a9d8f", label: "Zustand von 'cat'" },  // "was tired"
                { type: "scribble", x: 180, y: -20, text: "Pronomen-Auflösung!", color: "#2a9d8f", rotation: -3 },
            ]
        },
        {
            name: "Layer 3 — Semantik-Experte",
            color: "#6b21a8",
            annotations: [
                { type: "highlight", start: 8, end: 11, color: "rgba(107, 33, 168, 0.2)" },         // "sat"
                { type: "margin-note", x: "right", y: 120, text: "sat = ruhend, passiv\n→ konsistent mit\n\"tired\"", color: "#6b21a8" },
                { type: "scribble", x: 60, y: -35, text: "Kausal: tired → sat", color: "#6b21a8", rotation: 2 },
                { type: "arrow", from: 37, to: 8, color: "#6b21a8", label: "Grund → Handlung" },
                { type: "box", start: 0, end: 44, color: "#6b21a8", label: "Kohärentes Narrativ ✓" },
                { type: "scribble", x: 300, y: -45, text: "Semantische Rolle:\ncat=EXPERIENCER", color: "#6b21a8", rotation: -2 },
                { type: "checkmark", x: 420, y: 60, color: "#6b21a8" },
            ]
        }
    ];

    function init() {
        container = document.getElementById('residual-notebook');
        if (!container) return;
        render();
    }

    function render() {
        container.innerHTML = `
            <div class="notebook-wrapper">
                <div class="notebook-header">
                    <div class="notebook-title">📓 Residual Stream — Das gemeinsame Notizbuch</div>
                    <div class="notebook-layer-info" id="notebook-layer-info">
                        Klicke "Nächster Layer" um zu sehen, wie jeder Experte seine Notizen hinzufügt.
                    </div>
                </div>
                <div class="notebook-page" id="notebook-page">
                    <div class="notebook-lines" id="notebook-lines"></div>
                    <div class="notebook-text" id="notebook-text">${baseText}</div>
                    <div class="notebook-annotations" id="notebook-annotations"></div>
                </div>
                <div class="notebook-controls">
                    <div class="notebook-layer-indicators" id="notebook-indicators"></div>
                    <div class="notebook-buttons">
                        <button onclick="ResidualNotebook.reset()" class="nb-btn nb-btn-reset">↺ Reset</button>
                        <button onclick="ResidualNotebook.nextLayer()" class="nb-btn nb-btn-next" id="nb-next-btn">▶ Nächster Layer</button>
                        <button onclick="ResidualNotebook.autoplay()" class="nb-btn nb-btn-auto" id="nb-auto-btn">⏩ Autoplay</button>
                    </div>
                </div>
            </div>
        `;
        renderIndicators();
        renderNotebookLines();
    }

    function renderNotebookLines() {
        const linesContainer = document.getElementById('notebook-lines');
        if (!linesContainer) return;
        let html = '';
        for (let i = 0; i < 12; i++) {
            html += `<div class="notebook-line" style="top:${30 + i * 28}px;"></div>`;
        }
        linesContainer.innerHTML = html;
    }

    function renderIndicators() {
        const ind = document.getElementById('notebook-indicators');
        if (!ind) return;
        let html = '';
        layers.forEach((layer, i) => {
            const active = i < currentLayer ? 'active' : '';
            const current = i === currentLayer ? 'current' : '';
            html += `<span class="nb-indicator ${active} ${current}" style="--layer-color:${layer.color};">${layer.name}</span>`;
        });
        ind.innerHTML = html;
    }

    function nextLayer() {
        if (currentLayer >= layers.length) return;
        const layer = layers[currentLayer];
        animateLayer(layer, () => {
            currentLayer++;
            renderIndicators();
            updateInfo();
            if (currentLayer >= layers.length) {
                document.getElementById('nb-next-btn').disabled = true;
            }
        });
    }

    function animateLayer(layer, onComplete) {
        const annotationsContainer = document.getElementById('notebook-annotations');
        const textEl = document.getElementById('notebook-text');
        if (!annotationsContainer || !textEl) return;

        // Info aktualisieren
        const info = document.getElementById('notebook-layer-info');
        if (info) {
            info.innerHTML = `<span style="color:${layer.color}; font-weight:bold;">✍️ ${layer.name} schreibt...</span>`;
        }

        let delay = 0;
        const baseDelay = 400;

        layer.annotations.forEach((ann, idx) => {
            setTimeout(() => {
                renderAnnotation(ann, annotationsContainer, textEl, layer.color);
            }, delay);
            delay += baseDelay + Math.random() * 200;
        });

        setTimeout(onComplete, delay + 300);
    }

    function getCharPosition(textEl, charIndex) {
        // Approximation: monospace-basiert
        const style = window.getComputedStyle(textEl);
        const fontSize = parseFloat(style.fontSize);
        const charWidth = fontSize * 0.6; // Approximation für monospace
        const x = charIndex * charWidth;
        const y = 0;
        return { x, y };
    }

    function renderAnnotation(ann, container, textEl, defaultColor) {
        const el = document.createElement('div');
        el.className = `nb-annotation nb-annotation-appear nb-type-${ann.type}`;

        const charWidth = 11.5; // px per character approximation
        const textTop = 45; // offset from top of notebook-page
        const textLeft = 30; // left padding

        switch (ann.type) {
            case 'underline': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop + 22}px; width:${width}px; height:3px; background:${ann.color}; border-radius:2px;`;
                if (ann.label) {
                    const label = document.createElement('span');
                    label.className = 'nb-label';
                    label.style.cssText = `position:absolute; top:4px; left:0; font-size:10px; color:${ann.color}; white-space:nowrap;`;
                    label.textContent = ann.label;
                    el.appendChild(label);
                }
                break;
            }
            case 'highlight': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop - 2}px; width:${width}px; height:26px; background:${ann.color}; border-radius:4px; pointer-events:none;`;
                break;
            }
            case 'circle': {
                const left = textLeft + ann.start * charWidth - 4;
                const width = (ann.end - ann.start) * charWidth + 8;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop - 5}px; width:${width}px; height:30px; border:2px solid ${ann.color}; border-radius:50%; pointer-events:none;`;
                break;
            }
            case 'arrow': {
                const fromX = textLeft + ann.from * charWidth + 5;
                const toX = textLeft + ann.to * charWidth + 5;
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.style.cssText = `position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; overflow:visible;`;
                const minX = Math.min(fromX, toX);
                const maxX = Math.max(fromX, toX);
                const midX = (fromX + toX) / 2;
                const curveY = textTop - 20 - Math.random() * 15;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${fromX} ${textTop - 5} Q ${midX} ${curveY} ${toX} ${textTop - 5}`);
                path.setAttribute('stroke', ann.color);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.setAttribute('marker-end', 'url(#arrowhead-' + ann.color.replace('#', '') + ')');

                // Arrowhead marker
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', 'arrowhead-' + ann.color.replace('#', ''));
                marker.setAttribute('markerWidth', '8');
                marker.setAttribute('markerHeight', '6');
                marker.setAttribute('refX', '8');
                marker.setAttribute('refY', '3');
                marker.setAttribute('orient', 'auto');
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '0 0, 8 3, 0 6');
                polygon.setAttribute('fill', ann.color);
                marker.appendChild(polygon);
                defs.appendChild(marker);
                svg.appendChild(defs);
                svg.appendChild(path);

                // Label
                if (ann.label) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', midX);
                    text.setAttribute('y', curveY - 4);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', ann.color);
                    text.setAttribute('font-size', '10');
                    text.setAttribute('font-weight', 'bold');
                    text.textContent = ann.label;
                    svg.appendChild(text);
                }

                el.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;';
                el.appendChild(svg);
                break;
            }
            case 'margin-note': {
                const x = ann.x === 'right' ? 'right: -10px;' : 'left: -10px;';
                const transform = ann.x === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
                el.style.cssText = `position:absolute; ${x} top:${ann.y}px; transform:${transform}; padding:6px 10px; background:#fffef0; border:1px solid ${ann.color}; border-radius:6px; font-size:11px; color:${ann.color}; white-space:pre-line; max-width:160px; line-height:1.4; box-shadow: 1px 1px 4px rgba(0,0,0,0.1);`;
                el.textContent = ann.text;
                break;
            }
            case 'scribble': {
                const rotation = ann.rotation || 0;
                el.style.cssText = `position:absolute; left:${textLeft + ann.x}px; top:${textTop + ann.y}px; font-size:12px; color:${ann.color}; font-weight:bold; font-style:italic; transform:rotate(${rotation}deg); white-space:pre-line; pointer-events:none;`;
                el.textContent = ann.text;
                break;
            }
            case 'bracket': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop + 24}px; width:${width}px; height:12px; border-bottom:2px solid ${ann.color}; border-left:2px solid ${ann.color}; border-right:2px solid ${ann.color}; border-radius:0 0 4px 4px;`;
                if (ann.label) {
                    const label = document.createElement('span');
                    label.className = 'nb-label';
                    label.style.cssText = `position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); font-size:10px; color:${ann.color}; white-space:nowrap;`;
                    label.textContent = ann.label;
                    el.appendChild(label);
                }
                break;
            }
            case 'strikethrough': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop + 10}px; width:${width}px; height:2px; background:${ann.color}; opacity:0.6;`;
                break;
            }
            case 'box': {
                const left = textLeft + ann.start * charWidth - 6;
                const width = (ann.end - ann.start) * charWidth + 12;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop - 8}px; width:${width}px; height:38px; border:2px dashed ${ann.color}; border-radius:8px; pointer-events:none;`;
                if (ann.label) {
                    const label = document.createElement('span');
                    label.className = 'nb-label';
                    label.style.cssText = `position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:10px; color:${ann.color}; white-space:nowrap; background:#fff; padding:0 4px;`;
                    label.textContent = ann.label;
                    el.appendChild(label);
                }
                break;
            }
            case 'checkmark': {
                el.style.cssText = `position:absolute; left:${textLeft + ann.x}px; top:${textTop + ann.y}px; font-size:28px; color:${ann.color};`;
                el.textContent = '✓';
                break;
            }
        }

        container.appendChild(el);
    }

    function updateInfo() {
        const info = document.getElementById('notebook-layer-info');
        if (!info) return;
        if (currentLayer >= layers.length) {
            info.innerHTML = `<span style="color:#166534; font-weight:bold;">✅ Alle 3 Layer haben geschrieben — der Residual Stream enthält nun das gesammelte Wissen aller Experten!</span>`;
        } else {
            info.innerHTML = `<span style="color:#64748b;">Layer ${currentLayer + 1} von ${layers.length} — Klicke "Nächster Layer"</span>`;
        }
    }

    function reset() {
        currentLayer = 0;
        animationRunning = false;
        const btn = document.getElementById('nb-next-btn');
        if (btn) btn.disabled = false;
        const autoBtn = document.getElementById('nb-auto-btn');
        if (autoBtn) autoBtn.textContent = '⏩ Autoplay';
        render();
    }

    function autoplay() {
        if (animationRunning) {
            animationRunning = false;
            document.getElementById('nb-auto-btn').textContent = '⏩ Autoplay';
            return;
        }
        animationRunning = true;
        document.getElementById('nb-auto-btn').textContent = '⏸ Stop';

        function step() {
            if (!animationRunning || currentLayer >= layers.length) {
                animationRunning = false;
                const autoBtn = document.getElementById('nb-auto-btn');
                if (autoBtn) autoBtn.textContent = '⏩ Autoplay';
                return;
            }
            nextLayer();
            setTimeout(step, 2500);
        }
        step();
    }

    // Public API
    return { init, nextLayer, reset, autoplay };
})();

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => ResidualNotebook.init(), 100);
});
