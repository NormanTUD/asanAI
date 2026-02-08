class MultiHeadsAttention {
	constructor(config) {
		this.nHeads = config.nHeads;
		this.dHead = config.dModel / config.nHeads;
		this.heads = Array.from({ length: config.nHeads }, () => new AttentionHead(config.dModel, this.dHead));
		this.outProj = new LinearLayer(config.dModel, config.dModel, "MHA_Out");
	}

	// MultiAttentionHead.js
	forward(x, callback) {
		const headData = this.heads.map((head, i) => {
			const res = head.forward(x);
			if (callback) {
				callback({ headIdx: i, scores: res.scores });
			}
			return res.output; // [seqLen][dHead]
		});

		// Concatenate heads: [seqLen][dModel]
		const combined = x.map((_, i) => headData.flatMap(h => h[i]));

		// FIX: Map the linear projection over each vector in the sequence
		return combined.map(vec => this.outProj.forward(vec));
	}
}
