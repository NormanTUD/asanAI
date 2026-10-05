/* ============================================================
   LOSS — "eine Zahl für wie falsch"
   Katze-Hund-Detektor auf EINEM Bild, mehrere Ausgaben.
   Loss = -ln(p) für p = P(Katze) bei one-hot Target "Katze".

   >>> ZUM ÄNDERN: nur CONFIG und die Chips in index.html <<<
   ============================================================ */

const LossDemo = {
	// >>> CONFIG >>>
	// Die Vorhersage-Schritte der Demo (P(Katze)).
	// 0.51 und 0.99 sind das Kernbeispiel: beide sagen "Katze",
	// der Loss ist aber 67x größer.
	PRESETS: [0.51, 0.75, 0.90, 0.99, 1.00],
	START: 0,
	IMG: 'img/katze1.jpg',
	// <<< CONFIG <<<

	_step: 0,
	_ready: false,
	_initialized: false,

	init: function () {
		if (this._initialized) { this.show(); return; }
		this._initialized = true;

		const bar = document.getElementById('loss-bar-cat');
		const pct = document.getElementById('loss-pct');
		const dog = document.getElementById('loss-dogpct');
		const pEl = document.getElementById('loss-p');
		const num = document.getElementById('loss-num');
		const cmp = document.getElementById('loss-compare');
		if (!bar || !pct || !num) return;

		// Chips aus CONFIG erzeugen
		if (cmp) {
			cmp.innerHTML = LossDemo.PRESETS.map((p, i) =>
				'<button class="loss-chip" data-i="' + i + '" type="button">' +
				'<span class="loss-chip-p">' + LossDemo.fmtPct(p) + '</span>' +
				'<span class="loss-chip-l">' + LossDemo.fmt(LossDemo.lossOf(p), 3) + '</span>' +
				'</button>').join('');
			cmp.addEventListener('click', (e) => {
				const b = e.target.closest('.loss-chip');
				if (b) { LossDemo._step = parseInt(b.dataset.i, 10); LossDemo.show(); }
			});
		}

		this._ready = true;
		this._els = { bar: bar, pct: pct, p: pEl, num: num, cmp: cmp, dog: dog };
		this.show();
	},

	// Binary Cross-Entropy für ein Beispiel, Target = Katze (1)
	lossOf: function (p) {
		const q = Math.min(Math.max(p, 1e-9), 1);
		return -Math.log(q);
	},

	show: function () {
		if (!this._ready) return;
		const p = this.PRESETS[this._step];
		const L = this.lossOf(p);

		this._els.bar.style.width = (p * 100).toFixed(1) + '%';
		this._els.pct.textContent = this.fmt(p * 100, 0);
		if (this._els.dog) this._els.dog.textContent = this.fmt((1 - p) * 100, 0);
		if (this._els.p) this._els.p.textContent = this.fmt(p, 2);
		this._els.num.textContent = this.fmt(L, 3);

		// Loss color-codieren: hoch = rot, niedrig = grün
		const t = Math.min(L / 0.7, 1);
		const col = t > 0.66 ? '#dc2626' : (t > 0.33 ? '#d97706' : '#16a34a');
		this._els.num.style.color = col;

		if (this._els.cmp) {
			this._els.cmp.querySelectorAll('.loss-chip').forEach((c, i) =>
				c.classList.toggle('active', i === this._step));
		}
	},

	// Pfeiltasten: durch die Vorhersagen blättern (Haus-API, s. hierarchy.js)
	step: function (dir) {
		this._step = Math.min(Math.max(this._step + dir, 0), this.PRESETS.length - 1);
		this.show();
	},

	canGoNext: function () { return this._ready && this._step < this.PRESETS.length - 1; },
	canGoPrev: function () { return this._ready && this._step > 0; },
	prev: function () { this.step(-1); },
	next: function () { this.step(1); },
	reset: function () { this._step = this.START; this.show(); },

	fmt: function (n, d) {
		return n.toFixed(d).replace('.', ',');
	},
	fmtPct: function (p) {
		return this.fmt(p * 100, 0) + ' %';
	},
};

if (typeof window !== 'undefined') window.LossDemo = LossDemo;
