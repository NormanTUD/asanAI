class LinearLayer {
	constructor(inDim, outDim, name = "linear") {
		this.name = name;
		this.inDim = inDim;
		this.outDim = outDim;
		// Xavier/Glorot Initialization
		const limit = Math.sqrt(6 / (inDim + outDim));
		this.weights = Array.from({ length: inDim }, () => 
			Array.from({ length: outDim }, () => (Math.random() * 2 - 1) * limit)
		);
		this.bias = new Array(outDim).fill(0);
	}

	forward(input) {
		// input: [batch, inDim] or [inDim]
		const output = new Array(this.outDim).fill(0);
		for (let j = 0; j < this.outDim; j++) {
			let sum = 0;
			for (let i = 0; i < this.inDim; i++) {
				sum += input[i] * this.weights[i][j];
			}
			output[j] = sum + this.bias[j];
		}
		return output;
	}

	getWeights() { return { w: this.weights, b: this.bias }; }
	setWeights(w, b) { this.weights = w; this.bias = b; }

	toLatex(abstract = true) {
		if (abstract) return `Y = XW_{${this.name}} + b_{${this.name}}`;
		let matrixStr = this.weights.map(row => row.map(v => v.toFixed(2)).join(" & ")).join(" \\\\ ");
		return `\\underbrace{\\begin{pmatrix} ${matrixStr} \\end{pmatrix}}_{W} + \\vec{b}`;
	}
}
