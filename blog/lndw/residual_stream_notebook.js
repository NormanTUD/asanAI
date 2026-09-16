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
    let _buildVersion = 0; // wird bei jedem full rebuild erhöht
    let _retryMap = new Map(); // ann -> Versuchszähler
    let _pendingRenders = new Set(); // rAF-Token laufender Async-Renders
    let _verifyRetry = 0; // Self-Repair-Zähler für fehlende Annotationen

    const baseText = "Die Katze saß auf der Matte weil sie müde war";

    // 5 Stufen: von fundamental bis hochkomplex
    // Base-Text: "Die Katze saß auf der Matte weil sie müde war"
    // Indizes:   D0 i1 e2    K4…e8   s10…ß12  a14…f16  d18…r20  M22…e26  w28…l31  s33…e35  m37…e40  w42…r44
    // Scribbles besitzen "anchor" (Zeichen-Index) und werden über ihr
    // Wort zentriert; "y" bleibt als vertikaler Offset relativ zur Wortlinie.
    const layers = [
        {
            name: "Schicht 1",
            color: "#e63946",
            description: "Erkennt die grundlegendsten Bausteine: Was ist ein Nomen? Ein Verb? Ein Artikel?",
            annotations: [
                { type: "underline", start: 0, end: 3, color: "#e63946", label: "Artikel" },
                { type: "underline", start: 4, end: 9, color: "#d62828", label: "Nomen" },
                { type: "circle", start: 10, end: 13, color: "#e63946" },
                { type: "scribble", anchor: 10, y: -30, text: "VERB!", color: "#e63946", rotation: -8, font: "bold 14px Courier" },
                { type: "underline", start: 14, end: 17, color: "#457b9d", label: "Präp." },
                { type: "underline", start: 18, end: 21, color: "#e63946", label: "Artikel" },
                { type: "underline", start: 22, end: 27, color: "#d62828", label: "Nomen" },
                { type: "scribble", anchor: 28, y: -25, text: "Konjunktion↓", color: "#a8201a", rotation: 12, font: "italic 11px Georgia" },
                { type: "highlight", start: 28, end: 32, color: "rgba(230, 57, 70, 0.15)" },
                { type: "underline", start: 33, end: 36, color: "#6a040f", label: "Pron." },
                { type: "circle", start: 42, end: 45, color: "#e63946" },
                { type: "scribble", anchor: 42, y: -35, text: "auch Verb!", color: "#e63946", rotation: -5, font: "bold 12px Courier New" },
            ]
        },
        {
            name: "Schicht 2",
            color: "#2a9d8f",
            description: "Erkennt Satzglieder, Subjekt-Verb-Beziehungen und Phrasenstruktur.",
            annotations: [
                { type: "bracket", start: 0, end: 9, color: "#2a9d8f", label: "Subjekt (Nominativ)" },
                { type: "arrow", from: 10, to: 4, color: "#2a9d8f", label: "Verb → Subjekt" },
                { type: "bracket", start: 14, end: 27, color: "#264653", label: "Präpositionalphrase (lokal)" },
                { type: "scribble", anchor: 10, y: -45, text: "Subjekt-Verb\nKongruenz: 3.Pers.Sg.", color: "#2a9d8f", rotation: -3, font: "bold 11px monospace" },
                { type: "box", start: 28, end: 45, color: "#2a9d8f", label: "Nebensatz (kausal)" },
                { type: "scribble", anchor: 28, y: 55, text: "← Verb am Ende!\n   (Nebensatz-Regel)", color: "#264653", rotation: 4, font: "italic bold 11px Georgia" },
                { type: "scribble", anchor: 4, y: -50, text: "V2-Stellung ✓", color: "#2a9d8f", rotation: -7, font: "bold 13px Impact" },
            ]
        },
        {
            name: "Schicht 3",
            color: "#e76f51",
            description: "Löst Pronomen auf: Wer ist 'sie'? Worauf bezieht sich was?",
            annotations: [
                { type: "highlight", start: 33, end: 36, color: "rgba(231, 111, 81, 0.35)" },
                { type: "arrow", from: 33, to: 4, color: "#e76f51", label: "sie → Katze" },
                { type: "scribble", anchor: 33, y: -55, text: "\"sie\" = DIE KATZE\n(nicht die Matte!)", color: "#e76f51", rotation: -6, font: "bold 13px Courier" },
                { type: "scribble", anchor: 33, y: -60, text: "Genus-Match:\nKatze=fem → sie=fem ✓\nMatte=fem → sie=fem ✓\n→ Semantik entscheidet!", color: "#e76f51", rotation: 3, font: "11px Courier New" },
                { type: "strikethrough", start: 22, end: 27, color: "#e76f51", label: "" },
                { type: "scribble", anchor: 22, y: 50, text: "Matte kann nicht\nmüde sein! ✗", color: "#c1121f", rotation: -4, font: "bold italic 12px Georgia" },
                { type: "circle", start: 4, end: 9, color: "#e76f51" },
            ]
        },
        {
            name: "Schicht 4",
            color: "#6b21a8",
            description: "Versteht Bedeutungsbeziehungen, Kausalität und semantische Rollen.",
            annotations: [
                { type: "arrow", from: 37, to: 10, color: "#6b21a8", label: "Grund → Handlung" },
                { type: "scribble", anchor: 37, y: -65, text: "KAUSALITÄT:\nmüde → saß\n(nicht umgekehrt!)", color: "#6b21a8", rotation: -4, font: "bold 12px monospace" },
                { type: "highlight", start: 10, end: 13, color: "rgba(107, 33, 168, 0.2)" },
                { type: "scribble", anchor: 10, y: 60, text: "saß = STATISCH\n= passiv, ruhend\n→ passt zu \"müde\"", color: "#7b2cbf", rotation: 5, font: "italic 11px Georgia" },
                { type: "margin-note", x: "left", y: 120, text: "Semantische Rollen:\n• Katze = EXPERIENCER\n• Matte = LOCATION\n• müde = STATE", color: "#6b21a8" },
                { type: "scribble", anchor: 37, y: -55, text: "Kohärenz-Check:\nLebewesen + müde ✓\nObjekt + müde ✗", color: "#6b21a8", rotation: -2, font: "bold 11px Courier New" },
                { type: "box", start: 0, end: 45, color: "#6b21a8", label: "Kohärentes Narrativ ✓" },
                { type: "scribble", anchor: 37, y: 55, text: "Frame: RUHEN\nAgent: Katze\nOrt: Matte\nGrund: Müdigkeit", color: "#9d4edd", rotation: -8, font: "12px monospace" },
                { type: "checkmark", anchor: 42, y: -20, color: "#6b21a8" },
            ]
        },
        {
            name: "Schicht 5",
            color: "#0077b6",
            description: "Versteht den kommunikativen Zweck und bereitet die Vorhersage des nächsten Tokens vor.",
            annotations: [
                { type: "scribble", anchor: 0, y: -75, text: "Informationsstruktur:\nTHEMA: Katze (bekannt)\nRHEMA: müde (neu!)", color: "#023e8a", rotation: 5, font: "italic 11px monospace" },
                { type: "scribble", anchor: 28, y: 65, text: "Diskurs-Erwartung:\nNach Grund-Angabe →\nSatz ist KOMPLETT", color: "#0077b6", rotation: -6, font: "bold 11px Courier" },
                { type: "highlight", start: 37, end: 45, color: "rgba(0, 119, 182, 0.15)" },
                { type: "scribble", anchor: 42, y: -65, text: "FOKUS des Satzes!\n(neue Information)\n→ höchstes Gewicht\nfür Vorhersage", color: "#0077b6", rotation: -10, font: "bold 13px Impact" },
                { type: "box", start: 37, end: 45, color: "#0077b6", label: "← Informations-Fokus" },
                { type: "checkmark", anchor: 42, y: 30, color: "#0077b6" }
            ]
        }
    ];

    function init() {
        container = document.getElementById('residual-notebook');
        if (!container) return;
        render();
        observeSlideActivation();
        installReflowGuards();
    }

    // Guardrail: bei Font-Load, Resize oder Layout-Shift die Annotationen
    // neu ausmessen und neu zeichnen, damit sie exakt auf den Wörtern sitzen.
    function installReflowGuards() {
        const page = document.getElementById('notebook-page');
        if (!page) return;
        const reflow = () => rebuildUpToLayer(Math.min(currentLayer, layers.length));
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => reflow());
            ro.observe(page);
            ro.observe(container);
        }
        window.addEventListener('resize', reflow);
        window.addEventListener('load', reflow);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(reflow);
        }
    }

    // Beobachte, ob die Residual-Stream-Folie aktiv ist
    function observeSlideActivation() {
        const observer = new MutationObserver(() => {
            const slide = container.closest('.slide');
            if (slide) {
                const nowActive = slide.classList.contains('active');
                const becameActive = nowActive && !isActive;
                isActive = nowActive;
                // Sichtwechsel: neu ausmessen (Layout/Scale können sich geändert
                // haben, während die Folie display:none/versteckt war).
                if (becameActive) {
                    _retryMap.clear();
                    rebuildUpToLayer(Math.min(currentLayer, layers.length));
                }
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
                    <div class="notebook-title">📖 Residual Stream: Das gemeinsame Notizbuch</div>
                    <div class="notebook-layer-info" id="notebook-layer-info">
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
		_buildVersion++;
		_pendingRenders.forEach(token => cancelAnimationFrame(token));
		_pendingRenders.clear();
		annotationsContainer.innerHTML = '';

		const textEl = document.getElementById('notebook-text');
		if (!textEl) return;

		// FIX: Clamp upTo to valid range
		const safeUpTo = Math.min(Math.max(0, upTo), layers.length);

		for (let i = 0; i < safeUpTo; i++) {
			const layer = layers[i];
			if (!layer || !layer.annotations) continue; // FIX: guard against undefined
			layer.annotations.forEach(ann => {
				try {
					renderAnnotation(ann, annotationsContainer, textEl, layer.color);
				} catch (err) {
					console.error('[Notebook] Annotation fehlgeschlagen:', ann, err);
				}
			});
		}
		verifyCount(annotationsContainer, safeUpTo);
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

    // ============================================================
    // ANNOTATIONEN AUSGEMESSEN positionieren (statt fester Pixelbreiten)
    // Guardrails: echte Zeichen-Rects via Range, Zeilen-Erkennung bei
    // Umbruch, Retry bis Layout/Fonts fertig, Index-Clamping, Reflow
    // bei Resize/Font-Load.
    // ============================================================

    function textLen() {
        const t = document.getElementById('notebook-text');
        return t ? t.textContent.length : 0;
    }

    // Skalenfaktor der Folie (fitSlides setzt transform:scale(k) auf
    // .slide-content). getBoundingClientRect() liefert dann SKALIERTE
    // Viewport-Koordinaten; platziert man damit innerhalb des ebenfalls
    // skalierten Containers, wird doppelt skaliert und jede Annotation
    // wandert um x*(1-k) nach rechts/wachsen ab. Deshalb messen wir immer
    // in Layout-Px = gBCR / k.
    function containerScale() {
        const cont = document.getElementById('notebook-annotations');
        if (!cont) return 0;
        const layoutW = cont.offsetWidth;
        const layoutH = cont.offsetHeight;
        if (!layoutW || !layoutH) return 0; // nicht gelayoutet (display:none etc.)
        const r = cont.getBoundingClientRect();
        const kw = r.width / layoutW;
        const kh = r.height / layoutH;
        if (!isFinite(kw) || !isFinite(kh) || kw <= 0 || kh <= 0) return 0;
        // anisotrope Skalierung abfangen (Matrix-Fallbacks o.ä.)
        if (Math.abs(kw - kh) > 0.02) return 0;
        return (kw + kh) / 2;
    }

    // Zeichen-Rects relativ zur Annotations-Container-Box, in Layout-Px (transform-fest).
    function measureChars() {
        const textEl = document.getElementById('notebook-text');
        const cont = document.getElementById('notebook-annotations');
        if (!textEl || !cont) return null;
        const node = textEl.firstChild;
        if (!node || node.nodeType !== 3) return null;
        const len = node.textContent.length;
        if (!len) return null;
        const k = containerScale();
        if (k <= 0) return null; // nicht laid out (z.B. hidden)
        const ref = cont.getBoundingClientRect();
        if (!ref.width || !ref.height) return null;
        const range = document.createRange();
        const out = [];
        for (let i = 0; i < len; i++) {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const r = range.getBoundingClientRect();
            out.push({
                left: (r.left - ref.left) / k,
                right: (r.right - ref.left) / k,
                top: (r.top - ref.top) / k,
                bottom: (r.bottom - ref.top) / k,
                line: Math.round(r.top / k)
            });
        }
        try { range.detach(); } catch (e) { /* noop */ }
        const measureable = out.length === len && out.every(r => isFinite(r.left) && isFinite(r.right) && r.right > r.left);
        return measureable ? out : null;
    }

    // Wort um einen Zeichen-Index (für Scribbles/Arrows zentriert).
    function wordSpan(tx, i) {
        let s = i, e = i + 1;
        while (s > 0 && /\S/.test(tx[s - 1])) s--;
        while (e < tx.length && /\S/.test(tx[e])) e++;
        return { s, e };
    }

    // Zeichenbereiche [start,end) in Zeilen-Segmente zerlegen (Umbruch-sicher).
    // Gruppierung mit Toleranz statt exaktem top-Match (Subpixel/Fallback-set).
    function lineSegments(chars, start, end) {
        const segs = [];
        let i = start;
        while (i < end) {
            const r = chars[i];
            if (!r) { i++; continue; }
            let j = i + 1;
            while (j < end && chars[j]) {
                if (Math.abs(chars[j].top - r.top) > 6) break; // neue Zeile
                j++;
            }
            if (j <= i) { i++; continue; }
            segs.push({ s: i, e: j });
            i = j;
        }
        return segs;
    }

    function segRect(chars, seg) {
        const a = chars[seg.s], b = chars[seg.e - 1];
        const top = Math.min(a.top, b.top);
        const bottom = Math.max(a.bottom, b.bottom);
        return { left: a.left, right: b.right, top, bottom, width: b.right - a.left, height: bottom - top };
    }

    function wordCenterX(chars, tx, anchor) {
        const sp = wordSpan(tx, Math.max(0, Math.min(anchor, tx.length - 1)));
        const a = chars[sp.s], b = chars[sp.e - 1];
        return (a.left + b.right) / 2;
    }

    const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;

    // Baut alle Elemente für eine Annotation; null, wenn noch nicht messbar.
    function buildAnnotationEls(ann, textEl) {
        const chars = measureChars();
        const tx = textEl.textContent;
        const len = tx.length;
        if (!chars) return null;
        if (chars.length !== len) return null;

        const els = [];
        const baseCls = `nb-annotation nb-annotation-appear nb-type-${ann.type}`;

        const withLabel = (el, label, css) => {
            if (label) {
                const lb = document.createElement('span');
                lb.className = 'nb-label';
                lb.style.cssText = css;
                lb.textContent = label;
                el.appendChild(lb);
            }
            return el;
        };

        switch (ann.type) {
            case 'underline': {
                const segs = lineSegments(chars, num(ann.start, 0), num(ann.end, len));
                segs.forEach((seg, si) => {
                    const r = segRect(chars, seg);
                    const el = document.createElement('div');
                    el.className = baseCls;
                    el.style.cssText = `position:absolute; left:${r.left.toFixed(2)}px; top:${(r.bottom + 2).toFixed(2)}px; width:${r.width.toFixed(2)}px; height:3px; background:${ann.color}; border-radius:2px;`;
                    els.push(withLabel(el, si === segs.length - 1 ? ann.label : null,
                        `position:absolute; top:4px; left:0; font-size:10px; color:${ann.color}; white-space:nowrap; font-weight:bold;`));
                });
                break;
            }
            case 'highlight': {
                lineSegments(chars, num(ann.start, 0), num(ann.end, len)).forEach(seg => {
                    const r = segRect(chars, seg);
                    const el = document.createElement('div');
                    el.className = baseCls;
                    el.style.cssText = `position:absolute; left:${r.left.toFixed(2)}px; top:${(r.top - 2).toFixed(2)}px; width:${r.width.toFixed(2)}px; height:${(r.height + 4).toFixed(2)}px; background:${ann.color}; border-radius:4px; pointer-events:none;`;
                    els.push(el);
                });
                break;
            }
            case 'circle': {
                lineSegments(chars, num(ann.start, 0), num(ann.end, len)).forEach(seg => {
                    const r = segRect(chars, seg);
                    const el = document.createElement('div');
                    el.className = baseCls;
                    el.style.cssText = `position:absolute; left:${(r.left - 4).toFixed(2)}px; top:${(r.top - 5).toFixed(2)}px; width:${(r.width + 8).toFixed(2)}px; height:${(r.height + 10).toFixed(2)}px; border:2.5px solid ${ann.color}; border-radius:50%; pointer-events:none;`;
                    els.push(el);
                });
                break;
            }
            case 'bracket': {
                const segs = lineSegments(chars, num(ann.start, 0), num(ann.end, len));
                segs.forEach((seg, si) => {
                    const r = segRect(chars, seg);
                    const el = document.createElement('div');
                    el.className = baseCls;
                    el.style.cssText = `position:absolute; left:${r.left.toFixed(2)}px; top:${(r.bottom + 4).toFixed(2)}px; width:${r.width.toFixed(2)}px; height:12px; border-bottom:2.5px solid ${ann.color}; border-left:2.5px solid ${ann.color}; border-right:2.5px solid ${ann.color}; border-radius:0 0 4px 4px;`;
                    els.push(withLabel(el, si === segs.length - 1 ? ann.label : null,
                        `position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); font-size:10px; color:${ann.color}; white-space:nowrap; font-weight:bold;`));
                });
                break;
            }
            case 'strikethrough': {
                lineSegments(chars, num(ann.start, 0), num(ann.end, len)).forEach(seg => {
                    const r = segRect(chars, seg);
                    const el = document.createElement('div');
                    el.className = baseCls;
                    el.style.cssText = `position:absolute; left:${r.left.toFixed(2)}px; top:${((r.top + r.bottom) / 2 - 1.5).toFixed(2)}px; width:${r.width.toFixed(2)}px; height:2.5px; background:${ann.color}; opacity:0.7; transform:rotate(-1deg);`;
                    els.push(el);
                });
                break;
            }
            case 'box': {
                const segs = lineSegments(chars, num(ann.start, 0), num(ann.end, len));
                segs.forEach((seg, si) => {
                    const r = segRect(chars, seg);
                    const el = document.createElement('div');
                    el.className = baseCls;
                    el.style.cssText = `position:absolute; left:${(r.left - 6).toFixed(2)}px; top:${(r.top - 8).toFixed(2)}px; width:${(r.width + 12).toFixed(2)}px; height:${(r.height + 16).toFixed(2)}px; border:2.5px dashed ${ann.color}; border-radius:8px; pointer-events:none;`;
                    els.push(withLabel(el, si === segs.length - 1 ? ann.label : null,
                        `position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:10px; color:${ann.color}; white-space:nowrap; background:#fffef7; padding:0 4px; font-weight:bold;`));
                });
                break;
            }
            case 'arrow': {
                const fromI = Math.max(0, Math.min(ann.from, len - 1));
                const toI = Math.max(0, Math.min(ann.to, len - 1));
                const fromX = wordCenterX(chars, tx, fromI);
                const toX = wordCenterX(chars, tx, toI);
                const minTop = Math.min(chars[fromI].top, chars[toI].top);
                const curveY = minTop - 20 - Math.random() * 15;
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.style.cssText = `position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; overflow:visible;`;
                const midX = (fromX + toX) / 2;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${fromX.toFixed(2)} ${minTop.toFixed(2)} Q ${midX.toFixed(2)} ${curveY.toFixed(2)} ${toX.toFixed(2)} ${minTop.toFixed(2)}`);
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
                    text.setAttribute('x', midX.toFixed(2));
                    text.setAttribute('y', (curveY - 4).toFixed(2));
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', ann.color);
                    text.setAttribute('font-size', '10');
                    text.setAttribute('font-weight', 'bold');
                    text.textContent = ann.label;
                    svg.appendChild(text);
                }

                const el = document.createElement('div');
                el.className = baseCls;
                el.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;';
                el.appendChild(svg);
                els.push(el);
                break;
            }
            case 'margin-note': {
                const x = ann.x === 'right' ? 'right: -10px;' : 'left: -10px;';
                const transform = ann.x === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
                const el = document.createElement('div');
                el.className = baseCls;
                el.style.cssText = `position:absolute; ${x} top:${num(ann.y, 0)}px; transform:${transform}; padding:6px 10px; background:#fffef0; border:1.5px solid ${ann.color}; border-radius:6px; font-size:11px; color:${ann.color}; white-space:pre-line; max-width:180px; line-height:1.4; box-shadow: 2px 2px 6px rgba(0,0,0,0.12); font-family: 'Courier', cursive, sans-serif;`;
                el.textContent = ann.text;
                els.push(el);
                break;
            }
            case 'scribble': {
                const rotation = num(ann.rotation, 0);
                const font = ann.font || `bold italic 12px 'Courier', cursive`;
                const anchor = num(ann.anchor, ann.x == null ? 0 : -1);
                const el = document.createElement('div');
                el.className = baseCls;
                let leftCss = '';
                if (anchor >= 0) {
                    const c = wordCenterX(chars, tx, anchor);
                    const baseTop = chars[Math.max(0, Math.min(anchor, len - 1))].top;
                    leftCss = `left:${c.toFixed(2)}px; transform:translateX(-50%) rotate(${rotation}deg);`;
                    el.style.cssText = `position:absolute; ${leftCss} top:${(baseTop + num(ann.y, -12)).toFixed(2)}px; font:${font}; color:${ann.color}; white-space:pre-line; pointer-events:none; text-shadow: 0 0 1px ${ann.color}33;`;
                } else {
                    el.style.cssText = `position:absolute; left:${num(ann.x, 0)}px; top:${num(ann.y, 0)}px; font:${font}; color:${ann.color}; transform:rotate(${rotation}deg); white-space:pre-line; pointer-events:none; text-shadow: 0 0 1px ${ann.color}33;`;
                }
                el.textContent = ann.text;
                els.push(el);
                break;
            }
            case 'checkmark': {
                const anchor = num(ann.anchor, -1);
                const el = document.createElement('div');
                el.className = baseCls;
                if (anchor >= 0) {
                    const c = wordCenterX(chars, tx, anchor);
                    const baseTop = chars[Math.max(0, Math.min(anchor, len - 1))].top;
                    el.style.cssText = `position:absolute; left:${c.toFixed(2)}px; top:${(baseTop + num(ann.y, 0)).toFixed(2)}px; font-size:28px; color:${ann.color}; transform:translateX(-50%);`;
                } else {
                    el.style.cssText = `position:absolute; left:${num(ann.x, 0)}px; top:${num(ann.y, 0)}px; font-size:28px; color:${ann.color};`;
                }
                el.textContent = '✓';
                els.push(el);
                break;
            }
        }
        return els;
    }

    function renderAnnotation(ann, container, textEl, defaultColor) {
        const buildAt = _buildVersion;
        let els;
        try {
            els = buildAnnotationEls(ann, textEl);
        } catch (err) {
            console.error('[Notebook] Annotation konnte nicht gebaut werden:', ann, err);
            return;
        }
        if (els) {
            els.forEach(el => {
                // Guardrail-Tags: erlauben Selbstprüfung & Debug-Harness,
                // welcher Zeichen-Bereich / Anker für jedes Element gilt.
                if (ann && typeof ann.start === 'number' && typeof ann.end === 'number') {
                    el.dataset.start = ann.start;
                    el.dataset.end = ann.end;
                }
                if (ann && typeof ann.anchor === 'number') {
                    el.dataset.anchor = ann.anchor;
                }
                container.appendChild(el);
            });
            return;
        }
        // Guardrail: Layout/Fonts noch nicht fertig → kurz erneut versuchen.
        // Pro Annotation (nicht pro Container) mit harter Obergrenze.
        const key = ann;
        const tries = (_retryMap.get(key) || 0) + 1;
        _retryMap.set(key, tries);
        if (tries > 120) { _retryMap.delete(key); return; }
        const token = requestAnimationFrame(() => {
            _pendingRenders.delete(token);
            if (buildAt !== _buildVersion) return; // veralteter Render (wurde gewiped)
            renderAnnotation(ann, container, textEl, defaultColor);
        });
        _pendingRenders.add(token);
    }

    // Zählt nach einem Build, ob genau die erwartete Anzahl an Annotationen
    // im DOM liegt; Unstimmigkeit wird geflaggt (Layout- oder Skalierungsproblem).
    function verifyCount(container, upTo) {
        const expected = layers.slice(0, upTo).reduce((n, l) => n + (l.annotations ? l.annotations.length : 0), 0);
        setTimeout(() => {
            if (!container.isConnected) return;
            const got = container.querySelectorAll('.nb-annotation').length;
            if (got !== expected) {
                console.warn('[Notebook] GUARDRAIL: erwartete', expected, 'Annotationen, gefunden', got);
                _verifyRetry++;
                if (_verifyRetry <= 3) rebuildUpToLayer(Math.min(currentLayer, layers.length));
                else _verifyRetry = 0;
            } else {
                _verifyRetry = 0;
            }
        }, 400);
    }

    function updateInfo() {
        const info = document.getElementById('notebook-layer-info');
        if (!info) return;
        if (currentLayer >= layers.length) {
        } else if (currentLayer === 0) {
        } else {
            const next = layers[currentLayer];
            info.innerHTML = `<span style="color:#64748b;">Schicht ${currentLayer + 1} von ${layers.length}, </span><span style="color:${next.color}; font-weight:bold;">${next.name}</span><br><span style="color:#94a3b8; font-size:0.85em;">${next.description}</span>`;
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
