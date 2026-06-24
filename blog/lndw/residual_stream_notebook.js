// ============================================================
// RESIDUAL STREAM NOTEBOOK ANIMATION (ERWEITERT)
// Visualisiert den Residual Stream als Notizbuch, auf das
// mehrere "Experten" (Layer) nacheinander kritzeln.
// Jede Stufe wird komplexer. Alles auf Deutsch.
// ============================================================
const ResidualNotebook = (() => {
    let currentLayer = 0;
    let animationRunning = false;
    let container = null;
    let isActive = false; // ob diese Folie gerade aktiv ist

    const baseText = "Die Katze saß auf der Matte weil sie müde war";

    // 5 Stufen: von fundamental bis hochkomplex
    const layers = [
        {
            name: "Schicht 1 — Wortarten-Erkenner",
            color: "#e63946",
            description: "Erkennt die grundlegendsten Bausteine: Was ist ein Nomen? Ein Verb? Ein Artikel?",
            annotations: [
                { type: "underline", start: 0, end: 3, color: "#e63946", label: "Artikel" },
                { type: "underline", start: 4, end: 9, color: "#d62828", label: "Nomen" },
                { type: "circle", start: 10, end: 13, color: "#e63946" },
                { type: "scribble", x: 120, y: -30, text: "VERB!", color: "#e63946", rotation: -8, font: "bold 14px Comic Sans MS" },
                { type: "underline", start: 14, end: 17, color: "#457b9d", label: "Präp." },
                { type: "underline", start: 18, end: 21, color: "#e63946", label: "Artikel" },
                { type: "underline", start: 22, end: 27, color: "#d62828", label: "Nomen" },
                { type: "scribble", x: 350, y: -25, text: "Konjunktion↓", color: "#a8201a", rotation: 12, font: "italic 11px Georgia" },
                { type: "highlight", start: 28, end: 32, color: "rgba(230, 57, 70, 0.15)" },
                { type: "underline", start: 33, end: 36, color: "#6a040f", label: "Pron." },
                { type: "circle", start: 43, end: 46, color: "#e63946" },
                { type: "scribble", x: 480, y: -35, text: "auch Verb!", color: "#e63946", rotation: -5, font: "bold 12px Courier New" },
            ]
        },
        {
            name: "Schicht 2 — Syntax-Architekt",
            color: "#2a9d8f",
            description: "Erkennt Satzglieder, Subjekt-Verb-Beziehungen und Phrasenstruktur.",
            annotations: [
                { type: "bracket", start: 0, end: 9, color: "#2a9d8f", label: "Subjekt (Nominativ)" },
                { type: "arrow", from: 10, to: 4, color: "#2a9d8f", label: "Verb → Subjekt" },
                { type: "bracket", start: 14, end: 27, color: "#264653", label: "Präpositionalphrase (lokal)" },
                { type: "scribble", x: 30, y: -45, text: "Subjekt-Verb\nKongruenz: 3.Pers.Sg.", color: "#2a9d8f", rotation: -3, font: "bold 11px monospace" },
                { type: "box", start: 28, end: 46, color: "#2a9d8f", label: "Nebensatz (kausal)" },
                { type: "scribble", x: 300, y: 55, text: "← Verb am Ende!\n   (Nebensatz-Regel)", color: "#264653", rotation: 4, font: "italic bold 11px Georgia" },
                { type: "scribble", x: 180, y: -50, text: "V2-Stellung ✓", color: "#2a9d8f", rotation: -7, font: "bold 13px Impact" },
            ]
        },
        {
            name: "Schicht 3 — Koreferenz-Detektiv",
            color: "#e76f51",
            description: "Löst Pronomen auf: Wer ist 'sie'? Worauf bezieht sich was?",
            annotations: [
                { type: "highlight", start: 33, end: 36, color: "rgba(231, 111, 81, 0.35)" },
                { type: "arrow", from: 33, to: 4, color: "#e76f51", label: "sie → Katze" },
                { type: "scribble", x: 60, y: -55, text: "\"sie\" = DIE KATZE\n(nicht die Matte!)", color: "#e76f51", rotation: -6, font: "bold 13px Comic Sans MS" },
                { type: "scribble", x: 250, y: -60, text: "Genus-Match:\nKatze=fem → sie=fem ✓\nMatte=fem → sie=fem ✓\n→ Semantik entscheidet!", color: "#e76f51", rotation: 3, font: "11px Courier New" },
                { type: "strikethrough", start: 22, end: 27, color: "#e76f51", label: "" },
                { type: "scribble", x: 220, y: 50, text: "Matte kann nicht\nmüde sein! ✗", color: "#c1121f", rotation: -4, font: "bold italic 12px Georgia" },
                { type: "circle", start: 4, end: 9, color: "#e76f51" },
            ]
        },
        {
            name: "Schicht 4 — Semantik-Versteher",
            color: "#6b21a8",
            description: "Versteht Bedeutungsbeziehungen, Kausalität und semantische Rollen.",
            annotations: [
                { type: "arrow", from: 37, to: 10, color: "#6b21a8", label: "Grund → Handlung" },
                { type: "scribble", x: 10, y: -65, text: "KAUSALITÄT:\nmüde → saß\n(nicht umgekehrt!)", color: "#6b21a8", rotation: -4, font: "bold 12px monospace" },
                { type: "highlight", start: 10, end: 13, color: "rgba(107, 33, 168, 0.2)" },
                { type: "scribble", x: 100, y: 60, text: "saß = STATISCH\n= passiv, ruhend\n→ passt zu \"müde\"", color: "#7b2cbf", rotation: 5, font: "italic 11px Georgia" },
                { type: "margin-note", x: "left", y: 120, text: "Semantische Rollen:\n• Katze = EXPERIENCER\n• Matte = LOCATION\n• müde = STATE", color: "#6b21a8" },
                { type: "scribble", x: 320, y: -55, text: "Kohärenz-Check:\nLebewesen + müde ✓\nObjekt + müde ✗", color: "#6b21a8", rotation: -2, font: "bold 11px Courier New" },
                { type: "box", start: 0, end: 46, color: "#6b21a8", label: "Kohärentes Narrativ ✓" },
                { type: "scribble", x: 400, y: 55, text: "Frame: RUHEN\nAgent: Katze\nOrt: Matte\nGrund: Müdigkeit", color: "#9d4edd", rotation: -8, font: "12px monospace" },
                { type: "checkmark", x: 500, y: -20, color: "#6b21a8" },
            ]
        },
        {
            name: "Schicht 5 — Pragmatik & Vorhersage",
            color: "#0077b6",
            description: "Versteht den kommunikativen Zweck und bereitet die Vorhersage des nächsten Tokens vor.",
            annotations: [
                { type: "scribble", x: 250, y: -75, text: "Informationsstruktur:\nTHEMA: Katze (bekannt)\nRHEMA: müde (neu!)", color: "#023e8a", rotation: 5, font: "italic 11px monospace" },
                { type: "scribble", x: 80, y: 65, text: "Diskurs-Erwartung:\nNach Grund-Angabe →\nSatz ist KOMPLETT", color: "#0077b6", rotation: -6, font: "bold 11px Comic Sans MS" },
                { type: "highlight", start: 37, end: 46, color: "rgba(0, 119, 182, 0.15)" },
                { type: "scribble", x: 450, y: -65, text: "FOKUS des Satzes!\n(neue Information)\n→ höchstes Gewicht\nfür Vorhersage", color: "#0077b6", rotation: -10, font: "bold 13px Impact" },
                { type: "box", start: 37, end: 46, color: "#0077b6", label: "← Informations-Fokus (Rhema)" },
                { type: "checkmark", x: 530, y: 30, color: "#0077b6" }
            ]
        }
    ];

    function init() {
        container = document.getElementById('residual-notebook');
        if (!container) return;
        render();
        observeSlideActivation();
    }

    // Beobachte, ob die Residual-Stream-Folie aktiv ist
    function observeSlideActivation() {
        const observer = new MutationObserver(() => {
            const slide = container.closest('.slide');
            if (slide) {
                isActive = slide.classList.contains('active');
            }
        });

        // Beobachte alle Slides auf class-Änderungen
        document.querySelectorAll('.slide').forEach(slide => {
            observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
        });
    }

    function render() {
        container.innerHTML = `
            <div class="notebook-wrapper">
                <div class="notebook-header">
                    <div class="notebook-title">📖 Residual Stream — Das gemeinsame Notizbuch</div>
                    <div class="notebook-layer-info" id="notebook-layer-info">
                        Drücke <kbd style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-size:0.85em;">→</kbd> um die nächste Schicht zu sehen, <kbd style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-size:0.85em;">←</kbd> um zurückzugehen.
                    </div>
                </div>
                <div class="notebook-page" id="notebook-page">
                    <div class="notebook-lines" id="notebook-lines"></div>
                    <div class="notebook-text" id="notebook-text">${baseText}</div>
                    <div class="notebook-annotations" id="notebook-annotations"></div>
                </div>
                <div class="notebook-controls">
                    <div class="notebook-layer-indicators" id="notebook-indicators"></div>
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
		if (currentLayer >= layers.length || animationRunning) return false;
		animationRunning = true; // lock
		const layer = layers[currentLayer];
		animateLayer(layer, () => {
			currentLayer++;
			animationRunning = false; // unlock
			renderIndicators();
			updateInfo();
		});
		return true;
	}

	function prevLayer() {
		if (currentLayer <= 0 || animationRunning) return false;
		currentLayer--;
		rebuildUpToLayer(currentLayer);
		renderIndicators();
		updateInfo();
		return true;
	}

	function rebuildUpToLayer(upTo) {
		const annotationsContainer = document.getElementById('notebook-annotations');
		if (!annotationsContainer) return;
		annotationsContainer.innerHTML = '';

		const textEl = document.getElementById('notebook-text');
		if (!textEl) return;

		// FIX: Clamp upTo to valid range
		const safeUpTo = Math.min(Math.max(0, upTo), layers.length);

		for (let i = 0; i < safeUpTo; i++) {
			const layer = layers[i];
			if (!layer || !layer.annotations) continue; // FIX: guard against undefined
			layer.annotations.forEach(ann => {
				renderAnnotation(ann, annotationsContainer, textEl, layer.color);
			});
		}
	}

    function animateLayer(layer, onComplete) {
        const annotationsContainer = document.getElementById('notebook-annotations');
        const textEl = document.getElementById('notebook-text');
        if (!annotationsContainer || !textEl) return;

        // Info aktualisieren
        const info = document.getElementById('notebook-layer-info');
        if (info) {
            info.innerHTML = `<span style="color:${layer.color}; font-weight:bold;">✍️ ${layer.name} kritzelt...</span><br><span style="color:#64748b; font-size:0.85em;">${layer.description}</span>`;
        }

        let delay = 0;
        const baseDelay = 1;

        layer.annotations.forEach((ann, idx) => {
            setTimeout(() => {
                renderAnnotation(ann, annotationsContainer, textEl, layer.color);
            }, delay);
            delay += baseDelay + Math.random() * 50;
        });

        setTimeout(onComplete, delay + 100);
    }

    function renderAnnotation(ann, container, textEl, defaultColor) {
        const el = document.createElement('div');
        el.className = `nb-annotation nb-annotation-appear nb-type-${ann.type}`;

        const charWidth = 11.5;
        const textTop = 45;
        const textLeft = 30;

        switch (ann.type) {
            case 'underline': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop + 22}px; width:${width}px; height:3px; background:${ann.color}; border-radius:2px;`;
                if (ann.label) {
                    const label = document.createElement('span');
                    label.className = 'nb-label';
                    label.style.cssText = `position:absolute; top:4px; left:0; font-size:10px; color:${ann.color}; white-space:nowrap; font-weight:bold;`;
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
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop - 5}px; width:${width}px; height:30px; border:2.5px solid ${ann.color}; border-radius:50%; pointer-events:none;`;
                break;
            }
            case 'arrow': {
                const fromX = textLeft + ann.from * charWidth + 5;
                const toX = textLeft + ann.to * charWidth + 5;
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.style.cssText = `position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; overflow:visible;`;
                const midX = (fromX + toX) / 2;
                const curveY = textTop - 20 - Math.random() * 15;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${fromX} ${textTop - 5} Q ${midX} ${curveY} ${toX} ${textTop - 5}`);
                path.setAttribute('stroke', ann.color);
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.setAttribute('marker-end', 'url(#arrowhead-' + ann.color.replace('#', '') + ')');

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
                el.style.cssText = `position:absolute; ${x} top:${ann.y}px; transform:${transform}; padding:6px 10px; background:#fffef0; border:1.5px solid ${ann.color}; border-radius:6px; font-size:11px; color:${ann.color}; white-space:pre-line; max-width:180px; line-height:1.4; box-shadow: 2px 2px 6px rgba(0,0,0,0.12); font-family: 'Comic Sans MS', cursive, sans-serif;`;
                el.textContent = ann.text;
                break;
            }
            case 'scribble': {
                const rotation = ann.rotation || 0;
                const font = ann.font || `bold italic 12px 'Comic Sans MS', cursive`;
                el.style.cssText = `position:absolute; left:${textLeft + ann.x}px; top:${textTop + ann.y}px; font:${font}; color:${ann.color}; transform:rotate(${rotation}deg); white-space:pre-line; pointer-events:none; text-shadow: 0 0 1px ${ann.color}33;`;
                el.textContent = ann.text;
                break;
            }
            case 'bracket': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop + 24}px; width:${width}px; height:12px; border-bottom:2.5px solid ${ann.color}; border-left:2.5px solid ${ann.color}; border-right:2.5px solid ${ann.color}; border-radius:0 0 4px 4px;`;
                if (ann.label) {
                    const label = document.createElement('span');
                    label.className = 'nb-label';
                    label.style.cssText = `position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); font-size:10px; color:${ann.color}; white-space:nowrap; font-weight:bold;`;
                    label.textContent = ann.label;
                    el.appendChild(label);
                }
                break;
            }
            case 'strikethrough': {
                const left = textLeft + ann.start * charWidth;
                const width = (ann.end - ann.start) * charWidth;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop + 10}px; width:${width}px; height:2.5px; background:${ann.color}; opacity:0.7; transform:rotate(-1deg);`;
                break;
            }
            case 'box': {
                const left = textLeft + ann.start * charWidth - 6;
                const width = (ann.end - ann.start) * charWidth + 12;
                el.style.cssText = `position:absolute; left:${left}px; top:${textTop - 8}px; width:${width}px; height:38px; border:2.5px dashed ${ann.color}; border-radius:8px; pointer-events:none;`;
                if (ann.label) {
                    const label = document.createElement('span');
                    label.className = 'nb-label';
                    label.style.cssText = `position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:10px; color:${ann.color}; white-space:nowrap; background:#fffef7; padding:0 4px; font-weight:bold;`;
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
            info.innerHTML = `<span style="color:#166534; font-weight:bold;">✅ Alle ${layers.length} Schichten haben geschrieben!</span><br><span style="color:#64748b; font-size:0.85em;">Der Residual Stream enthält nun das gesammelte Wissen aller Experten — von Wortarten bis Pragmatik. Drücke <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.85em;">→</kbd> um zur nächsten Folie zu gehen.</span>`;
        } else if (currentLayer === 0) {
            info.innerHTML = `<span style="color:#64748b;">Drücke <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.85em;">→</kbd> um zu sehen, wie jeder Experte seine Notizen hinzufügt — von einfach bis komplex.</span>`;
        } else {
            const next = layers[currentLayer];
            info.innerHTML = `<span style="color:#64748b;">Schicht ${currentLayer + 1} von ${layers.length} — </span><span style="color:${next.color}; font-weight:bold;">${next.name}</span><br><span style="color:#94a3b8; font-size:0.85em;">${next.description}</span>`;
        }
    }

    function reset() {
        currentLayer = 0;
        animationRunning = false;
        render();
    }

    // Wird vom Presentation-Engine aufgerufen um zu prüfen ob Notebook aktiv ist
    function isOnNotebookSlide() {
        const slide = container ? container.closest('.slide') : null;
        return slide && slide.classList.contains('active');
    }

    function canGoNext() {
        return currentLayer < layers.length;
    }

    function canGoPrev() {
        return currentLayer > 0;
    }

    // Public API
    return { init, nextLayer, prevLayer, reset, isOnNotebookSlide, canGoNext, canGoPrev };
})();

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => ResidualNotebook.init(), 100);
});
