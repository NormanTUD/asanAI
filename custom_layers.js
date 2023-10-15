/**
 * Define a custom layer.
 *
 * This custom layer is written in a way that can be saved and loaded.
 */
class DebugLayer extends tf.layers.Layer {
	constructor(config) {
		super(config);
		this.alpha = config.alpha;
	}

	/**
	* build() is called when the custom layer object is connected to an
	* upstream layer for the first time.
	* This is where the weights (if any) are created.
	*/
	build(inputShape) {
	}

	/**
	* call() contains the actual numerical computation of the layer.
	*
	* It is "tensor-in-tensor-out". I.e., it receives one or more
	* tensors as the input and should produce one or more tensors as
	* the return value.
	*
	* Be sure to use tidy() to avoid WebGL memory leak.
	*/
	call(input, ...kwargs) {
		log(this);
		return tidy(() => {
			log(`=== DebugLayer ${this.name} ===`);
			log("shape: [" + input[0].shape.join(", ") + "]");
			log("input:", input[0].arraySync());
			log("min:", min(input[0]).arraySync());
			log("max:", max(input[0]).arraySync());
			log("kwargs:", kwargs);
			log(`=== DebugLayer ${this.name} End ==`);
			return input[0];
		});
	}

	/**
	* getConfig() generates the JSON object that is used
	* when saving and loading the custom layer object.
	*/
	getConfig() {
		const config = super.getConfig();
		//Object.assign(config, {alpha: this.alpha});
		return config;
	}

	/**
	* The static className getter is required by the
	* registration step (see below).
	*/
	static get className() {
		return "DebugLayer";
	}
}
/**
 * Regsiter the custom layer, so TensorFlow.js knows what class constructor
 * to call when deserializing an saved instance of the custom layer.
 */
tf.serialization.registerClass(DebugLayer);
