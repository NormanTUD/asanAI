/* =========================================================================
   EXTRACT ME -> blog/origami.js
   Three chunks, each clearly marked. Nothing else in origami.js changes.

   CHUNK A  paste the ogInitRegions() function just ABOVE the module block
              (the one that opens with: async function loadOrigamiModule).
   CHUNK B  inside loadOrigamiModule(), add ONE line to the OG.register() list.
   CHUNK C  replace the cascade readout inside ogInitCascade() so the chapter
              no longer shows the wrong "N^L" (use the real 2^(L*m), Prop. 3).
========================================================================= */


/* ===== CHUNK A: new demo function (paste above the module block) ===== */
/* ------------------------------------------------------------------ Demo: linear-region budget calculator */
function ogInitRegions() {
	const modelSel = document.getElementById('og-regions-model');
	if (!modelSel) return;
	const inL = document.getElementById('og-regions-l');
	const inM = document.getElementById('og-regions-m');
	const inN0 = document.getElementById('og-regions-n0');
	const MODELS = {
		llama7b:  { n0: 4096,  L: 32, m: 11008, note: 'LLaMA-7B (SwiGLU FFN)' },
		llama13b: { n0: 5120,  L: 40, m: 13824, note: 'LLaMA-13B (SwiGLU FFN)' },
		llama70b: { n0: 8192,  L: 80, m: 22016, note: 'LLaMA-70B (SwiGLU FFN)' },
		gpt2:     { n0: 768,   L: 12, m: 3072,  note: 'GPT-2 124M (GELU FFN)' },
		gpt3:     { n0: 12288, L: 96, m: 49152, note: 'GPT-3 175B (GELU FFN)' },
		poker:    { n0: 10,    L: 2,  m: 100,   note: 'Poker net (this chapter, ReLU)' },
		mnist:    { n0: 784,   L: 2,  m: 1024,  note: 'MNIST MLP (ReLU)' }
	};

	/* log C(n,k) via log-gamma (Lanczos) — natural log, stable for big n,k */
	function lgamma(z) {
		const c = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
		if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
		z -= 1;
		let x = 0.99999999999980993;
		for (let i = 0; i < c.length; i++) x += c[i] / (z + i + 1);
		const t = z + 7.5;
		return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
	}
	function logC(n, k) { if (k < 0 || k > n) return -Infinity; return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
	/* natural log of sum_{j=0}^{n0} C(n, j) (log-sum-exp) */
	function logsumC(n, n0) {
		const top = Math.min(n0, n);
		const arr = []; let mx = -Infinity;
		for (let j = 0; j <= top; j++) { const v = logC(n, j); arr.push(v); if (v > mx) mx = v; }
		let s = 0; for (const v of arr) if (isFinite(v)) s += Math.exp(v - mx);
		return mx + Math.log(s);
	}
	/* format a natural-log value as a readable magnitude */
	function fmtPow10(ln) {
		if (!isFinite(ln)) return '—';
		const e = ln / Math.LN10;
		if (e < 6) { const val = Math.round(Math.exp(ln)); return '≈ ' + (isFinite(val) ? val.toLocaleString('en-US') : '—'); }
		const expStr = e < 1e7 ? Math.round(e).toLocaleString('en-US') : e.toExponential(3);
		return '≈ 10<sup>' + expStr + '</sup>';
	}
	function num(id) { const e = document.getElementById(id); return e ? Math.max(1, Math.round(+e.value || 1)) : 1; }

	function draw() {
		const L = num('og-regions-l'), m = num('og-regions-m'), n0 = num('og-regions-n0');
		ogSet('og-regions-l-v', L.toLocaleString('en-US'));
		ogSet('og-regions-m-v', m.toLocaleString('en-US'));
		ogSet('og-regions-n0-v', n0.toLocaleString('en-US'));

		const Ntot = L * m;
		const lnCeil = Ntot * Math.LN2;                                    /* Prop. 3: 2^N */
		const widthOK = m >= n0;
		const prod = widthOK ? (L - 1) * n0 * Math.log(Math.max(1, Math.floor(m / n0))) : NaN;
		const lnDeep = widthOK ? prod + logsumC(m, n0) : NaN;              /* Thm. 4  */
		const lnFlat = logsumC(Ntot, n0);                                  /* Sec. 2.2 */

		ogTex('og-regions-formula',
			String.raw`N_{\max}\;\le\;\underbrace{2^{N}}_{\text{ceiling, Prop.\,3}}\;=\;2^{\,L\cdot m}\;=\;2^{\,` +
			L.toLocaleString('en-US') + `\cdot ` + m.toLocaleString('en-US') +
			String.raw`\,}\;=\;2^{\,` + Ntot.toLocaleString('en-US') + String.raw`\,},\quad N=L\cdot m=` +
			Ntot.toLocaleString('en-US') + String.raw`\;\text{neurons}`, true);

		const results = document.getElementById('og-regions-results');
		if (results) results.innerHTML =
			'<div class="og-legend" style="gap:10px 22px; flex-wrap:wrap; margin:14px 0 4px; font-size:.9rem;">' +
			'<span><span class="og-dot" style="background:var(--og-amber)"></span> Ceiling 2<sup>N</sup>: <b style="font-family:var(--mn-font-mono,monospace)">' + fmtPow10(lnCeil) + '</b></span>' +
			'<span><span class="og-dot" style="background:var(--mn-emerald)"></span> Deep guarantee (Thm. 4): <b style="font-family:var(--mn-font-mono,monospace)">' + (widthOK ? fmtPow10(lnDeep) : 'needs m ≥ n₀') + '</b></span>' +
			'<span><span class="og-dot" style="background:var(--og-outer)"></span> Flat net, same N: <b style="font-family:var(--mn-font-mono,monospace)">' + fmtPow10(lnFlat) + '</b></span>' +
			'</div>';

		const out = document.getElementById('og-regions-out');
		if (out) {
			const eCeil = Math.round(lnCeil / Math.LN10).toLocaleString('en-US');
			let msg = L.toLocaleString('en-US') + ' layers × ' + m.toLocaleString('en-US') +
				' neurons = ' + Ntot.toLocaleString('en-US') + ' neurons → a ceiling of 10<sup>' + eCeil + '</sup> linear slices.';
			if (widthOK) {
				const log10Gain = (lnDeep - lnFlat) / Math.LN10;
				if (log10Gain > 0) {
					const gain = log10Gain > 6 ? '10<sup>' + Math.round(log10Gain).toLocaleString('en-US') + '</sup>×'
						: '≈ ' + Math.max(1, Math.round(Math.exp(lnDeep - lnFlat))).toLocaleString('en-US') + '×';
					msg += ' For n₀=' + n0.toLocaleString('en-US') + ', a <b>deep</b> net provably reaches ~' + gain +
						' more regions than a <b>flat</b> net with the same neurons — that gap is what depth buys.';
				} else {
					msg += ' Here a <b>flat</b> net with the same neurons actually wins: the depth payoff needs <i>both</i> more layers and width ≫ n₀ (spare dimensions to fold into).';
				}
			}
			out.innerHTML = msg;
		}
	}

	modelSel.onchange = (e) => { const mm = MODELS[e.target.value]; if (!mm) return; inN0.value = mm.n0; inL.value = mm.L; inM.value = mm.m; draw(); };
	[inL, inM, inN0].forEach((el) => { if (el) el.oninput = () => { modelSel.value = 'custom'; draw(); }; });
	draw();
	OG.redos.push(draw);
}


/* ===== CHUNK B: register it (add this one line inside loadOrigamiModule) ===== */
/*   OG.register('og-regions', ogInitRegions);   <- alongside the other OG.register(...) calls */


/* ===== CHUNK C: fix the cascade readout (replace these two lines in ogInitCascade) ===== */
/*   BEFORE (wrong):
        const regions = Math.pow(N, L);
        document.getElementById('og-cas-out').innerHTML = 'Upper bound on linear regions ≈ N<sup>L</sup> = ' + N + '<sup>' + L + '</sup> = <b>' + regions + '</b> — depth multiplies boundaries exponentially, not additively.';

   AFTER (real Prop. 3 bound, 2^(L·m)):
*/
	const totalNeurons = L * N;
	const regions = 2n ** BigInt(totalNeurons);
	document.getElementById('og-cas-out').innerHTML = 'Worst-case linear regions ≤ 2<sup>L·m</sup> = 2<sup>' + L + '·' + N + '</sup> = 2<sup>' + totalNeurons + '</sup> = <b>' + regions.toLocaleString('en-US') + '</b> (Prop. 3) — depth multiplies boundaries exponentially, not additively.';
