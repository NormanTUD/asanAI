"use strict";

/**
 * Snake activation layer: x + (sin^2(x) / alpha)
 * alpha is a learnable parameter.
 */
class Snake extends tf.layers.Layer {
    constructor(config) {
        super(config);

        // Initial value for alpha
        this.alpha = config.alpha || 1;

        // Whether alpha should be trainable
        this.trainable = config.trainable !== undefined ? config.trainable : true;
    }

    /**
     * build() is called when the layer is connected to upstream layers.
     * This is where trainable weights are created.
     */
    build(inputShape) {
        // Create the trainable alpha variable
        this.alpha = this.addWeight(
            "alpha",
            [],                  // scalar
            "float32",
            tf.initializers.constant({ value: this.alpha }),
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
            const x = input[0] || input; // support both Tensor or [Tensor]
            const sinX = tf.sin(x);
            const sinX2 = tf.square(sinX);
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
            alpha: this.alpha,
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

// Factory-Funktion für tf.layers
tf.layers.Snake = function(config) {
    return new Snake(config);
};
