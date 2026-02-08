class AttentionHead {
	constructor(dModel, dHead) {
		this.dHead = dHead;
		this.query = new LinearLayer(dModel, dHead, "Q");
		this.key = new LinearLayer(dModel, dHead, "K");
		this.value = new LinearLayer(dModel, dHead, "V");
	}

	softmax(arr) {
		const maxVal = Math.max(...arr);
		const exps = arr.map(x => Math.exp(x - maxVal));
		const sumExps = exps.reduce((a, b) => a + b, 0);
		return exps.map(x => x / sumExps);
	}

	forward(seq) {
		// seq: Array of token vectors [[dModel], [dModel], ...]
		const Q = seq.map(tokens => this.query.forward(tokens));
		const K = seq.map(tokens => this.key.forward(tokens));
		const V = seq.map(tokens => this.value.forward(tokens));

		const n = seq.length;
		const scores = Array.from({ length: n }, () => new Array(n).fill(0));
		const scale = Math.sqrt(this.dHead);

		// QK^T / sqrt(dk)
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				let dot = 0;
				for (let k = 0; k < this.dHead; k++) {
					dot += Q[i][k] * K[j][k];
				}
				scores[i][j] = dot / scale;
			}
			scores[i] = this.softmax(scores[i]);
		}

		// Attention * V
		const output = Array.from({ length: n }, () => new Array(this.dHead).fill(0));
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < this.dHead; j++) {
				let sum = 0;
				for (let k = 0; k < n; k++) {
					sum += scores[i][k] * V[k][j];
				}
				output[i][j] = sum;
			}
		}
		return { output, scores };
	}

	toLatex(abstract = true) {
		return abstract 
			? `\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V`
			: `\\text{softmax}\\left(\\frac{XW_Q (XW_K)^T}{\\sqrt{d_k}}\\right)XW_V`;
	}
}
