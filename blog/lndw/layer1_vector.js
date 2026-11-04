// Konkrete Reise eines Vektors durch einen Layer:
// Embedding → Attention-Mix → Residual+Norm → FFN (4→8→4) → Residual.
// Die Formeln werden pro Schritt als LaTeX (Temml) neu gesetzt und
// überblenden weich; die Embeddings stehen fest oben unter den Tokens.
(function () {
	const EMBED_TEX = String.raw`\begin{array}{cc}
\underbrace{\text{Der}}_{\text{Token 1}} & \underbrace{\text{Hund}}_{\text{Token 2}}\\[10pt]
\underbrace{\left[0.1,\;0.5,\;-0.2,\;0.8\right]}_{x_1} &
\underbrace{\left[0.3,\;-0.1,\;0.4,\;0.2\right]}_{x_2}
\end{array}`;

	let stage = 0;

	function setText(id, text) {
		const el = document.getElementById(id);
		if (el) el.textContent = text;
	}

	function texToHtml(tex) {
		try {
			if (typeof temml !== 'undefined' && typeof temml.renderToString === 'function') {
				return temml.renderToString(tex, { displayMode: true });
			}
		} catch (e) { /* Fallback: Rohtext */ }
		return tex;
	}

	function attnTable() {
		return '<table class="attn-matrix sums-visible">' +
			'<tr><td></td><td class="attn-colhead">Der</td><td class="attn-colhead">Hund</td><td class="attn-sumhead">Σ</td></tr>' +
			'<tr><td class="attn-rowhead">Der</td>' +
			'<td class="attn-v" style="background:rgba(59,130,246,0.65)">1.00</td>' +
			'<td class="attn-z">0</td>' +
			'<td class="attn-sumcell"><span class="attn-sum-v">1.00</span><span class="attn-sum-pct">100%</span></td></tr>' +
			'<tr><td class="attn-rowhead">Hund</td>' +
			'<td class="attn-v" style="background:rgba(59,130,246,0.64)">0.80</td>' +
			'<td class="attn-v" style="background:rgba(59,130,246,0.24)">0.20</td>' +
			'<td class="attn-sumcell"><span class="attn-sum-v">1.00</span><span class="attn-sum-pct">100%</span></td></tr>' +
			'</table>';
	}

	function gelu(z) {
		return 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z * z * z)));
	}

	// Kleiner GELU-Plot: zeigt, dass die Aktivierungsfunktion für negative
	// Werte gegen 0 geht und positive Werte fast linear weiterreicht.
	function drawGelu() {
		const canvas = document.getElementById('l1v-gelu-canvas');
		if (!canvas) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = canvas.clientWidth || 280;
		const h = canvas.clientHeight || 88;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		const ctx = canvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);

		const pad = 8;
		const xMin = -3, xMax = 3, yMin = -0.6, yMax = 3.2;
		const px = x => pad + (x - xMin) / (xMax - xMin) * (w - pad * 2);
		const py = y => h - pad - (y - yMin) / (yMax - yMin) * (h - pad * 2);

		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(pad, py(0));
		ctx.lineTo(w - pad, py(0));
		ctx.moveTo(px(0), pad);
		ctx.lineTo(px(0), h - pad);
		ctx.stroke();

		ctx.strokeStyle = '#3b82f6';
		ctx.lineWidth = 2;
		ctx.beginPath();
		for (let i = 0; i <= 120; i++) {
			const x = xMin + (xMax - xMin) * i / 120;
			const X = px(x), Y = py(gelu(x));
			if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
		}
		ctx.stroke();

		ctx.fillStyle = '#64748b';
		ctx.font = '10px system-ui, sans-serif';
		ctx.fillText('GELU(z)', pad + 2, pad + 10);
	}

	const STAGES = [
		{
			title: 'Start: Embedding',
			tex: String.raw`\underbrace{x_2}_{\text{Hund}} = \underbrace{\left[0.3,\;-0.1,\;0.4,\;0.2\right]}_{4\text{ Dimensionen}} \in \mathbb{R}^4`,
			detail: () => '<div><b>Embedding:</b> Die Bedeutung von „Hund" als Vektor mit 4 Dimensionen.</div>'
		},
		{
			title: 'Attention-Mix',
			tex: String.raw`\begin{aligned}
v_{\text{attn}} &= \underbrace{0.8\,V_{\text{Der}} + 0.2\,V_{\text{Hund}}}_{\text{Attention-Mix}}\\
&= \underbrace{\left[0.25,\;0.30,\;0.10,\;0.50\right]}_{v_{\text{attn}}}
\end{aligned}`,
			table: true,
			detail: () => '<div><b>Attention:</b> mischt die Value-Vektoren: 80 % von „Der", 20 % von „Hund".</div>'
		},
		{
			title: 'Residual + Norm',
			tex: String.raw`\begin{aligned}
x &= \mathrm{LayerNorm}\left(\underbrace{x_2 + v_{\text{attn}}}_{\text{Residual}}\right)\\
&= \underbrace{\left[0.4,\;0.2,\;-0.1,\;0.6\right]}_{x}
\end{aligned}`,
			detail: () => '<div><b>LayerNorm</b> macht den Vektor vergleichbar: Mittelwert abziehen, durch die Streuung teilen, dann skalieren und verschieben. Danach hat er Mittelwert 0 und Streuung 1.</div>' +
				'<div class="l1v-detail-tex">' + texToHtml(String.raw`\mu=\frac{1}{4}\sum_i x_i,\qquad \hat{x}_i=\frac{x_i-\mu}{\sigma}`) + '</div>'
		},
		{
			title: 'FFN: 4 → 8',
			tex: String.raw`\begin{aligned}
h &= x\,W_1,\qquad W_1 \in \mathbb{R}^{4\times 8}\\
h_4 &= \underbrace{\begin{bmatrix}0.4\\0.2\\-0.1\\0.6\end{bmatrix}}_{x}
\cdot
\underbrace{\begin{bmatrix}4\\0\\0\\2.5\end{bmatrix}}_{W_{1,4}}
= 3.1
\end{aligned}`,
			detail: () => '<div><b>Ergebnis h</b> (8 Dimensionen): [1.2, -0.5, 0.8, 3.1, -1.0, 0.4, 0.0, 2.5]</div>'
		},
		{
			title: 'GELU',
			tex: String.raw`\begin{aligned}
h' &= \mathrm{GELU}(h)\\
h'_2 &= \mathrm{GELU}\left(\underbrace{-0.5}_{h_2}\right) = 0.0
\end{aligned}`,
			gelu: true,
			detail: () => '<div class="l1v-gelu-wrap"><div><b>GELU</b> ist eine Aktivierungsfunktion. Sie glättet ReLU: große positive Werte bleiben, negative werden klein bzw. 0.</div>' +
				'<canvas id="l1v-gelu-canvas" width="280" height="88"></canvas></div>'
		},
		{
			title: 'FFN: 8 → 4',
			tex: String.raw`\begin{aligned}
y &= h'\,W_2,\qquad W_2 \in \mathbb{R}^{8\times 4}\\
y_2 &= h'\cdot\underbrace{\begin{bmatrix}0\\0\\-0.3\\0\\0\\0.5\\0\\0\end{bmatrix}}_{W_{2,2}} = -0.05
\end{aligned}`,
			detail: () => '<div><b>h′ = GELU(h)</b> = [1.15, 0.0, 0.75, 3.1, 0.0, 0.35, 0.0, 2.45]</div>' +
				'<div><b>Ergebnis y</b> (4 Dimensionen): [0.15, -0.05, 0.20, 0.10]</div>'
		},
		{
			title: 'Residual → Layer 2',
			tex: String.raw`\begin{aligned}
x' &= \underbrace{x}_{\textcolor{#2563eb}{\left[0.4,\;0.2,\;-0.1,\;0.6\right]}} +
\underbrace{y}_{\textcolor{#f59e0b}{\left[0.15,\;-0.05,\;0.20,\;0.10\right]}}\\
&= \left[
\textcolor{#2563eb}{0.4}+\textcolor{#f59e0b}{0.15},\;
\textcolor{#2563eb}{0.2}\textcolor{#f59e0b}{-0.05},\;
\textcolor{#2563eb}{-0.1}+\textcolor{#f59e0b}{0.20},\;
\textcolor{#2563eb}{0.6}+\textcolor{#f59e0b}{0.10}
\right]\\
&= \underbrace{\left[
\textcolor{#10b981}{0.55},\;
\textcolor{#10b981}{0.15},\;
\textcolor{#10b981}{0.10},\;
\textcolor{#10b981}{0.70}
\right]}_{x' \text{ → nächster Layer}}
\end{aligned}`,
			detail: () => '<div><b>Farben:</b> <span style="color:#2563eb">x</span> = Vektor vor dem FFN, ' +
				'<span style="color:#f59e0b">y</span> = FFN-Beitrag, ' +
				'<span style="color:#10b981">x′</span> = neuer Vektor für „Hund" → nächster Layer.</div>'
		}
	];

	function renderStage(animate) {
		const st = STAGES[stage];
		setText('l1v-title', st.title);
		setText('l1v-step', 'Schritt ' + (stage + 1) + ' / ' + STAGES.length);

		const host = document.getElementById('l1v-formula-stage');
		if (!host) return;
		const olds = Array.from(host.querySelectorAll('.l1v-formula-layer'));

		const layer = document.createElement('div');
		layer.className = 'l1v-formula-layer';
		if (st.table) {
			layer.innerHTML = '<div class="l1v-attn-row">' + attnTable() +
				'<div class="l1v-attn-tex">' + texToHtml(st.tex) + '</div></div>';
		} else {
			layer.innerHTML = texToHtml(st.tex);
		}
		host.appendChild(layer);

		if (animate) {
			layer.offsetHeight;
			requestAnimationFrame(function () { layer.classList.add('in'); });
		} else {
			layer.classList.add('in');
		}

		if (olds.length) {
			if (animate) {
				setTimeout(function () {
					olds.forEach(function (el) { el.remove(); });
				}, 380);
			} else {
				olds.forEach(function (el) { el.remove(); });
			}
		}

		const detail = document.getElementById('l1v-detail');
		if (detail) {
			detail.innerHTML = st.detail ? st.detail() : '';
			if (st.gelu) requestAnimationFrame(drawGelu);
		}
	}

	function init() {
		const embed = document.getElementById('l1v-embed');
		if (embed && !embed.dataset.built) {
			embed.dataset.built = '1';
			embed.innerHTML = texToHtml(EMBED_TEX);
		}
		if (!document.getElementById('l1v-formula-stage')) return;
		renderStage(false);
	}

	function next() {
		if (stage >= STAGES.length - 1) return;
		stage++;
		renderStage(true);
	}

	function prev() {
		if (stage <= 0) return;
		stage--;
		renderStage(true);
	}

	function reset() {
		stage = 0;
		renderStage(false);
	}

	window.Layer1Vector = { next: next, prev: prev, reset: reset, init: init };

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
