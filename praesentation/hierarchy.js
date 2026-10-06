/* ============================================================
   HIERARCHIE — vom Foto zum Stoppschild
   Echte Convolution auf img/stop_sign.jpg mit den Sobel-Kerneln
   aus blog/computer_vision.js:
     Filterpaar -> Kantenerkennung -> das Wichtigste extrahieren
     -> vereinfacht weiterarbeiten

   >>> ZUM ÄNDERN: nur CONFIG, STAGES und die KERNEL <<<
   ============================================================ */

const HierarchyDemo = {
	// >>> CONFIG >>>
	IMG: 'img/stop_sign.jpg',
	SIZE: 150,          // Arbeitskantenlaenge in px (Bild wird skaliert geladen)
	K: 3,               // Kernelgroesse
	SCHWELLE: 0.22,     // ab hier gilt eine Kante als "wichtig"
	POOL: 2,            // Faktor fuer die Vereinfachung
	// <<< CONFIG <<<

	// 3x3-Kernels (Sobel-Typ), Reihenfolge = Reihenfolge in der Folie.
	// Die Namen beschreiben die KANTE, auf die der Filter antwortet — nicht
	// einen Winkel. (Eine Gradzahl ist in Bildschirmkoordinaten y-abwaerts
	// mehrdeutig: der Filter [[0,1,2],[-1,0,1],[-2,-1,0]] antwortet auf eine
	// Kante, die von links oben nach rechts unten läuft, nicht auf 45 Grad.
	// Verifiziert über eine Testkante je Richtung — siehe Validierung.)
	KERNELS: [
		{ name: 'waagerechte Kante', m: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
		{ name: 'senkrechte Kante', m: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
		{ name: 'schräg ↘', m: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
		{ name: 'schräg ↗', m: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
	],

	// Die 5 Stationen. max = Anzahl Pfeiltasten auf dieser Folie.
	STAGES: [
		{ id: 'orig', max: 5, label: 'Original', num: 'Pixel' },
		{ id: 'kanten', max: 5, label: 'Kanten aus 2 Filtern', num: 'Filter' },
		{ id: 'ecken', max: 5, label: 'Ecken: alle 4 Filter', num: 'Filter' },
		{ id: 'extrahiert', max: 5, label: 'Das Wichtigste', num: 'Pixel' },
		{ id: 'vereinfacht', max: 5, label: 'Vereinfacht', num: 'Pixel' },
	],

	_step: 0,
	_ready: false,
	_initialized: false,

	init: function () {
		if (this._initialized) { this.show(); return; }
		this._initialized = true;

		const host = document.getElementById('hier-panels');
		if (!host) return;

		this._buildPanels(host);
		this._buildKernels();
		this._reserveCaptionHeight();
		if (typeof window.fitSlides === 'function') window.fitSlides();

		if (!this._resizeBound) {
			this._resizeBound = true;
			window.addEventListener('resize', () => this._reserveCaptionHeight());
		}

		this.load().then(() => { this._ready = true; this.show(); });
	},

	// ---------------------------------------------------------------
	_buildPanels: function (host) {
		host.innerHTML = HierarchyDemo.STAGES.map((s, i) =>
			'<div class="hier-panel" data-stage="' + s.id + '">' +
			'<div class="hier-canvas-wrap">' +
			'<canvas class="hier-canvas" id="hier-canvas-' + s.id + '" width="' +
			HierarchyDemo.CANVAS + '" height="' + HierarchyDemo.CANVAS + '"></canvas>' +
			'<div class="hier-wait" id="hier-wait-' + s.id + '">wartet</div>' +
			'</div>' +
			'<div class="hier-label">' + s.label + '</div>' +
			'<div class="hier-num" id="hier-num-' + s.id + '">–</div>' +
			'</div>').join('');
	},

	_buildKernels: function () {
		const host = document.getElementById('hier-kernels');
		if (!host) return;
		host.innerHTML = HierarchyDemo.KERNELS.map((k) =>
			'<div class="hier-kernel">' +
			'<div class="hier-kernel-name">' + k.name + '</div>' +
			'<div class="hier-kernel-grid">' +
			k.m.map(row => row.map(v =>
				'<span class="' + (v > 0 ? 'pos' : (v < 0 ? 'neg' : 'zero')) + '">' +
				(v > 0 ? '+' : '') + v + '</span>').join('')
			).join('') +
			'</div></div>').join('');
	},

	_reserveCaptionHeight: function () {
		const cap = document.getElementById('hier-caption');
		if (!cap) return;
		const prev = cap.innerHTML;
		let max = 0;
		for (const c of HierarchyDemo.CAPTIONS) {
			cap.innerHTML = c;
			const h = cap.offsetHeight;
			if (h > max) max = h;
		}
		cap.innerHTML = prev;
		if (max > 0) cap.style.minHeight = max + 'px';
	},

	// ---------------------------------------------------------------
	// Bild laden -> Graustufen
	load: function () {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const S = HierarchyDemo.SIZE;
				const c = document.createElement('canvas');
				c.width = S; c.height = Math.round(S * img.naturalHeight / img.naturalWidth);
				const ctx = c.getContext('2d');
				ctx.drawImage(img, 0, 0, c.width, c.height);
				const d = ctx.getImageData(0, 0, c.width, c.height).data;

				const n = c.width * c.height;
				const g = new Float32Array(n);
				for (let i = 0; i < n; i++) {
					g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
				}
				HierarchyDemo._w = c.width;
				HierarchyDemo._h = c.height;
				HierarchyDemo._gray = g;
				HierarchyDemo._compute();
				resolve();
			};
			img.onerror = () => reject(new Error('stop_sign.jpg nicht ladbar'));
			img.src = HierarchyDemo.IMG;
		});
	},

	// Alle Feature-Maps einmal berechnen (nicht pro Schritt)
	_compute: function () {
		const D = HierarchyDemo, w = D._w, h = D._h;
		D._maps = D.KERNELS.map(k => D._normalize(D._convolve(D._gray, w, h, k.m)));

		// Kombinieren: Summe der Quadrate -> Ecken und Knoten leuchten auf
		const comb = new Float32Array(w * h);
		for (const m of D._maps) for (let i = 0; i < comb.length; i++) comb[i] += m[i] * m[i];
		D._combined = D._normalize(comb);

		// Extrahieren: nur starke Antworten behalten
		const ex = new Float32Array(w * h);
		let kept = 0;
		for (let i = 0; i < ex.length; i++) {
			if (D._combined[i] >= D.SCHWELLE) { ex[i] = D._combined[i]; kept++; }
		}
		D._extracted = ex;
		D._kept = kept;
		D._total = w * h;

		// Vereinfachen: Pooling haelt die stärkste Kante pro Block
		D._pooled = D._pool(D._extracted, w, h, D.POOL);
	},

	// 'valid' Convolution, Betrag, ohne Rand
	_convolve: function (src, w, h, m) {
		const out = new Float32Array((w - 2) * (h - 2));
		let o = 0;
		for (let y = 1; y < h - 1; y++) {
			for (let x = 1; x < w - 1; x++) {
				let s = 0;
				for (let ky = 0; ky < 3; ky++)
					for (let kx = 0; kx < 3; kx++)
						s += src[(y - 1 + ky) * w + (x - 1 + kx)] * m[ky][kx];
				out[o++] = Math.abs(s);
			}
		}
		return out;
	},

	_normalize: function (a) {
		let mx = 0;
		for (const v of a) if (v > mx) mx = v;
		if (mx > 0) for (let i = 0; i < a.length; i++) a[i] /= mx;
		return a;
	},

	_pool: function (src, w, h, f) {
		const pw = Math.floor(w / f), ph = Math.floor(h / f);
		const out = new Float32Array(pw * ph);
		for (let y = 0; y < ph; y++)
			for (let x = 0; x < pw; x++) {
				let mx = 0;
				for (let dy = 0; dy < f; dy++)
					for (let dx = 0; dx < f; dx++) {
						const v = src[(y * f + dy) * w + (x * f + dx)];
						if (v > mx) mx = v;
					}
				out[y * pw + x] = mx;
			}
		return out;
	},

	// ---------------------------------------------------------------
	// Zeichnen

	// Feature-Map in der Heatmap-Farbe (dunkel -> bernstein -> hell)
	_paint: function (canvasId, data, w, h) {
		const cv = document.getElementById(canvasId);
		if (!cv || !data || !w || !h) return;
		const N = HierarchyDemo.CANVAS;
		const tmp = document.createElement('canvas');
		tmp.width = w; tmp.height = h;
		const tctx = tmp.getContext('2d');
		const img = tctx.createImageData(w, h);

		for (let i = 0; i < data.length; i++) {
			const [r, g, b] = HierarchyDemo._heat(Math.min(1, data[i]));
			img.data[i * 4] = r;
			img.data[i * 4 + 1] = g;
			img.data[i * 4 + 2] = b;
			img.data[i * 4 + 3] = 255;
		}
		tctx.putImageData(img, 0, 0);

		cv.width = N; cv.height = N;
		const ctx = cv.getContext('2d');
		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(tmp, 0, 0, N, N);
	},

	_heat: function (v) {
		// 0 -> dunkelblau, 0.5 -> bernstein, 1 -> hell
		if (v <= 0.5) {
			const t = v / 0.5;
			return [Math.round(11 + t * (251 - 11)), Math.round(18 + t * (191 - 18)), Math.round(32 + t * (36 - 32))];
		}
		const t = (v - 0.5) / 0.5;
		return [Math.round(251 + t * (255 - 251)), Math.round(191 + t * (241 - 191)), Math.round(36 + t * (197 - 36))];
	},

	_paintGray: function (canvasId, gray, w, h) {
		const cv = document.getElementById(canvasId);
		if (!cv) return;
		const N = HierarchyDemo.CANVAS;
		const tmp = document.createElement('canvas');
		tmp.width = w; tmp.height = h;
		const ictx = tmp.getContext('2d');
		const img = ictx.createImageData(w, h);
		for (let i = 0; i < gray.length; i++) {
			const v = Math.round(Math.min(255, gray[i]));
			img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v;
			img.data[i * 4 + 3] = 255;
		}
		ictx.putImageData(img, 0, 0);
		const ctx = cv.getContext('2d');
		cv.width = N; cv.height = N;
		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(tmp, 0, 0, N, N);
	},

	// ---------------------------------------------------------------
	show: function () {
		const D = HierarchyDemo;
		if (!D._ready) return;
		const s = D._step;

		// welche Panels sind sichtbar?
		D.STAGES.forEach((st, i) => {
			const panel = document.querySelector('.hier-panel[data-stage="' + st.id + '"]');
			if (!panel) return;
			const on = i <= s;
			panel.classList.toggle('active', on);
			const wait = document.getElementById('hier-wait-' + st.id);
			if (wait) wait.style.display = on ? 'none' : 'flex';
		});

		// Station 0: Original
		if (s >= 0) {
			D._paintGray('hier-canvas-orig', D._gray, D._w, D._h);
			D._setNum('orig', D._total.toLocaleString('de-DE') + ' Pixel');
		}
		// Station 1: zwei Kanten-Filter (vertikal + waagerecht)
		if (s >= 1) {
			D._paint('hier-canvas-kanten', D._combinePair(D._maps[0], D._maps[1]), D._w - 2, D._h - 2);
			D._setNum('kanten', D.KERNELS[0].name + ' + ' + D.KERNELS[1].name);
		}
		// Station 2: alle vier Filter kombiniert
		if (s >= 2) {
			D._paint('hier-canvas-ecken', D._combined, D._w - 2, D._h - 2);
			D._setNum('ecken', '4 Filter');
		}
		// Station 3: extrahiert
		if (s >= 3) {
			D._paint('hier-canvas-extrahiert', D._extracted, D._w - 2, D._h - 2);
			const pct = Math.round(100 * D._kept / D._total);
			D._setNum('extrahiert', (100 - pct) + ' % weg · ' + pct + ' % übrig');
		}
		// Station 4: vereinfacht
		if (s >= 4) {
			D._paint('hier-canvas-vereinfacht', D._pooled, Math.floor((D._w - 2) / D.POOL), Math.floor((D._h - 2) / D.POOL));
			const pw = Math.floor((D._w - 2) / D.POOL), ph = Math.floor((D._h - 2) / D.POOL);
			D._setNum('vereinfacht', pw + '×' + ph + ' = ' + (pw * ph).toLocaleString('de-DE'));
		}

		const cap = document.getElementById('hier-caption');
		if (cap) cap.innerHTML = D.CAPTIONS[Math.min(s, D.CAPTIONS.length - 1)];
		const bar = document.getElementById('hier-progress');
		if (bar) {
			bar.querySelectorAll('.hier-dot').forEach((d, i) => d.classList.toggle('on', i <= s));
		}
	},

	CAPTIONS: [
		'<b>Ein Foto.</b> Nichts davon ist „Stoppschild" — nur Zahlen: ' +
		'<span class="mono">0…255</span> pro Pixel. Ein Netz sieht diese Matrix, nicht das Bild.',
		'<b>Ein Filterpaar.</b> Zwei 3×3-Kernel, jeder sucht nur eine Richtung: ' +
		'wo es hell wird, ist eine waagerechte bzw. senkrechte Kante. ' +
		'Das Oktogon wird zum Umriss, das S zu Strichen.',
		'<b>Alle vier Filter zusammen.</b> Quadriert man die Antworten, ' +
		'leuchten genau die <b>Ecken</b>: die acht Ecken des Oktogons, die Enden des S, ' +
		'die Ecken der Buchstaben. Der Filterpaar hat nur Linien geliefert, ' +
		'die Kombination macht aus Linien Ecken.',
		'<b>Das Wichtigste rausziehen.</b> Alles unter der Schwelle fliegt raus. ' +
		'Übrig bleiben nur die Kanten — ein Bruchteil der Pixel.',
		'<b>Und vereinfachen.</b> Von jedem Block bleibt die stärkste Kante. ' +
		'Das Bild schrumpft um den Faktor ' + '2' + ' in jeder Richtung, ' +
		'aber die <b>Form bleibt</b>: ein Oktogon mit S. Genau das verarbeitet die nächste Schicht weiter.',
	],

	_combinePair: function (a, b) {
		const out = new Float32Array(a.length);
		for (let i = 0; i < a.length; i++) out[i] = Math.sqrt(a[i] * a[i] + b[i] * b[i]);
		return HierarchyDemo._normalize(out);
	},

	_setNum: function (id, text) {
		const el = document.getElementById('hier-num-' + id);
		if (el) el.textContent = text;
	},

	// Pfeiltasten — Haus-API (siehe convolution.js / flatten.js):
	// canGoNext/next/canGoPrev/prev. Ohne 'block' in der DemoRegistry,
	// damit die Pfeiltaste am Ende der Strecke die Folie wechselt.
	next: function () {
		HierarchyDemo._step = Math.min(HierarchyDemo._step + 1, HierarchyDemo.STAGES.length - 1);
		HierarchyDemo.show();
	},
	prev: function () {
		HierarchyDemo._step = Math.max(HierarchyDemo._step - 1, 0);
		HierarchyDemo.show();
	},
	canGoNext: function () { return HierarchyDemo._ready && HierarchyDemo._step < HierarchyDemo.STAGES.length - 1; },
	canGoPrev: function () { return HierarchyDemo._ready && HierarchyDemo._step > 0; },
	reset: function () { HierarchyDemo._step = 0; HierarchyDemo.show(); },

	// Zustand merken/wiederherstellen (Presentation.js speichert ihn pro
	// Folie, damit Rückwärts-Navigation exakt dort landet, wo man war).
	getState: function () { return { step: HierarchyDemo._step }; },
	setState: function (st) {
		if (!st || typeof st.step !== 'number') return;
		HierarchyDemo._step = Math.min(Math.max(st.step, 0), HierarchyDemo.STAGES.length - 1);
		HierarchyDemo.show();
	},
};

HierarchyDemo.CANVAS = 190;

if (typeof window !== 'undefined') window.HierarchyDemo = HierarchyDemo;
