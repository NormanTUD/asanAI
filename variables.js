"use strict";

function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

function calculate_default_target_shape (nr) {
	var input_shape = null;
	if(nr == 0) {
		input_shape = get_input_shape();
	} else {
		input_shape = model.layers[nr - 1].getOutputAt(0).shape;
	}

	var output = [];

	for (var i = 0; i < input_shape.length; i++) {
		if(Number.isInteger(input_shape[i])) {
			output.push(input_shape[i]);
		}
	}

	return output;
}

function lowercaseFirstLetter(string) {
	return string.charAt(0).toLowerCase() + string.slice(1);
}

var number_of_undos = 50;

var state_stack = [];
var future_state_stack = [];
var status_saves = {};

var disabling_saving_status = false;

var mode = "beginner";
var global_disable_auto_enable_valid_layer_types = true;
var throw_compile_exception = false;
var model_is_trained = false;
var disable_layer_debuggers = 0;
var pixel_size = 1;
var kernel_pixel_size = 10;
var model = null;
var h = null;
var number_channels = 3;
var height = 32;
var width = 32;
var labels = [];
var vector_counter = 1;
var disable_show_python_and_create_model = false;
var layer_structure_cache = null;
var allowed_layer_cache = [];
var last_allowed_layers_update = null;
var started_training = false;

var max_images_per_layer = 0;

var x_file = null;
var y_file = null;
var y_shape = null;

var xy_data = null;

var js_names_to_python_names = {
	"dtype": "dtype",
	"trainable": "trainable",
	"dilationRate": "dilation_rate",
	"padding": "padding",
	"kernelSize": "kernel_size",
	"poolSize": "pool_size",
	"biasInitializer": "bias_initializer",
	"alpha": "alpha",
	"axis": "axis",
	"momentum": "momentum",
	"epsilon": "epsilon",
	"stddev": "stddev",
	"implementation": "implementation",
	"stateful": "stateful",
	"center": "center",
	"scale": "scale",
	"strides": "strides",
	"maxValue": "max_value",
	"betaConstraint": "beta_constraint",
	"rate": "dropout_rate",
	"movingVarianceInitializer": "moving_variance_initializer",
	"size": "size",
	"interpolation": "interpolation",
	"dropout": "dropout",
	"gammaConstraint": "gamma_constraint",
	"activityRegularizer": "activity_regularizer",
	"kernelRegularizer": "kernel_regularizer",
	"biasRegularizer": "bias_regularizer",
	"dense": "Dense",
	"true": "True",
	"false": "False",
	"inputShape": "input_shape",
	"activation": "activation",
	"glorotUniform": "glorot_uniform",
	"binaryCrossentropy": "binary_crossentropy",
	"categoricalCrossentropy": "categorical_crossentropy",
	"heUniform":"he_uniform",
	"movingMeanInitializer": "moving_mean_initializer",
	"glorotNormal": "glorot_normal",
	"SoftMax": "softmax",
	"flatten": "Flatten",
	"heNormal": "he_normal",
	"leCunNormal": "le_cun_normal",
	"leCunUniform": "le_cun_uniform",
	"randomNormal": "random_normal",
	"randomUniform": "random_uniform",
	//"truncatedNormal": "truncated_normal",
	"varianceScaling": "variance_scaling",
	"conv1d": "Conv1D",
	"conv2d": "Conv2D",
	"conv2dTranspose": "Conv2DTranspose",
	"depthwiseConv2d": "DepthwiseConv2D",
	"conv3d": "Conv3D",
	"embedding": "Embedding",
	"dropout": "Dropout",
	"batchNormalization": "BatchNormalization",
	"maxPooling1d": "MaxPooling1D",
	"maxPooling2d": "MaxPooling2D",
	"globalMaxPooling1d": "GlobalMaxPooling1D",
	"globalMaxPooling2d": "GlobalMaxPooling2D",
	"globalAveragePooling1d": "GlobalAveragePooling1D",
	"globalAveragePooling2d": "GlobalAveragePooling2D",
	"averagePooling1d": "AveragePooling1D",
	"averagePooling2d": "AveragePooling2D",
	"softmax": "SoftMax",
	"kernelInitializer": "kernel_initializer",
	"meanSquaredError": "mean_squared_error",
	"useBias": "use_bias",
	"recurrentInitializer": "recurrent_initializer",
	"kernelRegularizer": "kernel_regularizer",
	"recurrentConstraint": "recurrent_constraint",
	"biasConstraint": "bias_constraint",
	"recurrentDropout": "recurrent_dropout",
	"returnSequences": "return_sequences",
	"recurrentActivation": "recurrent_activation",
	"unroll": "unroll",
	"unitForgetBias": "unit_forget_bias",
	"kernelConstraint": "kernel_constraint",
	"returnState": "return_state",
	"goBackwards": "go_backwards",
	"depthMultiplier": "depth_multiplier",
	"depthwiseInitializer": "depthwise_initializer",
	"depthwiseConstraint": "depthwise_constraint",
	"pointwiseInitializer": "pointwise_initializer",
	"pointwiseConstraint": "pointwise_constraint",
	"betaInitializer": "beta_initializer",
	"gammaInitializer": "gamma_initializer",
	"filters": "filters",
	"units": "units",
	"targetShape": "target_shape",
	"GaussianNoise": "gaussianNoise",
	"gaussianNoise": "GaussianNoise",
	"gaussianDropout": "GaussianDropout",
	"GaussianDropout": "gaussianDropout"
};

var python_names_to_js_names = {};

for (var key of Object.keys(js_names_to_python_names)) {
	python_names_to_js_names[js_names_to_python_names[key]] = lowercaseFirstLetter(key);
}

var layer_options = {
	"dense": {
		"description": "Creates a dense (fully connected) layer.<br>This layer implements the operation: $$\\mathrm{output} = \\mathrm{activation}\\left(\\mathrm{input} \\cdot \\mathrm{kernel} + \\text{bias}\\right)$$ activation is the element-wise activation function passed as the activation argument.<br><tt>kernel</tt> is a weights matrix created by the layer.<br><tt>bias</tt> is a bias vector created by the layer (only applicable if useBias is true).",
		"options": [
			"trainable", "use_bias", "units", "activation", "kernel_initializer", "bias_initializer", "kernel_regularizer", "bias_regularizer", "visualize", "dtype"
		],
		"category": "Basic"
	},
	"flatten": {
		"description": "Flattens the input. Does not affect the batch size. A Flatten layer flattens each batch in its inputs to 1D (making the output 2D).",
		"options": [],
		"category": "Basic"
	},
	"dropout": {
		"description": "Dropout consists in randomly setting a fraction rate of input units to 0 at each update during training time, which helps prevent overfitting.",
		"options": [
			"dropout_rate", "dtype"
		],
		"category": "Basic"
	},
	"reshape": {
		"description": "Reshapes an input to a certain shape.",
		"options": [
			'target_shape', "dtype"
		],
		"category": "Basic"
	},

	"elu": {
		"description": "Exponetial Linear Unit (ELU).<br>It follows: $$\\text{elu}\\left(x\\right) = \\left\\{\\begin{array}{ll} \\alpha \\cdot \\left(e^x - 1\\right) & \\text{for } x < 0 \\\\\n x & \\text{for } x >= 0\\end{array}\\right.$$",
		"options": [
			"alpha", "dtype"
		],
		"category": "Activation"
	},

	"leakyReLU": {
		"description": "Leaky version of a rectified linear unit.<br>It allows a small gradient when the unit is not active: $$ \\text{leakyReLU}(x) = \\left\\{\\begin{array}{ll} \\alpha \\cdot x & \\text{for } x < 0 \\\\\n x & \\text{for } x >= 0 \\end{array}\\right.$$",
		"options": [
			"alpha", "dtype"
		],
		"category": "Activation"
	},
	"reLU": {
		"description": "Rectified Linear Unit activation function. $$\\mathrm{relu}\\left(x\\right) = \\mathrm{max}\\left(0, x\\right)$$",
		"options": [
			"max_value", "dtype"
		],
		"category": "Activation"
	},
	"softmax": {
		"description": "Softmax activation layer. $$\\mathrm{softmax}\\left(x\\right) = \\frac{e^{z_j}}{\\sum^K_{k=1} e^{z_k}}$$",
		"options": [
			"axis", "dtype"
		],
		"category": "Activation"
	},
	"thresholdedReLU": {
		"description": "Thresholded Rectified Linear Unit. It follows: $$f(x) = \\left\\{\\begin{array}{ll} x & \\text{for } x > \\theta \\\\\n 0 & \\text{otherwise}\\end{array}\\right.$$",
		"options": [
			"theta"
		],
		"category": "Activation"
	},


	"batchNormalization": {
		"description": "Batch normalization layer (<a href='https://arxiv.org/abs/1502.03167' target='_blank'>Ioffe and Szegedy, 2014</a>).<br>Normalize the activations of the previous layer at each batch, i.e. applies a transformation that maintains the mean activation close to 0 and the activation standard deviation close to 1.",
		"options": [
			"trainable", "center", "scale", "axis", "epsilon",
			"gamma_initializer", "gamma_constraint",
			"beta_initializer", "beta_constraint",
			"moving_mean_initializer", "moving_variance_initializer",
			"dtype"
		],
		"category": "Normalization"
	},
	"layerNormalization": {
		"description": "Layer-normalization layer (<a target='_blank' href='https://arxiv.org/abs/1607.06450'>Ba et al., 2016</a>). Normalizes the activations of the previous layer for each given example in a batch independently, instead of across a batch like in batchNormalization. In other words, this layer applies a transformation that maintanis the mean activation within each example close to0 and activation variance close to 1.",
		"options": [
			"center", "scale", "axis", "epsilon",  "beta_initializer",
			"gamma_initializer", "dtype"
		],
		"category": "Normalization"
	},


	"conv1d": {
		"description": "1D convolution layer (e.g., temporal convolution).<br>This layer creates a convolution kernel that is convolved with the layer input over a single spatial (or temporal) dimension to produce a tensor of outputs.<br>If <tt>use_bias</tt> is True, a bias vector is created and added to the outputs.<br>If <tt>activation</tt> is not <tt>null</tt>, it is applied to the outputs as well.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters",
			"kernel_size", "strides", "dilation_rate", "kernel_initializer",
			"bias_initializer", "kernel_regularizer", "bias_regularizer", "dtype"
		],
		"category": "Convolutional"
	},
	"conv2d": {
		"description": "2D convolution layer (e.g. spatial convolution over images).<br>This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.<br>If <tt>useBias</tt> is True, a bias vector is created and added to the outputs.<br>If <tt>activation</tt> is not null, it is applied to the outputs as well.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size",
			"strides", "dilation_rate", "kernel_initializer", "bias_initializer",
			"kernel_regularizer", "bias_regularizer", "visualize", "dtype"
		],
		"category": "Convolutional"
	},
	"conv2dTranspose": {
		"description": "Transposed convolutional layer (sometimes called Deconvolution). The need for transposed convolutions generally arises from the desire to use a transformation going in the opposite direction of a normal convolution, i.e., from something that has the shape of the output of some convolution to something that has the shape of its input while maintaining a connectivity pattern that is compatible with said convolution.",
		"options": [
			"filters", "kernel_size", "strides", "padding", "dilation_rate", "activation",
			"use_bias", "kernel_initializer", "bias_initializer", "kernel_constraint",
			"bias_constraint", "trainable", "kernel_regularizer", "bias_regularizer",
			"dtype"
		],
		"category": "Convolutional"
	},
	"conv3d": {
		"description": "3D convolution layer (e.g. spatial convolution over volumes).<br>This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size",
			"strides", "dilation_rate", "kernel_initializer", "bias_initializer",
			"kernel_regularizer", "bias_regularizer", "dtype"
		],
		"category": "Convolutional"
	},
	"depthwiseConv2d": {
		"description": "Depthwise separable 2D convolution. Depthwise Separable convolutions consists in performing just the first step in a depthwise spatial convolution (which acts on each input channel separately). The depthMultiplier argument controls how many output channels are generated per input channel in the depthwise step.",
		"options": [
			"trainable", "use_bias", "activation", "kernel_size",
			"strides", "depth_multiplier", "depthwise_initializer",
			"depthwise_constraint", "padding", "dilation_rate",
			 "kernel_initializer", "bias_initializer",
			"kernel_constraint", "bias_constraint", "dtype"
		],
		"category": "Convolutional"
	},
	"separableConv2d": {
		"description": "Depthwise separable 2D convolution. Separable convolution consists of first performing a depthwise spatial convolution (which acts on each input channel separately) followed by a pointwise convolution which mixes together the resulting output channels. The depthMultiplier argument controls how many output channels are generated per input channel in the depthwise step.",
		"options": [
			"trainable", "use_bias", "depth_multiplier", "depthwise_initializer",
			"pointwise_initializer", "depthwise_constraint",
			"pointwise_constraint", "filters", "kernel_size",
			"strides", "padding", "dilation_rate", "activation",
			"bias_initializer", "bias_constraint",
			"kernel_regularizer", "bias_regularizer",
			"dtype"
		],
		"category": "Convolutional"
	},
	"upSampling2d": {
		"description": "Upsampling layer for 2D inputs. Repeats the rows and columns of the data by size[0] and size[1] respectively.",
		"options": [
			"trainable", "size", "interpolation", "dtype"
		],
		"category": "Convolutional"
	},

	"averagePooling1d": {
		"description": "Average pooling operation for spatial data.",
		"options": [
			"padding", "pool_size", "strides", "dtype"
		],
		"category": "Pooling"
	},
	"averagePooling2d": {
		"description": "Average pooling operation for spatial data.",
		"options": [
			"padding", "pool_size", "strides", "dtype"
		],
		"category": "Pooling"
	},

	"maxPooling1d": {
		"description": "Max pooling operation for temporal data.",
		"options": [
			"pool_size", "strides", "padding", "dtype"
		],
		"category": "Pooling"
	},
	"maxPooling2d": {
		"description": "Global max pooling operation for spatial data.",
		"options": [
			"pool_size", "strides", "padding", "dtype"
		],
		"category": "Pooling"
	},
	/*
	"globalAveragePooling1d": {
		"description": "Global average pooling operation for temporal data.",
		"options": [
			"trainable", "dtype"
		],
		"category": "Pooling"
	},
	"globalAveragePooling2d": {
		"description": "Global average pooling operation for temporal data.",
		"options": [
			"trainable", "dtype"
		],
		"category": "Pooling"
	},

	"globalMaxPooling1d": {
		"description": "Global max pooling operation for temporal data.",
		"options": [],
		"category": "Pooling"
	},
	"globalMaxPooling2d": {
		"description": "Global max pooling operation for spatial data.",
		"options": [],
		"category": "Pooling"
	},

	"gru": {
		"description": "Gated Recurrent Unit - Cho et al. 2014.",
		"options": [
			"recurrent_activation", "implementation", "units", "activation",
			"use_bias", "kernel_initializer", "recurrent_initializer",
			"bias_initializer", "recurrent_initializer",
			"kernel_constraint", "bias_constraint", "dropout",
			"recurrent_dropout", "return_sequences", "return_state",
			"stateful", "unroll", "trainable", "kernel_regularizer", "bias_regularizer",
			"dtype"
			
		],
		"category": "Recurrent"
	},

	"lstm": {
		"description": "Long-Short Term Memory layer - Hochreiter 1997.",
		"options": [
			"recurrent_activation", "unit_forget_bias", "implementation", "units", "activation", "use_bias", "kernel_initializer",
			"recurrent_initializer", "bias_initializer", "kernel_constraint", "recurrent_constraint", "bias_constraint",
			"dropout", "recurrent_dropout", "return_sequences", "return_state", "go_backwards", "unroll", "trainable", "kernel_regularizer", "bias_regularizer"
		],
		"category": "Recurrent"
	},
	"rnn": {
		"description": "Base class for recurrent layers.",
		"options": [
			"units", "cell", "return_sequences", "return_state", "go_backwards", "stateful", "unroll"
		],
		"category": "Recurrent"
	},
	"simpleRNN": {
		"description": "Fully-connected RNN where the output is to be fed back to input.",
		"options": [
			"trainable", "use_bias", "units", "activation", "kernel_initializer", "bias_initializer", "recurrent_initializer",
			"recurrent_constraint", "bias_constraint", "dropout", "recurrent_dropout", "return_sequences", "unroll", "kernel_constraint",
			"return_state", "dtype"
		],
		"category": "Recurrent"
	},

	"convLstm2d": {
		"description": "Convolutional LSTM layer - Xingjian Shi 2015.",
		"options": [
			"activation", "use_bias", "kernel_initializer", "recurrent_initializer",
			"bias_initializer", "dropout", "trainable", "recurrent_activation",
			"unit_forget_bias", "implementation", "return_sequences", "return_state",
			"go_backwards", "stateful", "unroll", "filters", "kernel_size",
			"strides", "padding", "dilation_rate", "kernel_regularizer", "bias_regularizer",
			"dtype"
		],
		"category": "Recurrent"
	},
	*/

	"alphaDropout": {
		"description": "Applies Alpha Dropout to the input. As it is a regularization layer, it is only active at training time.",
		"options": [
			"rate", "dtype"
		],
		"category": "Noise"
	},
	"gaussianDropout": {
		"description": "Apply multiplicative 1-centered Gaussian noise. As it is a regularization layer, it is only active at training time.",
		"options": [
			"rate", "dtype"
		],
		"category": "Noise"
	},
	"gaussianNoise": {
		"description": "Apply additive zero-centered Gaussian noise. As it is a regularization layer, it is only active at training time.",
		"options": [
			"stddev", "dtype"
		],
		"category": "Noise"
	}

	/*
	,"zeroPadding2d": {
		"description": "Zero-padding layer for 2D input (e.g., image).",
		"options": [
			"padding", "trainable"
		],
		"category": "Padding"
	}
	*/
};

var model_data_structure = {
	"sgd": ["learningRate"],
	"rmsprop": ["learningRate", "rho", "decay", "epsilon", "momentum"],
	"adam": ["learningRate", "beta1", "beta2", "epsilon"],
	"adagrad": ["learningRate"],
	"adadelta": ["learningRate", "rho", "epsilon"],
	"adamax": ["learningRate", "beta1", "beta2", "epsilon", "decay"]
};

var activations = {
	//"None": "none",
	"linear": "Linear",
	"sigmoid": "Sigmoid",
	"elu": "ELU",
	"relu": "ReLu",
	"relu6": "ReLu6",
	"selu": "SeLu",
	"softplus": "SoftPlus",
	"softsign": "SoftSign",
	"softmax": "SoftMax",
	"tanh": "tanh",
	"LeakyReLU": "leakyReLU"
	//"thresholdedrelu": "thresholdedReLU"
};

var initializers = {
	"glorotUniform": "glorotUniform",
	"constant": "constant",
	"glorotNormal": "glorotNormal",
	"heNormal": "heNormal",
	"heUniform": "heUniform",
	"leCunNormal": " leCunNormal",
	"leCunUniform": "leCunUniform",
	"ones": "ones",
	"randomNormal": "randomNormal",
	"randomUniform": " randomUniform",
	"truncatedNormal": "truncatedNormal",
	"varianceScaling": "varianceScaling",
	"zeros": "zeros"
};

function get_name_case_independent (name, from_hash) {
	for (var key of Object.keys(from_hash)) {
		if(key.toLowerCase() == name.toLowerCase() || from_hash[key].toLowerCase() == name.toLowerCase()) {
			return from_hash[key];
		}
	}
	return null;
}

function get_initializer_name (name) {
	var res = get_name_case_independent(name, initializers);

	if(!name) {
		console.warn("Cannot determine the kernel initializer name of " + name);
		return null;
	} else {
		return res;
	}
}

var current_status_hash = "";

var loaded_plotly = 0;

var constraints = {
	"": "None",
	"maxNorm": "maxNorm",
	"minMaxNorm": "minMaxNorm",
	"nonNeg": "nonNeg",
	"unitNorm": "unitNorm"
};

var implementation_modes = {
	"1": "1",
	"2": "2"
};


var interpolation = {
	"nearest": "nearest",
	"bilinear": "bilinear"
};

var layer_options_defaults = {
	"alpha": 1,
	"units": 2,
	"dropout_rate": 0.25,
	"rate": 0.25,
	"max_features": 3,
	"momentum": 0.99,
	"axis": -1,
	"filters": 32,
	"dropout": 0.20,
	"recurrent_dropout": 0,
	"epsilon": 0.0001,
	"depth_multiplier": 1,
	"max_value": 1,
	"stddev": 1,
	"implementation": 1,

	"recurrent_constraint": null,
	"bias_constraint": null,
	"kernel_constraint": null,
	"depthwise_constraint": null,
	"pointwise_constraint": null,
	"gamma_constraint": null,
	"beta_constraint": null,

	"bias_initializer": "zeros",
	"recurrent_initializer": "zeros",
	"beta_initializer": "zeros",
	"gamma_initializer": "zeros",
	"moving_mean_initializer": "zeros",
	"moving_variance_initializer": "zeros",
	"pointwise_initializer": "zeros",
	"depthwise_initializer": "zeros",
	"kernel_initializer": "zeros",

	"use_bias": true,
	"trainable": true,

	"center": true,
	"stateful": false,
	"unroll": true,
	"go_backwards": false,
	"scale": true,
	"return_sequences": true,
	"return_state": false,
	"unit_forget_bias": true,


	"activation": null,
	"recurrent_activation": null,

	"padding": "valid",
	"interpolation": "nearest",
	"dilation_rate": "",
	"size": "1,1",
	"strides": "[]",
	"pool_size": "[]",
	"kernel_size": "[]",

	"target_shape": calculate_default_target_shape
};

var valid_layer_options = {
	"activation": ["activation", "args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"add": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"average": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"averagePooling1d": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "padding", "poolSize", "strides", "trainable", "weights"],
	"averagePooling2d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "padding", "poolSize", "strides", "trainable", "weights"],
	"averagePooling3d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "padding", "poolSize", "strides", "trainable", "weights"],
	"batchNormalization": ["args", "axis", "batchInputShape", "batchSize", "betaConstraint", "betaInitializer", "betaRegularizer", "center", "dtype", "epsilon", "gammaConstraint", "gammaInitializer", "gammaRegularizer", "inputDType", "inputShape", "momentum", "movingMeanInitializer", "movingVarianceInitializer", "name", "scale", "trainable", "weights"],
	"bidirectional": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "layer", "mergeMode", "name", "trainable", "weights"],
	"concatenate": ["args", "axis", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"conv1d": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "dilationRate", "dtype", "filters", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "strides", "trainable", "useBias", "weights"],
	"conv2d": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "dilationRate", "dtype", "filters", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "strides", "trainable", "useBias", "weights"],
	"conv2dTranspose": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "dilationRate", "dtype", "filters", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "strides", "trainable", "useBias", "weights"],
	"conv3d": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "dilationRate", "dtype", "filters", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "strides", "trainable", "useBias", "weights"],
	"convLstm2d": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "cell", "dataFormat", "dilationRate", "dropout", "dropoutFunc", "dtype", "filters", "goBackwards", "implementation", "inputDType", "inputDim", "inputLength", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "recurrentActivation", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "returnSequences", "returnState", "stateful", "strides", "trainable", "unitForgetBias", "unroll", "useBias", "weights"],
	"convLstm2dCell": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "dilationRate", "dropout", "dropoutFunc", "dtype", "filters", "implementation", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "recurrentActivation", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "strides", "trainable", "unitForgetBias", "useBias", "weights"],
	"cropping2D": ["args", "batchInputShape", "batchSize", "cropping", "dataFormat", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"dense": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dtype", "inputDType", "inputDim", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "trainable", "units", "useBias", "weights"],
	"depthwiseConv2d": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "depthMultiplier", "depthwiseConstraint", "depthwiseInitializer", "depthwiseRegularizer", "dilationRate", "dtype", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "strides", "trainable", "useBias", "weights"],
	"dot": ["args", "axes", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "normalize", "trainable", "weights"],
	"dropout": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "noiseShape", "rate", "seed", "trainable", "weights"],
	"elu": ["alpha", "args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"embedding": ["activityRegularizer", "args", "batchInputShape", "batchSize", "dtype", "embeddingsConstraint", "embeddingsInitializer", "embeddingsRegularizer", "inputDType", "inputDim", "inputLength", "inputShape", "maskZero", "name", "outputDim", "trainable", "weights"],
	"flatten": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"globalAveragePooling1d": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"globalAveragePooling2d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"globalMaxPooling1d": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"globalMaxPooling2d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"gru": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "cell", "dropout", "dropoutFunc", "dtype", "goBackwards", "implementation", "inputDType", "inputDim", "inputLength", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "recurrentActivation", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "returnSequences", "returnState", "stateful", "trainable", "units", "unroll", "useBias", "weights"],
	"gruCell": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dropout", "dropoutFunc", "dtype", "implementation", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "recurrentActivation", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "resetAfter", "trainable", "units", "useBias", "weights"],
	"layerNormalization": ["args", "axis", "batchInputShape", "batchSize", "betaInitializer", "betaRegularizer", "center", "dtype", "epsilon", "gammaInitializer", "gammaRegularizer", "inputDType", "inputShape", "name", "scale", "trainable", "weights"],
	"leakyReLU": ["alpha", "args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"lstm": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "cell", "dropout", "dropoutFunc", "dtype", "goBackwards", "implementation", "inputDType", "inputDim", "inputLength", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "recurrentActivation", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "returnSequences", "returnState", "stateful", "trainable", "unitForgetBias", "units", "unroll", "useBias", "weights"],
	"lstmCell": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dropout", "dropoutFunc", "dtype", "implementation", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "recurrentActivation", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "trainable", "unitForgetBias", "units", "useBias", "weights"],
	"maxPooling1d": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "padding", "poolSize", "strides", "trainable", "weights"],
	"maxPooling2d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "padding", "poolSize", "strides", "trainable", "weights"],
	"maxPooling3d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "name", "padding", "poolSize", "strides", "trainable", "weights"],
	"maximum": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"minimum": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"multiply": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"permute": ["args", "batchInputShape", "batchSize", "dims", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"prelu": ["alphaConstraint", "alphaInitializer", "alphaRegularizer", "args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "sharedAxes", "trainable", "weights"],
	"reLU": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "maxValue", "name", "trainable", "weights"],
	"repeatVector": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "n", "name", "trainable", "weights"],
	"reshape": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "targetShape", "trainable", "weights"],
	"rnn": ["args", "batchInputShape", "batchSize", "cell", "dtype", "goBackwards", "inputDType", "inputDim", "inputLength", "inputShape", "name", "returnSequences", "returnState", "stateful", "trainable", "unroll", "weights"],
	"separableConv2d": ["activation", "activityRegularizer", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dataFormat", "depthMultiplier", "depthwiseConstraint", "depthwiseInitializer", "depthwiseRegularizer", "dilationRate", "dtype", "filters", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "kernelSize", "name", "padding", "pointwiseConstraint", "pointwiseInitializer", "pointwiseRegularizer", "strides", "trainable", "useBias", "weights"],
	"simpleRNN": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "cell", "dropout", "dropoutFunc", "dtype", "goBackwards", "inputDType", "inputDim", "inputLength", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "returnSequences", "returnState", "stateful", "trainable", "units", "unroll", "useBias", "weights"],
	"simpleRNNCell": ["activation", "args", "batchInputShape", "batchSize", "biasConstraint", "biasInitializer", "biasRegularizer", "dropout", "dropoutFunc", "dtype", "inputDType", "inputShape", "kernelConstraint", "kernelInitializer", "kernelRegularizer", "name", "recurrentConstraint", "recurrentDropout", "recurrentInitializer", "recurrentRegularizer", "trainable", "units", "useBias", "weights"],
	"softmax": ["args", "axis", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"spatialDropout1d": ["args", "batch_input_shape", "batch_size", "dtype", "input_dtype", "input_shape", "name", "rate", "seed", "trainable"],
	"stackedRNNCells": ["args", "batchInputShape", "batchSize", "cells", "dtype", "inputDType", "inputShape", "name", "trainable", "weights"],
	"thresholdedReLU": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "theta", "trainable", "weights"],
	"timeDistributed": ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "layer", "name", "trainable", "weights"],
	"upSampling2d": ["args", "batchInputShape", "batchSize", "dataFormat", "dtype", "inputDType", "inputShape", "interpolation", "name", "size", "trainable", "weights"]
};

var dtypes = {
	'float32': 'float32',
	'int32': 'int32',
	'bool': 'bool',
	'complex64': 'complex64' //,
	//'string': 'string'
};

var layer_names = Object.keys(layer_options);

var function_times = {};

var number_of_initialized_layers = 0;

var is_setting_config = false;

var call_depth = 0;

var model_config_hash = "";

var show_input_layer = false;

var disable_save_current_status = false;

var memory_debug_interval = null;

var call_from_show_csv_file = false;

function dispose (item) {
	//console.trace();
	//log(item);
	tf.dispose(item);
}

var distribution_modes = {
	"normal": "normal",
	"uniform": "uniform",
	"truncatedNormal": "truncatedNormal"
};

var mode_modes = {
	'fanIn': 'fanIn',
	'fanOut': 'fanOut',
	'fanAvg': 'fanAvg'
};

var initializer_options = {
	"constant": {
		"description": "Initializer that generates values initialized to some constant.",
		"options": [
			"value"
		]
	},
	"glorotNormal": {
		"description": "Glorot normal initializer, also called Xavier normal initializer. It draws samples from a truncated normal distribution centered on 0 with stddev = sqrt(2 / (fan_in + fan_out)) where fan_in is the number of input units in the weight tensor and fan_out is the number of output units in the weight tensor. Reference: Glorot & Bengio, AISTATS 2010 http://jmlr.org/proceedings/papers/v9/glorot10a/glorot10a.pdf",
		"options": [
			"seed"
		]
	},
	"glorotUniform": {
		"description": "Glorot uniform initializer, also called Xavier uniform initializer. It draws samples from a uniform distribution within [-limit, limit] where limit is sqrt(6 / (fan_in + fan_out)) where fan_in is the number of input units in the weight tensor and fan_out is the number of output units in the weight tensor Reference: Glorot & Bengio, AISTATS 2010 http://jmlr.org/proceedings/papers/v9/glorot10a/glorot10a.pdf.",
		"options": [
			"seed"
		]
	},
	"heNormal": {
		"description": "He normal initializer. It draws samples from a truncated normal distribution centered on 0 with stddev = sqrt(2 / fanIn) where fanIn is the number of input units in the weight tensor. Reference: He et al., http://arxiv.org/abs/1502.01852",
		"options": [
			"seed"
		]
	},
	"heUniform": {
		"description": "He uniform initializer. It draws samples from a uniform distribution within [-limit, limit] where limit is sqrt(6 / fan_in) where fanIn is the number of input units in the weight tensor. Reference: He et al., http://arxiv.org/abs/1502.01852",
		"options": [
			"seed"
		]
	},
	"identity": {
		"description": "Initializer that generates the identity matrix. Only use for square 2D matrices.",
		"options": [
			"gain"
		]
	},
	"leCunNormal": {
		"description": "It draws samples from a truncated normal distribution centered on 0 with stddev = sqrt(1 / fanIn) where fanIn is the number of input units in the weight tensor.", // TODO References
		"options": [
			"seed"
		]
	},
	"leCunUniform": {
		"description": "LeCun uniform initializer. It draws samples from a uniform distribution in the interval [-limit, limit] with limit = sqrt(3 / fanIn), where fanIn is the number of input units in the weight tensor.",
		"options": [
			"seed"
		]
	},
	"ones": {
		"description": "Initializer that generates tensors initialized to 1.",
		"options": []
	},
	"orthogonal": {
		"description": "Initializer that generates a random orthogonal matrix.", // TODO References
		"options": [
			"gain", "seed"
		]
	},
	"randomNormal": {
		"description": "Initializer that generates random values initialized to a normal distribution.",
		"options": [
			"mean", "stddev", "seed"
		]
	},
	"randomUniform": {
		"description": "Initializer that generates random values initialized to a uniform distribution. Values will be distributed uniformly between the configured minval and maxval.",
		"options": [
			"minval", "maxval", "seed"
		]
	},
	"truncatedNormal": {
		"description": "Initializer that generates random values initialized to a truncated normal. distribution. These values are similar to values from a RandomNormal except that values more than two standard deviations from the mean are discarded and re-drawn. This is the recommended initializer for neural network weights and filters.",
		"options": [
			"mean", "stddev", "seed"
		]
	},
	"varianceScaling": {
		"description": "Initializer capable of adapting its scale to the shape of weights. With distribution=NORMAL, samples are drawn from a truncated normal distribution centered on zero, with stddev = sqrt(scale / n) where n is:number of input units in the weight tensor, if mode = FAN_IN; number of output units, if mode = FAN_OUT. average of the numbers of input and output units, if mode = FAN_AVG. With distribution=UNIFORM, samples are drawn from a uniform distribution within [-limit, limit], with limit = sqrt(3 * scale / n).",
		"options": [
			"scale", "mode", "distribution", "seed"
		]
	},
	"zeros": {
		"description": "Initializer that generates tensors initialized to 0.",
		"options": []

	}
};

var regularizer_options = {
	"none": {
		"description": "No regularizer",
		"options": []
	},
	"l1": {
		"description": "Regularizer for L1 regularization. Adds a term to the loss to penalize large weights: loss += sum(l1 * abs(x))",
		"options": [
			"l1"
		]
	},
	"l1l2": {
		"description": "Regularizer for L1 and L2 regularization. Adds a term to the loss to penalize large weights: loss += sum(l1 * abs(x)) + sum(l2 * x^2)",
		"options": [
			"l1", "l2"
		]
	},
	"l2": {
		"description": "Regularizer for L2 regularization. Adds a term to the loss to penalize large weights: loss += sum(l2 * x^2)",
		"options": [
			"l2"
		]
	}
};

var regularizer_select = {
	"none": "none",
	"l1": "l1",
	"l1l2": "l1l2",
	"l2": "l2"
};

// TODO constraint_options not yet used...
var constraint_options = {
	"maxNorm": {
		"description": "MaxNorm weight constraint. Constrains the weights incident to each hidden unit to have a norm less than or equal to a desired value. References - Dropout: A Simple Way to Prevent Neural Networks from Overfitting Srivastava, Hinton, et al. 2014",
		"options": [
			"maxValue", "axis"
		]
	},
	"minMaxNorm": {
		"description": "",
		"options": [
			"minValue", "maxValue", "axis", "rate"
		]
	},
	"nonNeg": {
		"description": "Constains the weight to be non-negative.",
		"options": []
	},
	"unitNorm": {
		"description": "Constrains the weights incident to each hidden unit to have unit norm.",
		"options": [
			"axis"
		]
	}
};

var activation_options = {
	"elu": {
		"description": "Exponetial Linear Unit (ELU). It follows: f(x) = alpha * (exp(x) - 1.) for x < 0, f(x) = x for x >= 0. Input shape: Arbitrary. Use the configuration inputShape when using this layer as the first layer in a model. Output shape: Same shape as the input.",
		"options": [
			//"alpha" // Deaktiviert, weil "Error: Non-default alpha value (1.01) is not supported by the ELU layer yet." in TF 3.19.0
		]
	},
	"LeakyReLU": {
		"description": "Leaky version of a rectified linear unit. It allows a small gradient when the unit is not active: f(x) = alpha * x for x < 0. f(x) = x for x >= 0. Input shape: Arbitrary. Use the configuration inputShape when using this layer as the first layer in a model. Output shape: Same shape as the input.",
		"options": [
			"alpha"
		]
	},
	"prelu": {
		"description": "Parameterized version of a leaky rectified linear unit. It follows f(x) = alpha * x for x < 0. f(x) = x for x >= 0. wherein alpha is a trainable weight. Input shape: Arbitrary. Use the configuration inputShape when using this layer as the first layer in a model. Output shape: Same shape as the input.",
		"options": [
			//"alpha_initializer", "alpha_regularizer", "alpha_constraint", "shared_axes"
		]
	},
	"relu": {
		"description": "Rectified Linear Unit activation function. Input shape: Arbitrary. Use the config field inputShape (Array of integers, does not include the sample axis) when using this layer as the first layer in a model. Output shape: Same shape as the input.",
		"options": [
			"max_value"
		]
	},
	"softmax": {
		"description": "Softmax activation layer. Input shape: Arbitrary. Use the configuration inputShape when using this layer as the first layer in a model. Output shape: Same shape as the input.",
		"options": [
			"axis"
		]
	},
	"thresholdedReLU": {
		"description": "Thresholded Rectified Linear Unit. It follows: f(x) = x for x > theta, f(x) = 0 otherwise. Input shape: Arbitrary. Use the configuration inputShape when using this layer as the first layer in a model. Output shape: Same shape as the input.",
		"options": [
			"theta"
		]
	}
};

var prev_layer_data = [];

var cam = null;

var cam_data = null;

var changed_data_source = false;

var csv_allow_training = false;

var special_reason_disable_training = false;

var conv_visualizations = {};

var current_epoch = 0;

var this_training_start_time = null;

var demo_mode_data_origin = {};

var demo_mode_data_original_css = {};

var demo_interval = undefined;

var current_layer_status_hash = "";

var weights_files = {};

var layers_container_md5 = "";

var _cached_json = {};

var stop_downloading_data = false;

var no_update_math = false;

var example_plotly_data = [[1,1], [1,1.5], [1.9,2.1], [3.95, 1.01], [6, 20]];

var user_id = null;

var math_items_hashes = {};

var graph_hashes = {};

var force_download = 0;

var force_dont_keep_weights = false;

var last_l = "";

var has_missing_values = false;

var has_zero_output_shape = false;

var uploaded_model = "";

var auto_predict_webcam_interval = null;

var skip_predictions = false;

var available_webcams = [];

var available_webcams_ids = [];

var webcam_id = 0;

var webcam_modes = ["user", "environment"];

var hasBothFrontAndBackCached = undefined;

var last_highlighting_md5 = "";

var training_logs_batch = {
	"loss": {
		"x": [],
		"y": [],
		"type": "scatter",
		"mode": 'lines+markers',
		"name": 'Loss'
	}
};

var training_logs_epoch = {
	"loss": {
		"x": [],
		"y": [],
		"type": "scatter",
		"mode": 'lines+markers',
		"name": 'Loss'
	}
};

var time_per_batch = {
	"time": {
		"x": [],
		"y": [],
		"type": "scatter",
		"mode": 'lines+markers',
		"name": 'Time per batch (in seconds)'
	}
};

var training_memory_history = {
	numBytes: {
		"x": [],
		"y": [],
		"type": "scatter",
		"mode": 'lines+markers',
		"name": 'RAM (MB)'
	},
	numBytesInGPU: {
		"x": [],
		"y": [],
		"type": "scatter",
		"mode": 'lines+markers',
		"name": 'GPU (MB)'
	},
	numTensors: {
		"x": [],
		"y": [],
		"type": "scatter",
		"mode": 'lines+markers',
		"name": 'Number of Tensors'
	}
};

var plotly_color = {
	paper_bgcolor: "rgba(0, 0, 0, 0)",
	plot_bgcolor: "rgba(0, 0, 0, 0)",
	gridcolor: "#7c7c7c",
	font: {
		family: 'Courier New, monospace',
		size: 18,
		color: '#7f7f7f'
	},
	xaxis: {dtick: 1}
};

var stop_generating_images = false;

var fireworks_counter = 0;

var in_fireworks = 0;

var predict_examples_hash = "";

var inited_webcams = false;

var last_batch_time = 0;

var col_contains_string = [];

var losses = [
	"meanSquaredError",
	"binaryCrossentropy",
	"categoricalCrossentropy",
	"categoricalHinge",
	"hinge",
	"meanAbsoluteError",
	"meanAbsolutePercentageError",
	"meanSquaredLogarithmicError",
	"poisson",
	"sparseCategoricalCrossentropy",
	"squaredHinge",
	"kullbackLeiblerDivergence",
	"logcosh"
];

var metrics = [
	"binaryAccuracy",
	"categoricalAccuracy",
	"precision",
	"categoricalCrossentropy",
	"sparseCategoricalCrossentropy",
	"meanSquaredError",
	"meanAbsoluteError",
	"meanAbsolutePercentageError",
	"cosine" //,
	//"binaryCrossentropy"
];

var metric_shortnames = {
	"mse": "meanSquaredError",
	"mape": "meanAbsolutePercentageError",
	"mae": "meanAbsoluteError"
}

var current_status_hash = "";

var last_zero_output_shape_status = "";

var valid_initializer_types = ["kernel", "bias", "gamma", "beta", "activity", "moving_variance", "moving_mean"];

var opt = {
	"initializer_value": "'Value', 'XXX_NAME_XXX_initializer_value', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_seed": "'Seed', 'XXX_NAME_XXX_initializer_seed', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_stddev": "'Stddev', 'XXX_NAME_XXX_initializer_stddev', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_mean": "'Mean', 'XXX_NAME_XXX_initializer_mean', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_minval": "'Minval', 'XXX_NAME_XXX_initializer_minval', 'number', { 'value': 0 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_maxval": "'Maxval', 'XXX_NAME_XXX_initializer_maxval', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_gain": "'Gain', 'XXX_NAME_XXX_initializer_gain', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer": "'XXX_NAME_XXX Initializer', 'XXX_NAME_XXX_initializer', 'select', initializers, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_scale": "'Scale', 'XXX_NAME_XXX_initializer_scale', 'number', { 'value': 1 }, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_mode": "'Mode', 'XXX_NAME_XXX_initializer_mode', 'select', mode_modes, nr, 'XXX_NAME_XXX_initializer_tr'",
	"initializer_distribution": "'Distribution', 'XXX_NAME_XXX_initializer_distribution', 'select', distribution_modes, nr, 'XXX_NAME_XXX_initializer_tr'"
}

var keys_opt = Object.keys(opt);
for (var i = 0; i < valid_initializer_types.length; i++) {
	for (var j = 0; j < keys_opt.length; j++) {
		var params = opt[keys_opt[j]];
		params = params.replace(/XXX_NAME_XXX/g, valid_initializer_types[i]);

		var func_name = "add_" + valid_initializer_types[i] + "_" + keys_opt[j] + "_option";
		var func_header = "var " + func_name + " = function (type, nr) {\n";

		var func = func_header;
		func += "\treturn get_tr_str_for_layer_table(" + params + ");\n";
		func += "}\n";

		//console.log(func);

		//if(func_name == "add_kernel_initializer_value_option") {
		//	console.log(func);
		//}

		try {
			$.globalEval(func);
		} catch (e) {
			console.error(e);
		}
	}
}


var general_options = {
	'theta': '"&theta;", "theta", "number", { "step": 1, "value": -1 }, nr',
	'axis': '"Axis", "axis", "number", { "min": -1, "max": 1000, "step": 1, "value": get_default_option(type, "axis") }, nr',
	'max_value': '"Max-Value", "max_value", "number", { "step": 1, "value": get_default_option(type, "max_value") }, nr',
	'size': '"Size", "size", "text", { "text": "2,2", "placeholder": "2 comma-seperated numbers" }, nr',
	'target_shape': '"Target-Shape", "target_shape", "text", { "text": calculate_default_target_shape(nr), "placeholder": "Array-Shape" }, nr',
	'dilation_rate': '"Dilation-Rate", "dilation_rate", "text", { "text": "", "placeholder": "1-3 numbers" }, nr',
	'padding': '"Padding", "padding", "select", { "valid": "valid", "same": "same" }, nr',
	'filters': '"Filters", "filters", "number", { "min": 1, "max": 256, "step": 1, "value": get_default_option(type, "filters") }, nr',
	'alpha': '"&alpha;", "alpha", "number", { "max": 100, "step": 0.01, "value": get_default_option(type, "alpha") }, nr',
	'dropout_rate': '"Dropout rate (0 to 1)", "dropout_rate", "number", { "min": 0, "max": 1, "step": 0.05, "value": get_default_option(type, "dropout_rate") }, nr',
	'center': '"Center?", "center", "checkbox", { "status": "checked" }, nr',
	'trainable': '"Trainable", "trainable", "checkbox", { "status": "checked" }, nr',
	'scale': '"Scale?", "scale", "checkbox", { "status": "checked" }, nr',
	'unroll': '"Unroll?", "unroll", "checkbox", { "status": "checked" }, nr',
	'unit_forget_bias': '"Unit forget bias", "unit_forget_bias", "checkbox", { "status": "checked" }, nr',
	'implementation': '"Implementation", "implementation", "select", implementation_modes, nr',
	'dropout': '"Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "dropout") }, nr',
	'epsilon': '"&epsilon; multiplier", "epsilon", "number", { "min": -1, "max": 1, "step": 0.0001, "value": get_default_option(type, "epsilon") }, nr',
	'rate': '"Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "dropout") }, nr',
	'recurrent_dropout': '"Recurrent dropout rate (0 to 1)", "recurrent_dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "recurrent_dropout") }, nr',
	'max_features': '"Max features", "max_features", "number", { "min": 1, "max": 4096, "step": 1, "value": get_default_option(type, "max_features") }, nr',
	'momentum': '"Momentum", "momentum", "number", { "min": 0, "max": 8192, "step": 0.01, "value": get_default_option(type, "momentum") }, nr',
	'units': '"Units", "units", "number", { "min": 1, "max": 8192, "step": 1, "value": get_default_option(type, "units") }, nr',
	'use_bias': '"Use Bias", "use_bias", "checkbox", { "status": "checked" }, nr',
	'dtype': '"DType", "dtype", "select", dtypes, nr, null, 1',
	'interpolation': '"Interpolation", "interpolation", "select", interpolation, nr',
	'stddev': '"Standard-Deviation", "stddev", "number", { "min": 0, "value": get_default_option(type, "stddev") }, nr',
	'stateful': '"Stateful?", "stateful", "checkbox", { "status": "" }, nr',
	'return_state': '"Return state?", "return_state", "checkbox", { "status": "" }, nr',
	'depth_multiplier': '"Depth multiplier", "depth_multiplier", "number", { "min": 0, "max": 1, "step": 0.1, "value": get_default_option(type, "depth_multiplier") }, nr',
	'go_backwards': '"Go Backwards?", "go_backwards", "checkbox", { "status": "" }, nr',
	'return_sequences': '"Return sequences?", "return_sequences", "checkbox", { "status": "checked" }, nr',

	// initializer
	'moving_mean_initializer': '"Moving mean Initializer", "moving_mean_initializer", "select", initializers, nr',
	'recurrent_initializer': '"Recurrent Initializer", "recurrent_initializer", "select", initializers, nr',
	'moving_variance_initializer': '"Moving variance Initializer", "moving_variance_initializer", "select", initializers, nr, "moving_variance_initializer_td"',
	'beta_initializer': '"&beta; Initializer", "beta_initializer", "select", initializers, nr',
	'pointwise_initializer': '"Pointwise Initializer", "pointwise_initializer", "select", initializers, nr',
	'depthwise_initializer': '"Depthwise Initializer", "depthwise_initializer", "select", initializers, nr',

	// constraint
	'recurrent_constraint': '"Recurrent Constraint", "recurrent_constraint", "select", constraints, nr',
	'bias_constraint': '"Bias Constraint", "bias_constraint", "select", constraints, nr',
	'gamma_constraint': '"&gamma; Constraint", "gamma_constraint", "select", constraints, nr',
	'beta_constraint': '"&beta; Constraint", "beta_constraint", "select", constraints, nr',
	'kernel_constraint': '"Kernel Constraint", "kernel_constraint", "select", constraints, nr',
	'pointwise_constraint': '"Pointwise Constraint", "pointwise_constraint", "select", constraints, nr',
	'depthwise_constraint': '"Depthwise Constraint", "depthwise_constraint", "select", constraints, nr',

	// activation
	'activation_axis': '"Axis", "activation_axis", "number", { "value": -1 }, nr, "activation_tr"',
	'activation_max_value': '"Max-Value", "activation_max_value", "number", { "value": 1 }, nr, "activation_tr"',
	'activation_alpha': '"&alpha;", "activation_alpha", "number", { "value": 1 }, nr, "activation_tr"',
	'activation_theta': '"&theta;", "activation_theta", "number", { "value": 0.01 }, nr, "activation_tr"',
	'recurrent_activation': '"Recurrent Activation function", "recurrent_activation", "select", activations, nr',

	// regularizer
	'bias_regularizer': '"Bias-Regularizer", "bias_regularizer", "select", regularizer_select, nr',
	'activity_regularizer': '"Activity-Regularizer", "activity_regularizer", "select", regularizer_select, nr',
	'kernel_regularizer': '"Kernel Regularizer", "kernel_regularizer", "select", initializers, nr',
	'activity_regularizer_l1': '"l1", "activity_regularizer_l1", "number", { "value": 0.01 }, nr, "activity_regularizer_tr"',
	'activity_regularizer_l2': '"l2", "activity_regularizer_l2", "number", { "value": 0.01 }, nr, "activity_regularizer_tr"',
	'kernel_regularizer': '"Kernel-Regularizer", "kernel_regularizer", "select", regularizer_select, nr',
	'bias_regularizer_l1': '"l1", "bias_regularizer_l1", "number", { "value": 0.01 }, nr, "bias_regularizer_tr"',
	'bias_regularizer_l2': '"l2", "bias_regularizer_l2", "number", { "value": 0.01 }, nr, "bias_regularizer_tr"',
	'kernel_regularizer_l1': '"l1", "kernel_regularizer_l1", "number", { "value": 0.01 }, nr, "kernel_regularizer_tr"',
	'kernel_regularizer_l2': '"l2", "kernel_regularizer_l2", "number", { "value": 0.01 }, nr, "kernel_regularizer_tr"'
};

var general_options_keys = Object.keys(general_options);

for (var i = 0; i < general_options_keys.length; i++) {
	var func = "var add_" + general_options_keys[i] + "_option = function (type, nr) { return get_tr_str_for_layer_table(" + general_options[general_options_keys[i]]+ "); }";
	try {
		$.globalEval(func);
	} catch (e) {
		console.error(e);
	}
}

var cookie_theme = "lightmode";
