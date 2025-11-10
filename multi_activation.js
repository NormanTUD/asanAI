"use strict";

/**
 * MultiActivation Layer: kombinierte Aktivierungen mit trainierbaren Gewichten
 * out = a*ReLU(x) + b*Snake(x) + c*ELU(x) + d*Sin(x) ...
 * alpha für Snake ist ebenfalls trainierbar
 */
class MultiActivation extends tf.layers.Layer {
    constructor(config) {
        super(config);

        // Initialwerte für die Gewichtungen der Aktivierungen
        this.initWeights = Object.assign({
            relu: 1,
            snake: 1,
            elu: 1,
            sin: 1
        }, config.initWeights || {});

        // Snake alpha initial
        this.snakeAlphaVal = config.snakeAlpha || 1;

        // Trainable oder nicht
        this.trainable = config.trainable !== undefined ? config.trainable : true;
    }

    build(inputShape) {
        // Trainable Skalierungsfaktoren
        this.aRelu = this.addWeight("aRelu", [], "float32",
            tf.initializers.constant({ value: this.initWeights.relu }),
            null, this.trainable
        );

        this.aSnake = this.addWeight("aSnake", [], "float32",
            tf.initializers.constant({ value: this.initWeights.snake }),
            null, this.trainable
        );

        this.aElu = this.addWeight("aElu", [], "float32",
            tf.initializers.constant({ value: this.initWeights.elu }),
            null, this.trainable
        );

        this.aSin = this.addWeight("aSin", [], "float32",
            tf.initializers.constant({ value: this.initWeights.sin }),
            null, this.trainable
        );

        // Snake alpha
        this.snakeAlpha = this.addWeight("snakeAlpha", [], "float32",
            tf.initializers.constant({ value: this.snakeAlphaVal }),
            null, this.trainable
        );

        super.build(inputShape);
    }

    call(input, kwargs) {
        return tf.tidy(() => {
            const x = input instanceof Array ? input[0] : input;

            // ReLU
            const reluOut = tf.relu(x);

            // Snake: x + sin^2(x)/alpha
            const snakeOut = tf.add(x, tf.div(tf.square(tf.sin(x)), this.snakeAlpha.read()));

            // ELU
            const eluOut = tf.elu(x);

            // Sin
            const sinOut = tf.sin(x);

            // Kombiniere mit trainierbaren Faktoren
            const out = tf.addN([
                tf.mul(this.aRelu.read(), reluOut),
                tf.mul(this.aSnake.read(), snakeOut),
                tf.mul(this.aElu.read(), eluOut),
                tf.mul(this.aSin.read(), sinOut)
            ]);

            return out;
        });
    }

    getConfig() {
        const baseConfig = super.getConfig();
        const config = Object.assign({}, baseConfig, {
            initWeights: this.initWeights,
            snakeAlphaVal: this.snakeAlphaVal,
            trainable: this.trainable
        });
        return config;
    }

    static get className() { return "MultiActivation"; }
}

// Registrierung
tf.serialization.registerClass(MultiActivation);

// Factory function
tf.layers.MultiActivation = function(config) {
    return new MultiActivation(config);
};
