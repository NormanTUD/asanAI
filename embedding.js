class Embed extends tf.layers.Layer {
	constructor(config) {
		super(config);

		// Dimensionen
		this.inputDim = config.inputDim;   // Größe des Vokabulars
		this.outputDim = config.outputDim; // Embedding-Dimension
		this.trainable = config.trainable !== undefined ? config.trainable : true;

		// Internes tf.layers.embedding-Layer
		this.internalEmbedding = tf.layers.embedding({
			inputDim: this.inputDim,
			outputDim: this.outputDim,
			embeddingsInitializer: tf.initializers.randomNormal({ mean: 0, stddev: 0.05 }),
			trainable: this.trainable
		});
	}

	build(inputShape) {
		// build des internen Embedding-Layers aufrufen
		this.internalEmbedding.build(inputShape);
		super.build(inputShape);
	}

	call(input, kwargs) {
		return tf.tidy(() => {
			var x = input instanceof Array ? input[0] : input;
			// embeddings direkt vom internen Layer berechnen
			return this.internalEmbedding.apply(x);
		});
	}

	getConfig() {
		var baseConfig = super.getConfig();
		return Object.assign({}, baseConfig, {
			inputDim: this.inputDim,
			outputDim: this.outputDim,
			trainable: this.trainable
		});
	}

	static get className() {
		return "Embed";
	}
}

tf.serialization.registerClass(Embed);
