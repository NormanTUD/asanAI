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

	forward(x, callback) {
		// Calculate Q, K, V for the sequence
		const Q = x.map(vec => this.query.forward(vec));
		const K = x.map(vec => this.key.forward(vec));
		const V = x.map(vec => this.value.forward(vec));

		// Compute Raw Scores (Dot Product)
		let scores = Q.map(q => K.map(k => 
			q.reduce((acc, cur, i) => acc + cur * k[i], 0) / Math.sqrt(this.dHead)
		));

		const attnWeights = scores.map(row => {
			const exps = row.map(Math.exp);
			const sum = exps.reduce((a, b) => a + b, 0);
			return exps.map(e => e / sum);
		});

		if (callback) {
			callback({ scores: attnWeights });
		}

		const output = attnWeights.map(weights => {
			const outVec = new Array(this.dHead).fill(0);
			weights.forEach((w, j) => {
				V[j].forEach((v, k) => outVec[k] += w * v);
			});
			return outVec;
		});

		// Ensure we return both the scores and the output
		return { scores: attnWeights, output: output };
	}

	toLatex(abstract = true) {
		return abstract 
			? `\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V`
			: `\\text{softmax}\\left(\\frac{XW_Q (XW_K)^T}{\\sqrt{d_k}}\\right)XW_V`;
	}
}
