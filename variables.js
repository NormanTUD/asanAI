"use strict";

var language;
var has_webgl;
var git_hash;
var original_title;
var traindata_struct;

var last_known_good_input_shape = "[]";

function get_input_shape_as_string () {
	var is = [];
	try {
		if (!model) {
			is = get_input_shape();
		} else {
			try {
				var is_full = model.input.shape;
				if (is_full) {
					for (var is_full_idx = 1; is_full_idx < is_full.length; is_full_idx++) {
						is.push(is_full[is_full_idx]);
					}
				}
			} catch (e) {
				var emsg = "" + e;
				if (emsg.includes("Cannot read properties of undefined") || emsg.includes("model.input is undefined") || emsg.includes("model.input.shape is undefined")) {
					is = get_input_shape();
				} else {
					throw new Error(e);
				}
			}
		}

		return is.length ? "[" + is.join(", ") + "]" : "[]";
	} catch (e) {
		wrn("[get_input_shape_as_string] " + e);
		return "[]";
	}
}

function get_last_good_input_shape_as_string () {
	var is = get_input_shape_as_string();
	if(is != "[]") {
		if(last_known_good_input_shape != "[]") {
			return last_known_good_input_shape;
		}
	}
}

function get_plotly_type () { // start_tensors
	return "lines";
}

function get_scatter_type () { // start_tensors
	return "scatter";
	/*
	if(has_webgl) {
		return "scattergl";
	}
	return "scatter";
	*/
}

function uuidv4() {
	return crypto.randomUUID();
}

function calculate_default_target_shape (nr) {
	assert(typeof(nr) == "number", `calculate_default_target_shape(nr = ${nr}), nr is not a number, but ${typeof(nr)}`);

	try {
		var input_shape = model?.layers[Math.max(0, nr - 1)]?.getOutputAt(0)?.shape;

		if(!input_shape) {
			err("Error getting input shape");

			return null;
		}

		var output = [];

		for (var input_shape_idx = 0; input_shape_idx < input_shape.length; input_shape_idx++) {
			if(Number.isInteger(input_shape[input_shape_idx])) {
				output.push(input_shape[input_shape_idx]);
			}
		}

		return output;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[calculate_default_target_shape] " + e);

		return null;
	}
}

function lowercase_first_letter (_string) {
	if(typeof(_string) != "string") {
		wrn(`[lowercase_first_letter] lowercase_first_letter(_string = ${_string}), typeof: ${typeof(_string)}`);
		_string = "" + _string;
	}

	try {
		var res = _string.charAt(0).toLowerCase() + _string.slice(1);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[lowercase_first_letter] " + e);

		return null;
	}
}

var state_stack = [];
var future_state_stack = [];
var status_saves = {};

var disabling_saving_status = false;

var mode = "beginner";
var global_disable_auto_enable_valid_layer_types = true;
var model_is_trained = false;
var disable_layer_debuggers = 0;
var pixel_size = 1;
var kernel_pixel_size = 10;
var model = null;
var h = null;
var number_channels = 3;
var height = 40;
var width = 40;
var labels = [];
var disable_show_python_and_create_model = false;
var layer_structure_cache = null;
var allowed_layer_cache = [];
var last_allowed_layers_update = null;
var started_training = false;

var x_file = null;
var y_file = null;
var y_shape = null;

var xy_data_global = null;

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
	python_names_to_js_names[js_names_to_python_names[key]] = lowercase_first_letter(key);
}

var layer_options = {
	"dense": {
		"description": "<span class=\"TRANSLATEME_dense_description\" \/>",
		"options": [
			"trainable",
			"use_bias",
			"units",
			"activation",
			"kernel_initializer",
			"bias_initializer",
			"kernel_regularizer",
			"bias_regularizer",
			"visualize",
			"dtype"
		],
		"category": "Basic"
	},
	"flatten": {
		"description": "<span class=\"TRANSLATEME_flatten_description\" \/>",
		"options": [
			"visualize"
		],
		"category": "Basic"
	},
	"dropout": {
		"description": "<span class=\"TRANSLATEME_dropout_description\" \/>",
		"options": [
			"dropout_rate",
			"dtype",
			"seed"
		],
		"category": "Basic"
	},
	"reshape": {
		"description": "<span class=\"TRANSLATEME_reshape_description\" \/>",
		"options": [
			"target_shape",
			"dtype"
		],
		"category": "Basic"
	},
	"elu": {
		"description": "<span class=\"TRANSLATEME_elu_description\" \/>",
		"options": [
			"alpha",
			"dtype"
		],
		"category": "Activation"
	},
	"leakyReLU": {
		"description": "<span class=\"TRANSLATEME_leakyReLU_description\" \/>",
		"options": [
			"alpha",
			"dtype"
		],
		"category": "Activation"
	},
	"reLU": {
		"description": "<span class=\"TRANSLATEME_reLU_description\" \/>",
		"options": [
			"max_value",
			"dtype"
		],
		"category": "Activation"
	},
	"softmax": {
		"description": "<span class=\"TRANSLATEME_softmax_description\" \/>",
		"options": [
			"axis",
			"dtype"
		],
		"category": "Activation"
	},
	"thresholdedReLU": {
		"description": "<span class=\"TRANSLATEME_thresholdedReLU_description\" \/>",
		"options": [
			"theta"
		],
		"category": "Activation"
	},
	/*
	"batchNormalization": {
		"description": "<span class=\"TRANSLATEME_batchNormalization_description\" \/>",
		"options": [
			"trainable",
			"center",
			"scale",
			"axis",
			"epsilon",
			"gamma_initializer",
			"gamma_constraint",
			"beta_initializer",
			"beta_constraint",
			"moving_mean_initializer",
			"moving_variance_initializer",
			"dtype"
		],
		"category": "Normalization"
	},
	*/
	"layerNormalization": {
		"description": "<span class=\"TRANSLATEME_layerNormalization_description\" \/>",
		"options": [
			"center",
			"scale",
			"axis",
			"epsilon",
			"beta_initializer",
			"gamma_initializer",
			"dtype"
		],
		"category": "Normalization"
	},
	"conv1d": {
		"description": "<span class=\"TRANSLATEME_conv1d_description\" \/>",
		"options": [
			"trainable",
			"use_bias",
			"activation",
			"padding",
			"filters",
			"kernel_size",
			"strides",
			"dilation_rate",
			"kernel_initializer",
			"bias_initializer",
			"kernel_regularizer",
			"bias_regularizer",
			"visualize",
			"dtype"
		],
		"category": "Convolutional"
	},
	"conv2d": {
		"description": "<span class=\"TRANSLATEME_conv2d_description\" \/>",
		"options": [
			"trainable",
			"use_bias",
			"activation",
			"padding",
			"filters",
			"kernel_size",
			"strides",
			"dilation_rate",
			"kernel_initializer",
			"bias_initializer",
			"kernel_regularizer",
			"bias_regularizer",
			"visualize",
			"dtype"
		],
		"category": "Convolutional"
	},
	"conv2dTranspose": {
		"description": "<span class=\"TRANSLATEME_conv2dTranspose_description\" \/>",
		"options": [
			"filters",
			"kernel_size",
			"strides",
			"padding",
			"dilation_rate",
			"activation",
			"use_bias",
			"kernel_initializer",
			"bias_initializer",
			"kernel_constraint",
			"bias_constraint",
			"trainable",
			"kernel_regularizer",
			"bias_regularizer",
			"dtype"
		],
		"category": "Convolutional"
	},
	"conv3d": {
		"description": "<span class=\"TRANSLATEME_conv3d_description\" \/>",
		"options": [
			"trainable",
			"use_bias",
			"activation",
			"padding",
			"filters",
			"kernel_size",
			"strides",
			"dilation_rate",
			"kernel_initializer",
			"bias_initializer",
			"kernel_regularizer",
			"bias_regularizer",
			"visualize",
			"dtype"
		],
		"category": "Convolutional"
	},
	"depthwiseConv2d": {
		"description": "<span class=\"TRANSLATEME_depthwiseConv2d_description\" \/>",
		"options": [
			"trainable",
			"use_bias",
			"activation",
			"kernel_size",
			"strides",
			"depth_multiplier",
			"depthwise_initializer",
			"depthwise_constraint",
			"padding",
			"dilation_rate",
			"kernel_initializer",
			"bias_initializer",
			"kernel_constraint",
			"bias_constraint",
			"visualize",
			"dtype"
		],
		"category": "Convolutional"
	},
	"separableConv2d": {
		"description": "<span class=\"TRANSLATEME_separableConv2d_description\" \/>",
		"options": [
			"trainable",
			"use_bias",
			"depth_multiplier",
			"depthwise_initializer",
			"pointwise_initializer",
			"depthwise_constraint",
			"pointwise_constraint",
			"filters",
			"kernel_size",
			"strides",
			"padding",
			"dilation_rate",
			"activation",
			"bias_initializer",
			"bias_constraint",
			"kernel_regularizer",
			"bias_regularizer",
			"visualize",
			"dtype"
		],
		"category": "Convolutional"
	},
	"upSampling2d": {
		"description": "<span class=\"TRANSLATEME_upSampling2d_description\" \/>",
		"options": [
			"trainable",
			"size",
			"interpolation",
			"visualize",
			"dtype"
		],
		"category": "Convolutional"
	},
	"averagePooling1d": {
		"description": "<span class=\"TRANSLATEME_averagePooling1d_description\" \/>",
		"options": [
			"padding",
			"pool_size",
			"strides",
			"dtype"
		],
		"category": "Pooling"
	},
	"averagePooling2d": {
		"description": "<span class=\"TRANSLATEME_averagePooling2d_description\" \/>",
		"options": [
			"padding",
			"pool_size",
			"strides",
			"dtype"
		],
		"category": "Pooling"
	},
	"averagePooling3d": {
		"description": "<span class=\"TRANSLATEME_averagePooling3d_description\" \/>",
		"options": [
			"padding",
			"pool_size",
			"strides",
			"dtype"
		],
		"category": "Pooling"
	},
	"maxPooling1d": {
		"description": "<span class=\"TRANSLATEME_maxPooling1d_description\" \/>",
		"options": [
			"pool_size",
			"strides",
			"padding",
			"dtype"
		],
		"category": "Pooling"
	},
	"maxPooling2d": {
		"description": "<span class=\"TRANSLATEME_maxPooling2d_description\" \/>",
		"options": [
			"pool_size",
			"strides",
			"padding",
			"dtype"
		],
		"category": "Pooling"
	},
	"maxPooling3d": {
		"description": "<span class=\"TRANSLATEME_maxPooling3d_description\" \/>",
		"options": [
			"pool_size",
			"strides",
			"padding",
			"dtype"
		],
		"category": "Pooling"
	},
	"alphaDropout": {
		"description": "<span class=\"TRANSLATEME_alphaDropout_description\" \/>",
		"options": [
			"rate",
			"seed",
			"dtype"
		],
		"category": "Noise"
	},
	"gaussianDropout": {
		"description": "<span class=\"TRANSLATEME_gaussianDropout_description\" \/>",
		"options": [
			"rate",
			"dtype"
		],
		"category": "Noise"
	},
	"gaussianNoise": {
		"description": "<span class=\"TRANSLATEME_gaussianNoise_description\" \/>",
		"options": [
			"stddev",
			"seed",
			"dtype"
		],
		"category": "Noise"
	},
	"DebugLayer": {
		"description": "<span class=\"TRANSLATEME_DebugLayer_description\" \/>",
		"options": [],
		"category": "Debug",
		"custom": 1
	}
};

var model_data_structure = {
	"sgd": ["learningRate", "momentum"],
	"rmsprop": ["learningRate", "rho", "epsilon", "momentum"],
	"adam": ["learningRate", "beta1", "beta2", "epsilon"],
	"adagrad": ["learningRate", "initialAccumulatorValue", "epsilon"],
	"adadelta": ["learningRate", "rho", "epsilon"],
	"adamax": ["learningRate", "beta1", "beta2", "epsilon"]
};

var activations = {
	"relu": "ReLu",
	"linear": "Linear",
	"sigmoid": "Sigmoid",
	"elu": "ELU",
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
	if(!name) {
		wrn("[get_name_case_independent] name not defined");
		return "";
	}

	try {
		if(typeof(name) != "string") {
			wrn(`[get_name_case_independent] "${name}" is not a string, it will be converted silently from ${typeof(name)} to string`);
			name = "" + name;
		}

		for (var key of Object.keys(from_hash)) {
			if(key.toLowerCase() == name.toLowerCase() || from_hash[key].toLowerCase() == name.toLowerCase()) {
				return from_hash[key];
			}
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[get_name_case_independent] " + e);
	}
	return null;
}

function get_initializer_name (name) {
	var res = get_name_case_independent(name, initializers);

	if(!name) {
		wrn("[get_initializer_name] Cannot determine the kernel initializer name of " + name);
		return null;
	} else {
		return res;
	}
}

var current_status_hash = "";

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
	"filters": 4,
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

	"bias_initializer": "glorotUniform",
	"recurrent_initializer": "glorotUniform",
	"beta_initializer": "glorotUniform",
	"gamma_initializer": "glorotUniform",
	"moving_mean_initializer": "glorotUniform",
	"moving_variance_initializer": "glorotUniform",
	"pointwise_initializer": "glorotUniform",
	"depthwise_initializer": "glorotUniform",
	"kernel_initializer": "glorotUniform",

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

	"kernel_size_x": "1",
	"kernel_size_y": "1",
	"kernel_size_z": "1",

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
	"float32": "float32",
	"int32": "int32",
	"bool": "bool",
	//"complex64": "complex64" //,
	//'string': 'string'
};

var layer_names = Object.keys(layer_options);

var function_times = {};

var number_of_initialized_layers = 0;

var is_setting_config = false;

var call_depth = 0;

var model_config_hash = "";

var show_input_layer = false;

var memory_debug_interval = null;

var tensors = {};

var distribution_modes = {
	"normal": "normal",
	"uniform": "uniform",
	"truncatedNormal": "truncatedNormal"
};

var mode_modes = {
	"fanIn": "fanIn",
	"fanOut": "fanOut",
	"fanAvg": "fanAvg"
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

var changed_data_source = false;

var csv_allow_training = false;

var special_reason_disable_training = false;

var conv_visualizations = {};

var current_epoch = 0;

var this_training_start_time = null;

var current_layer_status_hash = "";

var weights_files = {};

var layers_container_md5 = "";

var _cached_json = {};

var stop_downloading_data = false;

var no_update_math = false;

var example_plotly_data = [[1,1], [1,1.5], [1.9,2.1], [3.95, 1.01], [6, 20]];

var math_items_hashes = {};

var force_download = 0;

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

var training_logs_batch = {
	"loss": {
		"x": [],
		"y": [],
		"type": get_scatter_type(),
		"mode": get_plotly_type(),
		"name": "Loss"
	}
};

var training_logs_epoch = {
	"loss": {
		"x": [],
		"y": [],
		"type": get_scatter_type(),
		"mode": get_plotly_type(),
		"name": "Loss"
	}
};

var time_per_batch = {
	"time": {
		"x": [],
		"y": [],
		"type": get_scatter_type(),
		"mode": get_plotly_type(),
		"name": "Time per batch (in seconds)"
	}
};

var training_memory_history = {
	numBytes: {
		"x": [],
		"y": [],
		"type": get_scatter_type(),
		"mode": get_plotly_type(),
		"name": "RAM (MB)"
	},
	numBytesInGPU: {
		"x": [],
		"y": [],
		"type": get_scatter_type(),
		"mode": get_plotly_type(),
		"name": "GPU (MB)"
	},
	numTensors: {
		"x": [],
		"y": [],
		"type": get_scatter_type(),
		"mode": get_plotly_type(),
		"name": "Number of Tensors"
	}
};

function get_plotly_layout (name="") {
	var plotly_layout = {
		paper_bgcolor: "rgba(0, 0, 0, 0)",
		plot_bgcolor: "rgba(0, 0, 0, 0)",
		gridcolor: "#7c7c7c",
		font: {
			family: "Arial, Helvetica, sans-serif",
			size: 18,
			color: "#7f7f7f"
		},
		xaxis: {
			dtick: 0,
			showline: false,
			showgrid: false
		},
		yaxis: {
			showline: false,
			showgrid: false
		}

	};

	if(name) {
		plotly_layout["title"] = name;
	}

	return plotly_layout;
}

var stop_generating_images = false;

var fireworks_counter = 0;

var in_fireworks = 0;

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
};

var current_status_hash = "";

var valid_initializer_types = ["kernel", "bias", "gamma", "beta", "activity", "moving_variance", "moving_mean", "alpha", "beta"];

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
	"initializer_distribution": "'<span class=\"TRANSLATEME_distribution\"></span>', 'XXX_NAME_XXX_initializer_distribution', 'select', distribution_modes, nr, 'XXX_NAME_XXX_initializer_tr'"
};

var keys_opt = Object.keys(opt);
for (var valid_initializer_idx = 0; valid_initializer_idx < valid_initializer_types.length; valid_initializer_idx++) {
	for (var j = 0; j < keys_opt.length; j++) {
		var params = opt[keys_opt[j]];
		params = params.replace(/XXX_NAME_XXX/g, valid_initializer_types[valid_initializer_idx]);

		var func_name = "add_" + valid_initializer_types[valid_initializer_idx] + "_" + keys_opt[j] + "_option";
		var func_header = "var " + func_name + " = function (type, nr) {\n";

		var func = func_header;
		func += `\tassert(typeof(type) == "string", "type is not a string ${func_name}, but " + typeof(type) + ", " + type);`;
		func += `\tassert(typeof(nr) == "number", "nr is not a number for ${func_name}, but " + typeof(type) + ", " + type);`;
		func += "\treturn get_tr_str_for_layer_table(" + params + ");\n";
		func += "}\n";

		//log(func);

		//if(func_name == "add_kernel_initializer_value_option") {
		//	log(func);
		//}

		try {
			$.globalEval(func);
		} catch (e) {
			err("[variables.js] " + e);
		}
	}
}

var general_options = {
	"theta": "\"&theta;\", \"theta\", \"number\", { \"step\": 1, \"value\": -1 }, nr",
	"axis": "\"Axis\", \"axis\", \"number\", { \"min\": -1, \"max\": 1000, \"step\": 1, \"value\": get_default_option(type, \"axis\") }, nr",
	"max_value": "\"Max-Value\", \"max_value\", \"number\", { \"step\": 1, \"value\": get_default_option(type, \"max_value\") }, nr",
	"size": "\"Size\", \"size\", \"text\", { \"text\": \"3,3\", \"placeholder\": \"2 comma-seperated numbers\" }, nr",
	"target_shape": "\"Target-Shape\", \"target_shape\", \"text\", { \"text\": calculate_default_target_shape(nr), \"placeholder\": \"Array-Shape\" }, nr",
	"dilation_rate": "\"Dilation-Rate\", \"dilation_rate\", \"text\", { \"text\": \"\", \"placeholder\": \"1-3 numbers\" }, nr",
	"padding": "\"Padding\", \"padding\", \"select\", { \"valid\": \"valid\", \"same\": \"same\" }, nr",
	"filters": "\"<span class='TRANSLATEME_filters'></span>\", \"filters\", \"number\", { \"min\": 1, \"max\": 256, \"step\": 1, \"value\": get_default_option(type, \"filters\") }, nr",
	"alpha": "\"&alpha;\", \"alpha\", \"number\", { \"max\": 100, \"step\": 0.01, \"value\": get_default_option(type, \"alpha\") }, nr",
	"dropout_rate": "\"Dropout rate (0 to 1)\", \"dropout_rate\", \"number\", { \"min\": 0, \"max\": 1, \"step\": 0.05, \"value\": get_default_option(type, \"dropout_rate\") }, nr",
	"center": "\"Center?\", \"center\", \"checkbox\", { \"status\": \"checked\" }, nr",
	"trainable": "\"<span class='TRANSLATEME_trainable'></span>\", \"trainable\", \"checkbox\", { \"status\": \"checked\" }, nr",
	"scale": "\"Scale?\", \"scale\", \"checkbox\", { \"status\": \"checked\" }, nr",
	"unroll": "\"Unroll?\", \"unroll\", \"checkbox\", { \"status\": \"checked\" }, nr",
	"unit_forget_bias": "\"Unit forget bias\", \"unit_forget_bias\", \"checkbox\", { \"status\": \"checked\" }, nr",
	"implementation": "\"Implementation\", \"implementation\", \"select\", implementation_modes, nr",
	"dropout": "\"Dropout rate (0 to 1)\", \"dropout\", \"number\", { \"min\": 0, \"max\": 1, \"step\": 0.1, \"value\": get_default_option(type, \"dropout\") }, nr",
	"epsilon": "\"&epsilon; multiplier\", \"epsilon\", \"number\", { \"min\": -1, \"max\": 1, \"step\": 0.0001, \"value\": get_default_option(type, \"epsilon\") }, nr",
	"rate": "\"Dropout rate (0 to 1)\", \"dropout\", \"number\", { \"min\": 0, \"max\": 1, \"step\": 0.1, \"value\": get_default_option(type, \"dropout\") }, nr",
	"recurrent_dropout": "\"Recurrent dropout rate (0 to 1)\", \"recurrent_dropout\", \"number\", { \"min\": 0, \"max\": 1, \"step\": 0.1, \"value\": get_default_option(type, \"recurrent_dropout\") }, nr",
	"max_features": "\"Max features\", \"max_features\", \"number\", { \"min\": 1, \"max\": 4096, \"step\": 1, \"value\": get_default_option(type, \"max_features\") }, nr",
	"momentum": "\"Momentum\", \"momentum\", \"number\", { \"min\": 0, \"max\": 8192, \"step\": 0.01, \"value\": get_default_option(type, \"momentum\") }, nr",
	"units": "\"Units\", \"units\", \"number\", { \"min\": 1, \"max\": 128, \"step\": 1, \"value\": get_default_option(type, \"units\") }, nr",
	"use_bias": "\"<span class='TRANSLATEME_use_bias'></span>\", \"use_bias\", \"checkbox\", { \"status\": \"checked\" }, nr",
	"dtype": "\"DType\", \"dtype\", \"select\", dtypes, nr, null, 1, 1",
	"interpolation": "\"Interpolation\", \"interpolation\", \"select\", interpolation, nr",
	"stddev": "\"Standard-Deviation\", \"stddev\", \"number\", { \"min\": 0, \"value\": get_default_option(type, \"stddev\") }, nr",
	"stateful": "\"Stateful?\", \"stateful\", \"checkbox\", { \"status\": \"\" }, nr",
	"return_state": "\"Return state?\", \"return_state\", \"checkbox\", { \"status\": \"\" }, nr",
	"depth_multiplier": "\"Depth multiplier\", \"depth_multiplier\", \"number\", { \"min\": 0, \"step\": 1, \"value\": get_default_option(type, \"depth_multiplier\") }, nr",
	"go_backwards": "\"Go Backwards?\", \"go_backwards\", \"checkbox\", { \"status\": \"\" }, nr",
	"return_sequences": "\"Return sequences?\", \"return_sequences\", \"checkbox\", { \"status\": \"checked\" }, nr",

	// initializer
	"moving_mean_initializer": "\"Moving mean Initializer\", \"moving_mean_initializer\", \"select\", initializers, nr",
	"recurrent_initializer": "\"Recurrent Initializer\", \"recurrent_initializer\", \"select\", initializers, nr",
	"moving_variance_initializer": "\"Moving variance Initializer\", \"moving_variance_initializer\", \"select\", initializers, nr, \"moving_variance_initializer_tr\"",
	"beta_initializer": "\"&beta; Initializer\", \"beta_initializer\", \"select\", initializers, nr",
	"pointwise_initializer": "\"Pointwise Initializer\", \"pointwise_initializer\", \"select\", initializers, nr",
	"depthwise_initializer": "\"Depthwise Initializer\", \"depthwise_initializer\", \"select\", initializers, nr",

	// constraint
	"recurrent_constraint": "\"Recurrent Constraint\", \"recurrent_constraint\", \"select\", constraints, nr",
	"bias_constraint": "\"Bias Constraint\", \"bias_constraint\", \"select\", constraints, nr",
	"gamma_constraint": "\"&gamma; Constraint\", \"gamma_constraint\", \"select\", constraints, nr",
	"beta_constraint": "\"&beta; Constraint\", \"beta_constraint\", \"select\", constraints, nr",
	"kernel_constraint": "\"Kernel Constraint\", \"kernel_constraint\", \"select\", constraints, nr",
	"pointwise_constraint": "\"Pointwise Constraint\", \"pointwise_constraint\", \"select\", constraints, nr",
	"depthwise_constraint": "\"Depthwise Constraint\", \"depthwise_constraint\", \"select\", constraints, nr",

	// activation
	"activation_axis": "\"Axis\", \"activation_axis\", \"number\", { \"value\": -1 }, nr, \"activation_tr\"",
	"activation_max_value": "\"Max-Value\", \"activation_max_value\", \"number\", { \"value\": 1 }, nr, \"activation_tr\"",
	"activation_alpha": "\"&alpha;\", \"activation_alpha\", \"number\", { \"value\": 1 }, nr, \"activation_tr\"",
	"activation_theta": "\"&theta;\", \"activation_theta\", \"number\", { \"value\": 0.01 }, nr, \"activation_tr\"",
	"recurrent_activation": "\"Recurrent Activation function\", \"recurrent_activation\", \"select\", activations, nr",

	// regularizer
	"bias_regularizer": "\"Bias-Regularizer\", \"bias_regularizer\", \"select\", regularizer_select, nr, null, 0, 1",
	"activity_regularizer": "\"Activity-Regularizer\", \"activity_regularizer\", \"select\", regularizer_select, nr, null, 0, 1",
	"kernel_regularizer": "\"Kernel Regularizer\", \"kernel_regularizer\", \"select\", initializers, nr, null, 0, 1",
	"activity_regularizer_l1": "\"l1\", \"activity_regularizer_l1\", \"number\", { \"value\": 0.01 }, nr, \"activity_regularizer_tr\", null, 0, 1",
	"activity_regularizer_l2": "\"l2\", \"activity_regularizer_l2\", \"number\", { \"value\": 0.01 }, nr, \"activity_regularizer_tr\", null, 0, 1",
	"kernel_regularizer": "\"Kernel-Regularizer\", \"kernel_regularizer\", \"select\", regularizer_select, nr, null, 0, 1",
	"bias_regularizer_l1": "\"l1\", \"bias_regularizer_l1\", \"number\", { \"value\": 0.01 }, nr, \"bias_regularizer_tr\", null, 0, 1",
	"bias_regularizer_l2": "\"l2\", \"bias_regularizer_l2\", \"number\", { \"value\": 0.01 }, nr, \"bias_regularizer_tr\", null, 0, 1",
	"kernel_regularizer_l1": "\"l1\", \"kernel_regularizer_l1\", \"number\", { \"value\": 0.01 }, nr, \"kernel_regularizer_tr\", null, 0, 1",
	"kernel_regularizer_l2": "\"l2\", \"kernel_regularizer_l2\", \"number\", { \"value\": 0.01 }, nr, \"kernel_regularizer_tr\", null, 0, 1"
};

var general_options_keys = Object.keys(general_options);

for (var general_options_idx = 0; general_options_idx < general_options_keys.length; general_options_idx++) {
	var func = "var add_" + general_options_keys[general_options_idx] + "_option = function (type, nr) { return get_tr_str_for_layer_table(" + general_options[general_options_keys[general_options_idx]] + "); }";
	try {
		$.globalEval(func);
	} catch (e) {
		err("[variables.js] " + e);
	}
}

var padding_options = {
	"valid": "valid",
	"same": "same"
};

var cookie_theme = "lightmode";

var atrament_data = {};

var shown_has_zero_data = false;

var last_drawn_descriptions = "";

var last_training_time = "";

var original_sgd = tf.train.sgd;
var original_rmsprop = tf.train.rmsprop;
var original_adamax = tf.train.adamax;
var original_adam = tf.train.adam;
var original_adadelta = tf.train.adadelta;
var original_adagrad = tf.train.adagrad;
var original_momentum = tf.train.momentum;

var old_onEpochEnd = undefined;

var last_weights_as_string = "";

var last_batch_plot_time = false;

var enable_log_trace = false;

var RGB_COLORMAP = [
	0.2422,   0.1504,  0.6603,   0.25039,   0.165,    0.70761,  0.25777,
	0.18178,  0.75114, 0.26473,  0.19776,   0.79521,  0.27065,  0.21468,
	0.83637,  0.27511, 0.23424,  0.87099,   0.2783,   0.25587,  0.89907,
	0.28033,  0.27823, 0.9221,   0.28134,   0.3006,   0.94138,  0.28101,
	0.32276,  0.95789, 0.27947,  0.34467,   0.97168,  0.27597,  0.36668,
	0.9829,   0.26991, 0.3892,   0.9906,    0.26024,  0.41233,  0.99516,
	0.24403,  0.43583, 0.99883,  0.22064,   0.46026,  0.99729,  0.19633,
	0.48472,  0.98915, 0.1834,   0.50737,   0.9798,   0.17864,  0.52886,
	0.96816,  0.17644, 0.5499,   0.95202,   0.16874,  0.57026,  0.93587,
	0.154,    0.5902,  0.9218,   0.14603,   0.60912,  0.90786,  0.13802,
	0.62763,  0.89729, 0.12481,  0.64593,   0.88834,  0.11125,  0.6635,
	0.87631,  0.09521, 0.67983,  0.85978,   0.068871, 0.69477,  0.83936,
	0.029667, 0.70817, 0.81633,  0.0035714, 0.72027,  0.7917,   0.0066571,
	0.73121,  0.76601, 0.043329, 0.7411,    0.73941,  0.096395, 0.75,
	0.71204,  0.14077, 0.7584,   0.68416,   0.1717,   0.76696,  0.65544,
	0.19377,  0.77577, 0.6251,   0.21609,   0.7843,   0.5923,   0.24696,
	0.7918,   0.55674, 0.29061,  0.79729,   0.51883,  0.34064,  0.8008,
	0.47886,  0.3909,  0.80287,  0.43545,   0.44563,  0.80242,  0.39092,
	0.5044,   0.7993,  0.348,    0.56156,   0.79423,  0.30448,  0.6174,
	0.78762,  0.26124, 0.67199,  0.77927,   0.2227,   0.7242,   0.76984,
	0.19103,  0.77383, 0.7598,   0.16461,   0.82031,  0.74981,  0.15353,
	0.86343,  0.7406,  0.15963,  0.90354,   0.73303,  0.17741,  0.93926,
	0.72879,  0.20996, 0.97276,  0.72977,   0.23944,  0.99565,  0.74337,
	0.23715,  0.99699, 0.76586,  0.21994,   0.9952,   0.78925,  0.20276,
	0.9892,   0.81357, 0.18853,  0.97863,   0.83863,  0.17656,  0.96765,
	0.8639,   0.16429, 0.96101,  0.88902,   0.15368,  0.95967,  0.91346,
	0.14226,  0.9628,  0.93734,  0.12651,   0.96911,  0.96063,  0.10636,
	0.9769,   0.9839,  0.0805
];

var is_classification = true;

var last_image_output_shape_hash = "";

var last_num_global_tensors = 0;
var last_tensor_size_cpu = 0;
var last_tensor_size_gpu = 0;

var last_status_hash = "";

var manicule = null;

var currently_running_change_data_origin = 0;

var click_on_graphs = 1;

var sketcher_warning = 0;

var finished_loading = false;

var generating_images = false;

async function set_retrain_button () {
	var html = "<span class='TRANSLATEME_train_further'></span>";
	$("#train_train_further").html(html);
	await update_translations();
}

var currently_predicting_webcam = false;

var global_model_data = undefined;

var relationScale = 1;

var set_label_debug = false;

var model_is_ok_icon = null;

var is_repairing_output_shape = false;

var last_model_ok_status = "";
var currently_generating_images = false;

var is_dark_mode = false;

var last_status_hash_text_prediction = "";

var csv_global_x = null;
var csv_global_y = null;

var global_x = null;
var global_y = null;

var last_updated_page = null;

var privacy_is_tainted = false;

var label_debugger_icon;

var last_predict_handdrawn_hash = "";

var last_handdrawn_image_hash = "";

var original_labels = [];

var call_time = Date.now();

var waiting_updated_page_uuids = [];

var shift_pressed = false;

var last_fcnn_hash = "";

var debug = false;

var confusion_matrix_and_grid_cache = {};

var old_x_str = "";
var old_y_str = "";

var is_running_test = false;

var _cached_loaded_images = {};

var enable_resize_trace = false;

var is_touch_device_cache = null;

var is_already_inverted_in_dark_mode = false;

var is_testing_unusual_inputs = false;

var number = "number";
var int = number;
var string = "string";
var object = "object";
var array = "array";

var layer_states_saved = {}

var scale_factor = 2;

var $data_origin = null;

var last_summary_model_uuid = null;

var optimizer_infos_json = [
	{
		"optimizer": "sgd",
		"variables": ["learning_rate", "momentum"],
		"info": {
			"de": "SGD (Stochastic Gradient Descent) ist ein einfacher Optimierer, der versucht, Fehler in einem Modell durch kleine Anpassungen zu minimieren. Er bewegt sich immer in Richtung des steilsten Abstiegs.",
			"en": "SGD (Stochastic Gradient Descent) is a simple optimizer that tries to minimize errors in a model by making small adjustments. It always moves in the direction of the steepest descent."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Die Geschwindigkeit, mit der das Modell lernt. Ein höherer Wert bedeutet größere Schritte, kann aber das Ziel verfehlen.",
				"en": "The speed at which the model learns. A higher value means bigger steps but might overshoot the target."
			},
			"momentum": {
				"de": "Hilft dem Modell, schneller in die richtige Richtung zu gehen, indem es vorherige Bewegungen berücksichtigt.",
				"en": "Helps the model move faster in the right direction by considering previous movements."
			}
		}
	},
	{
		"optimizer": "adagrad",
		"variables": ["learning_rate", "epsilon", "initial_accumulator_value"],
		"info": {
			"de": "Adagrad passt die Lernrate für jede Variable an, je nachdem, wie oft sie aktualisiert wurde. Es ist nützlich für Probleme mit spärlichen Daten.",
			"en": "Adagrad adjusts the learning rate for each variable depending on how often it has been updated. It is useful for problems with sparse data."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Die Anfangsgeschwindigkeit des Lernens. Adagrad reduziert diesen Wert für häufig verwendete Variablen.",
				"en": "The initial speed of learning. Adagrad reduces this value for frequently used variables."
			},
			"epsilon": {
				"de": "Ein kleiner Wert, um durch Null teilen zu vermeiden. Es hilft, die Stabilität zu gewährleisten.",
				"en": "A small value to avoid division by zero. It helps to ensure stability."
			},
			"initial_accumulator_value": {
				"de": "Startwert für die Akkumulation vergangener Gradientenquadrate. Höhere Werte führen zu kleineren Updates zu Beginn.",
				"en": "Initial value for accumulating past squared gradients. Higher values lead to smaller updates initially."
			}
		}
	},
	{
		"optimizer": "adam",
		"variables": ["learning_rate", "beta1", "beta2", "epsilon"],
		"info": {
			"de": "Adam ist ein fortschrittlicher Optimierer, der die Vorteile von Adagrad und Momentum kombiniert. Er passt die Lernrate an und berücksichtigt auch die Richtung.",
			"en": "Adam is an advanced optimizer that combines the benefits of Adagrad and Momentum. It adjusts the learning rate and considers direction."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Die Geschwindigkeit des Lernens. Adam passt diesen Wert dynamisch an.",
				"en": "The speed of learning. Adam dynamically adjusts this value."
			},
			"beta1": {
				"de": "Gewichtet, wie stark frühere Gradienten berücksichtigt werden. Ein Wert nahe 1 bedeutet, dass frühere Werte stark gewichtet werden.",
				"en": "Weights how much past gradients are considered. A value close to 1 means past values are heavily weighted."
			},
			"beta2": {
				"de": "Gewichtet, wie stark frühere Gradientenquadrate berücksichtigt werden. Hilft bei der Anpassung der Lernrate.",
				"en": "Weights how much past squared gradients are considered. Helps adjust the learning rate."
			},
			"epsilon": {
				"de": "Ein kleiner Wert, um Stabilität zu gewährleisten und durch Null teilen zu vermeiden.",
				"en": "A small value to ensure stability and avoid division by zero."
			}
		}
	},
	{
		"optimizer": "adadelta",
		"variables": ["learning_rate", "rho", "epsilon"],
		"info": {
			"de": "Adadelta ist eine verbesserte Version von Adagrad, die die Lernrate anpasst, ohne dass diese explizit festgelegt werden muss.",
			"en": "Adadelta is an improved version of Adagrad that adjusts the learning rate without requiring it to be explicitly set."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Beeinflusst, wie stark die Anpassungen sind, aber weniger als bei anderen Optimierern.",
				"en": "Influences the strength of adjustments, but less so than in other optimizers."
			},
			"rho": {
				"de": "Gewichtet, wie stark vergangene Gradienten berücksichtigt werden, ähnlich wie Momentum.",
				"en": "Weights how much past gradients are considered, similar to momentum."
			},
			"epsilon": {
				"de": "Sichert die Stabilität und verhindert durch Null zu teilen.",
				"en": "Ensures stability and prevents division by zero."
			}
		}
	},
	{
		"optimizer": "adamax",
		"variables": ["learning_rate", "beta1", "beta2", "epsilon", "decay"],
		"info": {
			"de": "Adamax ist eine Variante von Adam, die besser mit großen Datenmengen umgehen kann.",
			"en": "Adamax is a variant of Adam that can handle large data more effectively."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Die Anfangsgeschwindigkeit des Lernens, die dynamisch angepasst wird.",
				"en": "The initial speed of learning, which is dynamically adjusted."
			},
			"beta1": {
				"de": "Gewichtet den Einfluss früherer Gradienten, ähnlich wie bei Adam.",
				"en": "Weights the influence of past gradients, similar to Adam."
			},
			"beta2": {
				"de": "Gewichtet den Einfluss früherer Gradientenquadrate, um die Lernrate anzupassen.",
				"en": "Weights the influence of past squared gradients to adjust the learning rate."
			},
			"epsilon": {
				"de": "Ein kleiner Wert, um die Stabilität zu sichern und durch Null teilen zu vermeiden.",
				"en": "A small value to ensure stability and avoid division by zero."
			},
			"decay": {
				"de": "Reduziert die Lernrate über die Zeit, um das Lernen zu verlangsamen, wenn sich das Modell den optimalen Werten nähert.",
				"en": "Reduces the learning rate over time to slow learning as the model approaches optimal values."
			}
		}
	},
	{
		"optimizer": "rmsprop",
		"variables": ["learning_rate", "decay", "rho", "momentum", "epsilon"],
		"info": {
			"de": "RMSprop ist ein Optimierer, der die Lernrate für jede Variable separat anpasst und gut für nicht-stationäre Probleme geeignet ist.",
			"en": "RMSprop is an optimizer that adjusts the learning rate for each variable separately and is well-suited for non-stationary problems."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Die Geschwindigkeit des Lernens. RMSprop passt diesen Wert dynamisch an.",
				"en": "The speed of learning. RMSprop dynamically adjusts this value."
			},
			"decay": {
				"de": "Reduziert die Lernrate über die Zeit, um das Lernen langsamer zu machen, wenn sich das Modell den optimalen Werten nähert.",
				"en": "Reduces the learning rate over time to slow down learning as the model approaches optimal values."
			},
			"rho": {
				"de": "Gewichtet, wie stark vergangene Gradienten berücksichtigt werden, um die Lernrate zu steuern.",
				"en": "Weights how much past gradients are considered to control the learning rate."
			},
			"momentum": {
				"de": "Berücksichtigt vergangene Bewegungen, um das Lernen zu beschleunigen.",
				"en": "Considers past movements to accelerate learning."
			},
			"epsilon": {
				"de": "Ein kleiner Wert, der Stabilität gewährleistet und durch Null teilen verhindert.",
				"en": "A small value that ensures stability and prevents division by zero."
			}
		}
	},
	{
		"optimizer": "momentum",
		"variables": ["learning_rate", "momentum"],
		"info": {
			"de": "Momentum ist eine Erweiterung von SGD, die das Lernen beschleunigt, indem sie den Einfluss vergangener Updates berücksichtigt.",
			"en": "Momentum is an extension of SGD that speeds up learning by considering the influence of past updates."
		},
		"variable_info": {
			"learning_rate": {
				"de": "Die Geschwindigkeit des Lernens. Höhere Werte können schnelleres Lernen bedeuten, aber auch das Risiko von Fehlern erhöhen.",
				"en": "The speed of learning. Higher values can mean faster learning but also a higher risk of errors."
			},
			"momentum": {
				"de": "Berücksichtigt vergangene Bewegungen, um in die richtige Richtung zu beschleunigen.",
				"en": "Considers past movements to accelerate in the right direction."
			}
		}
	}
];

var cam_config = {};

var labelSidebarObserver = null;

var webcam_custom_data_started = false;

var last_fcnn_data_hash = "";

var debug_custom_tensor_x = "";
var debug_custom_tensor_y = "";

var time_per_batch_name = "time_per_batch_(in_seconds)";

var new_handdrawn_image_hash;

var model_meta = null;
var shown_activation_equations = [];
var activation_string = "";

var download_shown_flags = {
	tf_null: false,
	skip_set: false,
	unknown: false,
};

var shown_skipping_real_msg = false;

var enable_dispose_debug = false;

var start_test_time = false;

var last_disable_invalid_layers_event_uuid = null;
var special_disable_invalid_layers_event_uuid = null;

var num_wrns = 0;
var num_errs = 0;

var option_for_layer_counter = 0;
var enable_debug_layer = true;

var math_history = [];

var predict_handdrawn_counter = 0;

var got_images_from_webcam = false;

var csv_has_unparsable_values = false;

var TF_POOL_SIZE = Math.max(1, Math.floor((navigator.hardwareConcurrency || 4) / 2));
var DOM_BATCH_SIZE = 8;
var DOM_BATCH_TIMEOUT = 80;

var editable_labels_queued = false;

var last_show_or_hide_msg = "";

var last_model_structure_string = "";

var last_get_layer_right_offset_value = "";
var last_get_layer_right_offset_time = "";

var _updated_page_avg_time = 500;
var _updated_page_last_call = 0;
var _updated_page_running = false;
var _updated_page_pending = []
var _updated_page_seen = new Set()

var status_model_is_ok = false;

var _compile_model_avg_time = 500;
var _compile_model_last_call = 0;
var _compile_model_running = false;
var _compile_model_pending = null;

var last_init_time = {}

var _create_model_avg_time = 500;
var _create_model_last_call = 0;
var _create_model_running = false;
var _create_model_pending = null;

var predict_demo_scheduled = false;
var last_predict_demo_time = 0;

var __predict_demo_last_call = 0;
var __predict_demo_timer = null;
