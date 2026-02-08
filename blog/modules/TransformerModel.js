class TransformerModel {
	constructor(config) {
		this.config = config; // { dModel, nHeads, nLayers, vocabSize }
		this.embedding = new LinearLayer(config.vocabSize, config.dModel, "Embed");
		this.layers = Array.from({ length: config.nLayers }, () => ({
			attention: new MultiHeadsAttention(config),
			mlp: new LinearLayer(config.dModel, config.dModel, "MLP")
		}));
		this.outputProjection = new LinearLayer(config.dModel, config.vocabSize, "Unembed");
		this.callbacks = [];
	}

	addCallback(fn) { this.callbacks.push(fn); }

	forward(inputIds) {
		let x = inputIds.map(id => {
			const oneHot = new Array(this.config.vocabSize).fill(0);
			oneHot[id] = 1;
			return this.embedding.forward(oneHot);
		});

		this.layers.forEach((layer, idx) => {
			// 1. Attention + Residual
			const attOut = layer.attention.forward(x, (internal) => {
				this.callbacks.forEach(cb => cb('attention', { layer: idx, ...internal }));
			});
			x = this.addAndNorm(x, attOut);

			// 2. MLP + Residual
			// Ensure MLP is mapped over the sequence
			const mlpOut = x.map(vec => layer.mlp.forward(vec).map(v => Activations.relu(v)));
			x = this.addAndNorm(x, mlpOut);
		});

		return x.map(vec => this.outputProjection.forward(vec));
	}

	addAndNorm(residual, x) {
		// residual and x should both be [sequence_length][d_model]
		return x.map((vec, i) => {
			if (!Array.isArray(vec)) {
				throw new TypeError(`Expected vec to be an array at index ${i}, but got ${typeof vec}`);
			}
			return vec.map((val, j) => val + residual[i][j]);
		});
	}

	trainStep(inputIds, targetIds, learningRate = 0.01) {
		const logits = this.forward(inputIds);
		const loss = this.computeCrossEntropy(logits, targetIds);

		// Internals are available via callbacks during the forward pass above.
		// Backpropagation implementation would calculate dL/dW here.

		return { loss, logits };
	}

	computeCrossEntropy(logits, targets) {
		return logits.reduce((acc, logit, i) => {
			const soft = this.softmax(logit);
			return acc - Math.log(soft[targets[i]] + 1e-9);
		}, 0) / targets.length;
	}

	softmax(arr) {
		const max = Math.max(...arr);
		const exps = arr.map(v => Math.exp(v - max));
		const sum = exps.reduce((a, b) => a + b, 0);
		return exps.map(v => v / sum);
	}
}
