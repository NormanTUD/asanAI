const FittingLab = {
	trainRange: [0, 6],     // Where the dots are
	viewRange: [-4, 10],    // Full view (multiple periods)
	numPoints: 40,
	isTraining: false,
	model: null,
	data: { xTrain: [], yTrain: [], xTrue: [], yTrue: [] },

	init: function() {
		this.generateData();
		this.setupListeners();
		this.updateModelAndPlot();
	},

	setupListeners: function() {
		const update = () => {
			this.generateData();
			if (this.isTraining) this.trainLoop();
			else this.updateModelAndPlot();
		};

		document.getElementById('slider-degree').oninput = (e) => {
			document.getElementById('label-degree').innerText = e.target.value;
			update();
		};
		document.getElementById('slider-noise').oninput = (e) => {
			document.getElementById('label-noise').innerText = e.target.value;
			update();
		};

		const btn = document.getElementById('btn-toggle-train');
		btn.onclick = () => {
			this.isTraining = !this.isTraining;
			btn.innerText = this.isTraining ? "🛑 Stop Training" : "🚀 Start Training";
			btn.style.background = this.isTraining ? "#ef4444" : "#22c55e";
			if (this.isTraining) this.trainLoop();
		};

		document.getElementById('slider-degree').oninput = (e) => {
			document.getElementById('label-degree').innerText = e.target.value;
			// Immediate update for reactivity
			this.updateModelAndPlot();
		};
	},

	generateData: function() {
		const noise = parseFloat(document.getElementById('slider-noise').value);
		this.data.xTrain = [];
		this.data.yTrain = [];
		this.data.xTrue = [];
		this.data.yTrue = [];

		// 1. Generate the 'Truth' (dotted line) for the whole view
		for (let x = this.viewRange[0]; x <= this.viewRange[1]; x += 0.1) {
			this.data.xTrue.push(x);
			this.data.yTrue.push(Math.sin(x));
		}

		// 2. Generate training points ONLY in the training range
		for (let i = 0; i < this.numPoints; i++) {
			const x = this.trainRange[0] + Math.random() * (this.trainRange[1] - this.trainRange[0]);
			const y = Math.sin(x) + (Math.random() - 0.5) * 2 * noise;
			this.data.xTrain.push(x);
			this.data.yTrain.push(y);
		}
	},

	expand: function(t, degree) {
		return tf.tidy(() => {
			let res = t;
			for (let i = 2; i <= degree; i++) {
				res = tf.concat([res, t.pow(tf.scalar(i))], 1);
			}
			return res;
		});
	},

	updateModelAndPlot: async function() {
		const degree = parseInt(document.getElementById('slider-degree').value);
		if (this.model) this.model.dispose();

		this.model = tf.sequential();
		this.model.add(tf.layers.dense({ 
			units: 1, 
			inputShape: [degree],
			kernelInitializer: 'zeros' // Starts the equation at 0
		}));
		this.model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });

		// NEW: Update the equation and plot immediately before training starts
		this.updateEquation(degree); 
		await this.visualize();
	},

	trainLoop: async function() {
		if (!this.isTraining) return;
		const degree = parseInt(document.getElementById('slider-degree').value);

		const xt = tf.tensor2d(this.data.xTrain, [this.data.xTrain.length, 1]);
		const yt = tf.tensor2d(this.data.yTrain, [this.data.yTrain.length, 1]);
		const inputs = this.expand(xt, degree);

		document.getElementById('train-status').innerText = "Learning...";

		while (this.isTraining) {
			const h = await this.model.fit(inputs, yt, { epochs: 15, verbose: 0 });
			document.getElementById('loss-train').innerText = h.history.loss[0].toFixed(6);

			await this.visualize();
			this.updateEquation(degree);
			await tf.nextFrame();
		}

		tf.dispose([xt, yt, inputs]);
	},

	visualize: async function() {
		const degree = parseInt(document.getElementById('slider-degree').value);
		const xT = tf.tensor2d(this.data.xTrue, [this.data.xTrue.length, 1]);
		const feats = this.expand(xT, degree);
		const yPred = this.model.predict(feats).dataSync();

		this.renderPlot(Array.from(yPred));
		tf.dispose([xT, feats]);
	},

	updateEquation: function(degree) {
		const weights = this.model.layers[0].getWeights()[0].dataSync();
		const bias = this.model.layers[0].getWeights()[1].dataSync()[0];
		let terms = [];
		for (let i = degree - 1; i >= 0; i--) {
			if (Math.abs(weights[i]) > 0.001) terms.push(`${weights[i]}x^{${i + 1}}`);
		}
		let eq = `f(x) = ` + (terms.length > 0 ? terms.join(' + ') : '0') + ` + ${bias}`;
		document.getElementById('equation-monitor').innerHTML = `$$ ${eq.replace(/\+ -/g, '- ')} $$`;
		if (window.refreshMath) refreshMath('#equation-monitor');
	},

	renderPlot: function(yPred) {
		const traces = [
			{
				x: this.data.xTrue, y: this.data.yTrue,
				mode: 'lines', name: 'Original Function (Truth)',
				line: { dash: 'dot', color: '#94a3b8', width: 2 }
			},
			{
				x: this.data.xTrain, y: this.data.yTrain,
				mode: 'markers', name: 'Observations (Noisy)',
				marker: { color: '#1e293b', size: 6 }
			},
			{
				x: this.data.xTrue, y: yPred,
				mode: 'lines', name: 'AI Approximation',
				line: { color: '#ef4444', width: 3 }
			}
		];

		const layout = {
			shapes: [{
				type: 'rect', xref: 'x', yref: 'paper',
				x0: this.trainRange[0], x1: this.trainRange[1],
				y0: 0, y1: 1, fillcolor: '#3b82f6', opacity: 0.07, line: {width: 0}
			}],
			xaxis: { range: this.viewRange, title: 'Input Area (The Grey Zone is known to the AI)' },
			yaxis: { range: [-2.5, 2.5], title: 'Value' },
			margin: { t: 20, b: 50, l: 50, r: 20 },
			legend: { orientation: 'h', y: -0.2 }
		};

		Plotly.react('fitting-plot', traces, layout);
	}
};

window.addEventListener('load', () => setTimeout(() => FittingLab.init(), 200));
