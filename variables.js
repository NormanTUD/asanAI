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
var current_undo_status = 0;

var mode = "amateur";
var global_disable_auto_enable_valid_layer_types = true;
var throw_compile_exception = false;
var model_is_trained = false;
var disable_layer_debuggers = 0;
var pixel_size = 2;
var kernel_pixel_size = 10;
var model = null;
var h = null;
var number_channels = 3;
var height = 32;
var width = 32;
var labels = [];
var vector_counter = 1;
var word_to_id = {};
var disable_show_python_and_create_model = false;
var layer_structure_cache = null;
var allowed_layer_cache = [];
var last_allowed_layers_update = null;
var started_training = false;

var max_images_per_layer = 0;

var x_file = null;
var y_file = null;
var y_shape = null;

const surface = { name: "Model Summary", tab: "Model Inspection" };

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
	"rate": "rate",
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
	"targetShape": "target_shape"
};

var python_names_to_js_names = {};

for (var key of Object.keys(js_names_to_python_names)) {
	python_names_to_js_names[js_names_to_python_names[key]] = lowercaseFirstLetter(key);
}

var layer_options = {
	"dense": {
		"description": "Creates a dense (fully connected) layer.<br>This layer implements the operation: <tt>output = activation(dot(input, kernel) + bias)</tt> activation is the element-wise activation function passed as the activation argument.<br><tt>kernel</tt> is a weights matrix created by the layer.<br><tt>bias</tt> is a bias vector created by the layer (only applicable if useBias is true).",
		"options": [
			"trainable", "use_bias", "units", "activation", "kernel_initializer", "bias_initializer", "dtype", "kernel_regularizer", "bias_regularizer", "visualize"
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
			"dropout_rate", "dtype", "kernel_regularizer", "bias_regularizer"
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
		"description": "Exponetial Linear Unit (ELU).<br>It follows: <tt>f(x) = alpha * (exp(x) - 1.) for x < 0, f(x) = x for x >= 0</tt>.",
		"options": [
			"alpha", "trainable", "dtype"
		],
		"category": "Activation"
	},

	"leakyReLU": {
		"description": "Leaky version of a rectified linear unit.<br>It allows a small gradient when the unit is not active: <tt>f(x) = alpha * x for x < 0. f(x) = x for x >= 0</tt>.",
		"options": [
			"alpha", "trainable", "dtype"
		],
		"category": "Activation"
	},
	"reLU": {
		"description": "Rectified Linear Unit activation function.",
		"options": [
			"max_value", "dtype"
		],
		"category": "Activation"
	},
	"softmax": {
		"description": "Softmax activation layer.",
		"options": [
			"axis", "dtype"
		],
		"category": "Activation"
	},
	/*
	"thresholdedReLU": {
		"description": "Thresholded Rectified Linear Unit. It follows: <tt>f(x) = x</tt> for <tt>x > theta</tt>, <tt>f(x) = 0</tt> otherwise.",
		"options": [
			"theta"
		],
		"category": "Activation"
	},
	*/


	"batchNormalization": {
		"description": "Batch normalization layer (Ioffe and Szegedy, 2014).<br>Normalize the activations of the previous layer at each batch, i.e. applies a transformation that maintains the mean activation close to 0 and the activation standard deviation close to 1.",
		"options": [
			"axis", "momentum", "epsilon", "center", "scale", "beta_initializer",
			"gamma_initializer", "moving_mean_initializer", "moving_variance_initializer",
			"beta_constraint", "gamma_constraint", "trainable", "dtype"
		],
		"category": "Normalization"
	},
	"layerNormalization": {
		"description": "Layer-normalization layer (Ba et al., 2016). Normalizes the activations of the previous layer for each given example in a batch independently, instead of across a batch like in batchNormalization. In other words, this layer applies a transformation that maintanis the mean activation within each example close to0 and activation variance close to 1.",
		"options": [
			"axis", "epsilon", "center", "scale", "beta_initializer",
			"gamma_initializer", "trainable", "dtype"
		],
		"category": "Normalization"
	},


	"conv1d": {
		"description": "1D convolution layer (e.g., temporal convolution).<br>This layer creates a convolution kernel that is convolved with the layer input over a single spatial (or temporal) dimension to produce a tensor of outputs.<br>If <tt>use_bias</tt> is True, a bias vector is created and added to the outputs.<br>If <tt>activation</tt> is not <tt>null</tt>, it is applied to the outputs as well.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size", "strides", "dilation_rate", "kernel_initializer", "bias_initializer", "dtype", "kernel_regularizer", "bias_regularizer"
		],
		"category": "Convolutional"
	},
	"conv2d": {
		"description": "2D convolution layer (e.g. spatial convolution over images).<br>This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.<br>If <tt>useBias</tt> is True, a bias vector is created and added to the outputs.<br>If <tt>activation</tt> is not null, it is applied to the outputs as well.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size", "strides", "dilation_rate", "kernel_initializer", "bias_initializer", 'dtype', "kernel_regularizer", "bias_regularizer", "visualize"
		],
		"category": "Convolutional"
	},
	"conv2dTranspose": {
		"description": "Transposed convolutional layer (sometimes called Deconvolution). The need for transposed convolutions generally arises from the desire to use a transformation going in the opposite direction of a normal convolution, i.e., from something that has the shape of the output of some convolution to something that has the shape of its input while maintaining a connectivity pattern that is compatible with said convolution.",
		"options": [
			"filters", "kernel_size", "strides", "padding", "dilation_rate", "activation", "use_bias", "kernel_initializer", "bias_initializer", "kernel_constraint", "bias_constraint", "trainable", "dtype", "kernel_regularizer", "bias_regularizer"
		],
		"category": "Convolutional"
	},
	"conv3d": {
		"description": "3D convolution layer (e.g. spatial convolution over volumes).<br>This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size", "strides", "dilation_rate", "kernel_initializer", "bias_initializer", "dtype", "kernel_regularizer", "bias_regularizer"
		],
		"category": "Convolutional"
	},
	"depthwiseConv2d": {
		"description": "Depthwise separable 2D convolution. Depthwise Separable convolutions consists in performing just the first step in a depthwise spatial convolution (which acts on each input channel separately). The depthMultiplier argument controls how many output channels are generated per input channel in the depthwise step.",
		"options": [
			"kernel_size", "depth_multiplier", "depthwise_initializer",
			"depthwise_constraint", "strides", "padding", "dilation_rate",
			"activation", "use_bias", "kernel_initializer",
			"bias_initializer", "kernel_constraint", "bias_constraint",
			"trainable", "dtype"
		],
		"category": "Convolutional"
	},
	"separableConv2d": {
		"description": "Depthwise separable 2D convolution. Separable convolution consists of first performing a depthwise spatial convolution (which acts on each input channel separately) followed by a pointwise convolution which mixes together the resulting output channels. The depthMultiplier argument controls how many output channels are generated per input channel in the depthwise step.",
		"options": [
			"depth_multiplier", "depthwise_initializer", 
			"pointwise_initializer", "depthwise_constraint",
			"pointwise_constraint", "filters", "kernel_size",
			"strides", "padding", "dilation_rate", "activation",
			"use_bias", "bias_initializer", "bias_constraint",
			"trainable", "dtype", "kernel_regularizer", "bias_regularizer"
		],
		"category": "Convolutional"
	},
	"upSampling2d": {
		"description": "Upsampling layer for 2D inputs. Repeats the rows and columns of the data by size[0] and size[1] respectively.",
		"options": [
			"size", "interpolation", "trainable", "dtype", "kernel_regularizer", "bias_regularizer"
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
			"stateful", "unroll", "trainable", "dtype", "kernel_regularizer", "bias_regularizer"
			
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
			"strides", "padding", "dilation_rate", "dtype", "kernel_regularizer", "bias_regularizer"
		],
		"category": "Recurrent"
	},
	*/

	"alphaDropout": {
		"description": "Applies Alpha Dropout to the input. As it is a regularization layer, it is only active at training time.",
		"options": [
			"rate", "trainable", "dtype"
		],
		"category": "Noise"
	},
	"gaussianDropout": {
		"description": "Apply multiplicative 1-centered Gaussian noise. As it is a regularization layer, it is only active at training time.",
		"options": [
			"rate", "trainable", "dtype"
		],
		"category": "Noise"
	},
	"gaussianNoise": {
		"description": "Apply additive zero-centered Gaussian noise. As it is a regularization layer, it is only active at training time.",
		"options": [
			"stddev", "trainable", "dtype"
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
	'complex64': 'complex64',
	'string': 'string'
};

var layer_names = Object.keys(layer_options);

var function_times = {};

var number_of_initialized_layers = 0;

var is_setting_config = false;

var call_depth = 0;

var model_config_hash = "";

var show_input_layer = true;

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
			"alpha"
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

var changed_data_source = false;

var csv_allow_training = false;

var special_reason_disable_training = false;

var conv_visualizations = {};

var current_epoch = 0;

var original_title = document.title;

var this_training_start_time = null;

var demo_mode_data_origin = {};

var demo_mode_data_original_css = {};

var demo_interval = undefined;

var current_layer_status_hash = "";

var weights_files = {};

var redo_labels = true;

var layers_container_md5 = "";
