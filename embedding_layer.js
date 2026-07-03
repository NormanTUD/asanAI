"use strict";

/**
 * Custom Embedding Layer for asanAI GUI.
 * Wraps tf.layers.embedding but exposes all internals for inspection.
 */
class AsanEmbedding extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.inputDim = config.inputDim || 100;
        this.outputDim = config.outputDim || 32;
        this.inputLength = config.inputLength || null;
        this.maskZero = config.maskZero || false;
    }

    build(inputShape) {
        this.embeddings = this.addWeight(
            'embeddings',
            [this.inputDim, this.outputDim],
            'float32',
            tf.initializers.glorotUniform({})
        );
    }

    call(inputs, kwargs) {
        return tf.tidy(() => {
            const input = inputs instanceof Array ? inputs[0] : inputs;
            const flatInput = input.toInt().reshape([-1]);
            const gathered = tf.gather(this.embeddings.read(), flatInput);
            const inputShape = input.shape;
            const newShape = [...inputShape, this.outputDim];
            newShape[0] = -1;
            return gathered.reshape(newShape);
        });
    }

    computeOutputShape(inputShape) {
        return [...inputShape, this.outputDim];
    }

    getConfig() {
        const config = super.getConfig();
        Object.assign(config, {
            inputDim: this.inputDim,
            outputDim: this.outputDim,
            inputLength: this.inputLength,
            maskZero: this.maskZero
        });
        return config;
    }

    static get className() {
        return 'AsanEmbedding';
    }
}
tf.serialization.registerClass(AsanEmbedding);

/**
 * Simple Single-Head Self-Attention Layer.
 * Computes Q, K, V from input, applies scaled dot-product attention.
 * All weights are fully readable/inspectable.
 */
class SimpleAttention extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.units = config.units || 32;
    }

    build(inputShape) {
        const inputDim = inputShape[inputShape.length - 1];
        this.Wq = this.addWeight('Wq', [inputDim, this.units], 'float32', tf.initializers.glorotUniform({}));
        this.Wk = this.addWeight('Wk', [inputDim, this.units], 'float32', tf.initializers.glorotUniform({}));
        this.Wv = this.addWeight('Wv', [inputDim, this.units], 'float32', tf.initializers.glorotUniform({}));
    }

    call(inputs, kwargs) {
        return tf.tidy(() => {
            const input = inputs instanceof Array ? inputs[0] : inputs;
            // input shape: [batch, seq_len, inputDim]
            const Q = tf.dot(input, this.Wq.read());
            const K = tf.dot(input, this.Wk.read());
            const V = tf.dot(input, this.Wv.read());

            const dk = Math.sqrt(this.units);
            // scores: [batch, seq_len, seq_len]
            const scores = tf.div(tf.matMul(Q, K, false, true), dk);
            const weights = tf.softmax(scores, -1);
            // output: [batch, seq_len, units]
            const output = tf.matMul(weights, V);
            return output;
        });
    }

    computeOutputShape(inputShape) {
        return [inputShape[0], inputShape[1], this.units];
    }

    getConfig() {
        const config = super.getConfig();
        Object.assign(config, { units: this.units });
        return config;
    }

    static get className() {
        return 'SimpleAttention';
    }
}
tf.serialization.registerClass(SimpleAttention);

/**
 * Residual Stream Layer.
 * Adds the input to the output of the previous layer (skip connection).
 * If dimensions don't match, projects input via a dense projection.
 */
class ResidualStream extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.projectionNeeded = false;
        this.projectionWeight = null;
    }

    build(inputShape) {
        // inputShape is the shape of the tensor this layer receives
        // For residual, we just pass through. The actual addition
        // happens in the model builder. This layer is a marker/identity
        // that signals "add residual here".
        // But to make it self-contained: we store input and add it to output.
        // Since TF.js custom layers get a single input, we implement this
        // as identity + the model builder handles the addition.
    }

    call(inputs, kwargs) {
        return tf.tidy(() => {
            const input = inputs instanceof Array ? inputs[0] : inputs;
            // Identity - the actual residual addition is handled by the model builder
            // when it detects this layer type. This keeps it simple.
            return input;
        });
    }

    computeOutputShape(inputShape) {
        return inputShape;
    }

    getConfig() {
        const config = super.getConfig();
        return config;
    }

    static get className() {
        return 'ResidualStream';
    }
}
tf.serialization.registerClass(ResidualStream);
