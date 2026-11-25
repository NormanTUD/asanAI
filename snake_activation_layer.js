"use strict";

/**
 * Snake activation layer: x + (sin^2(x) / alpha)
 * alpha is a learnable parameter.
 */
class Snake extends tf.layers.Layer {
	constructor(config) {
		super(config);

		// Store initial alpha value as a number
		this.alphaVal = config.alpha || 1;

		// Whether alpha should be trainable
		this.trainable = config.trainable !== undefined ? config.trainable : true;
	}

	/**
	 * build() is called when the layer is connected to upstream layers.
	 * This is where trainable weights are created.
	 */
	build(inputShape) {
		// Create the trainable alpha variable (scalar)
		this.alpha = this.addWeight(
			"alpha",
			[],                   // scalar
			"float32",
			tf.initializers.constant({ value: this.alphaVal }),
			null,
			this.trainable
		);

		super.build(inputShape);
	}

	/**
	 * call() computes x + (sin(x)^2 / alpha)
	 */
	call(input, kwargs) {
		return tf.tidy(() => {
			// Ensure input is a Tensor
			const x = input instanceof Array ? input[0] : input;

			// sin^2(x)
			const sinX2 = tf.square(tf.sin(x));

			// x + sin^2(x) / alpha
			const out = tf.add(x, tf.div(sinX2, this.alpha.read()));

			return out;
		});
	}

	/**
	 * getConfig() for serialization
	 */
	getConfig() {
		const baseConfig = super.getConfig();
		const config = Object.assign({}, baseConfig, {
			alpha: this.alphaVal,
			trainable: this.trainable
		});
		return config;
	}

	/**
	 * Required by tf.serialization.registerClass
	 */
	static get className() {
		return "Snake";
	}
}

// Register the custom layer
tf.serialization.registerClass(Snake);

// Factory function for tf.layers
tf.layers.Snake = function(config) {
	return new Snake(config);
};
