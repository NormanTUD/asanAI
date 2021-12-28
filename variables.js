"use strict";

function lowercaseFirstLetter(string) {
	return string.charAt(0).toLowerCase() + string.slice(1);
}

var pixel_size = 1;
var model = null;
var h = null;
var number_channels = 3;
var height = 32;
var width = 32;
var labels = [];
var vector_counter = 1;
var word_to_id = {};
var max_number_words = 0;
var max_number_characters = 0;
var disable_show_python_and_create_model = false;

var max_images_per_layer = 0;

var x_file = null;
var y_file = null;
var y_shape = null;

function get_plot_activation_name (name) {
	if(name.toLowerCase() == "leakyrelu") {
		return "LeakyReLU";
	} else if(name.toLowerCase() == "relu") {
		return "ReLU";
	} else if(name.toLowerCase() == "thresholdedrelu") {
		return "ThresholdedReLU";
	}
	return name;
}

const surface = { name: "Model Summary", tab: "Model Inspection" };

var xy_data = null;

var js_names_to_python_names = {
	"kernel_size_1d": "kernel_size",
	"kernelSize": "kernel_size",
	"poolSize": "pool_size",
	"biasInitializer": "bias_initializer",
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
	"depthMultplier": "depth_multiplier",
	"depthwiseInitilalizer": "depthwise_initializer",
	"depthwiseConstraint": "depthwise_constraint",
	"pointwiseInitializer": "pointwise_initializer",
	"pointwiseConstraint": "pointwise_constraint",
	"betaInitializer": "beta_initializer",
	"gammaInitializer": "gamma_initializer"
};

var python_names_to_js_names = {};

for (var key of Object.keys(js_names_to_python_names)) {
	python_names_to_js_names[js_names_to_python_names[key]] = lowercaseFirstLetter(key);
}

var layer_options = {
	"dense": {
		"description": "Creates a dense (fully connected) layer.<br>This layer implements the operation: <tt>output = activation(dot(input, kernel) + bias)</tt> activation is the element-wise activation function passed as the activation argument.<br><tt>kernel</tt> is a weights matrix created by the layer.<br><tt>bias</tt> is a bias vector created by the layer (only applicable if useBias is true).",
		"options": [
			"trainable", "use_bias", "units", "activation", "kernel_initializer", "bias_initializer"
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
			"dropout_rate"
		],
		"category": "Basic"
	},

	"elu": {
		"description": "Exponetial Linear Unit (ELU).<br>It follows: <tt>f(x) = alpha * (exp(x) - 1.) for x < 0, f(x) = x for x >= 0</tt>.",
		"options": [
			"alpha", "trainable"
		],
		"category": "Activation"
	},

	"leakyReLU": {
		"description": "Leaky version of a rectified linear unit.<br>It allows a small gradient when the unit is not active: <tt>f(x) = alpha * x for x < 0. f(x) = x for x >= 0</tt>.",
		"options": [
			"alpha", "trainable"
		],
		"category": "Activation"
	},
	"reLU": {
		"description": "Rectified Linear Unit activation function.",
		"options": [
			"max_value"
		],
		"category": "Activation"
	},
	"softmax": {
		"description": "Softmax activation layer.",
		"options": [
			"axis"
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
			"beta_constraint", "gamma_constraint", "trainable"
		],
		"category": "Normalization"
	},
	"layerNormalization": {
		"description": "Layer-normalization layer (Ba et al., 2016). Normalizes the activations of the previous layer for each given example in a batch independently, instead of across a batch like in batchNormalization. In other words, this layer applies a transformation that maintanis the mean activation within each example close to0 and activation variance close to 1.",
		"options": [
			"axis", "epsilon", "center", "scale", "beta_initializer",
			"gamma_initializer", "trainable"
		],
		"category": "Normalization"
	},


	"conv1d": {
		"description": "1D convolution layer (e.g., temporal convolution).<br>This layer creates a convolution kernel that is convolved with the layer input over a single spatial (or temporal) dimension to produce a tensor of outputs.<br>If <tt>use_bias</tt> is True, a bias vector is created and added to the outputs.<br>If <tt>activation</tt> is not <tt>null</tt>, it is applied to the outputs as well.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size_1d", "strides_1d", "dilation_rate", "kernel_initializer", "bias_initializer"
		],
		"category": "Convolutional"
	},
	"conv2d": {
		"description": "2D convolution layer (e.g. spatial convolution over images).<br>This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.<br>If <tt>useBias</tt> is True, a bias vector is created and added to the outputs.<br>If <tt>activation</tt> is not null, it is applied to the outputs as well.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size", "strides", "dilation_rate", "kernel_initializer", "bias_initializer"
		],
		"category": "Convolutional"
	},
	"conv2dTranspose": {
		"description": "Transposed convolutional layer (sometimes called Deconvolution). The need for transposed convolutions generally arises from the desire to use a transformation going in the opposite direction of a normal convolution, i.e., from something that has the shape of the output of some convolution to something that has the shape of its input while maintaining a connectivity pattern that is compatible with said convolution.",
		"options": [
			"filters", "kernel_size", "strides", "padding", "dilation_rate", "activation", "use_bias", "kernel_initializer", "bias_initializer", "kernel_constraint", "bias_constraint", "trainable"
		],
		"category": "Convolutional"
	},
	"conv3d": {
		"description": "3D convolution layer (e.g. spatial convolution over volumes).<br>This layer creates a convolution kernel that is convolved with the layer input to produce a tensor of outputs.",
		"options": [
			"trainable", "use_bias", "activation", "padding", "filters", "kernel_size", "strides", "dilation_rate", "kernel_initializer", "bias_initializer"
		],
		"category": "Convolutional"
	},
	"depthwiseConv2d": {
		"description": "Depthwise separable 2D convolution. Depthwise Separable convolutions consists in performing just the first step in a depthwise spatial convolution (which acts on each input channel separately). The depthMultplier argument controls how many output channels are generated per input channel in the depthwise step.",
		"options": [
			"kernel_size", "depth_multiplier", "depthwise_initializer",
			"depthwise_constraint", "strides", "padding", "dilation_rate",
			"activation", "use_bias", "kernel_initializer",
			"bias_initializer", "kernel_constraint", "bias_constraint",
			"trainable"
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
			"trainable"
		],
		"category": "Convolutional"
	},
	"upSampling2d": {
		"description": "Upsampling layer for 2D inputs. Repeats the rows and columns of the data by size[0] and size[1] respectively.",
		"options": [
			"size", "interpolation", "trainable"
		],
		"category": "Convolutional"
	},

	"averagePooling1d": {
		"description": "Average pooling operation for spatial data.",
		"options": [
			"padding", "pool_size", "strides"
		],
		"category": "Pooling"
	},
	"averagePooling2d": {
		"description": "Average pooling operation for spatial data.",
		"options": [
			"padding", "pool_size", "strides"
		],
		"category": "Pooling"
	},

	"maxPooling1d": {
		"description": "Max pooling operation for temporal data.",
		"options": [
			"pool_size_1d", "strides_1d", "padding"
		],
		"category": "Pooling"
	},
	"maxPooling2d": {
		"description": "Global max pooling operation for spatial data.",
		"options": [
			"pool_size", "strides", "padding"
		],
		"category": "Pooling"
	},
	"globalAveragePooling1d": {
		"description": "Global average pooling operation for temporal data.",
		"options": [
			"trainable"
		],
		"category": "Pooling"
	},
	"globalAveragePooling2d": {
		"description": "Global average pooling operation for temporal data.",
		"options": [
			"trainable"
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
			"stateful", "unroll", "trainable"
			
		],
		"category": "Recurrent"
	},
	"lstm": {
		"description": "Long-Short Term Memory layer - Hochreiter 1997.",
		"options": [
			"recurrent_activation", "unit_forget_bias", "implementation", "units", "activation", "use_bias", "kernel_initializer",
			"recurrent_initializer", "bias_initializer", "kernel_constraint", "recurrent_constraint", "bias_constraint",
			"dropout", "recurrent_dropout", "return_sequences", "return_state", "go_backwards", "unroll", "trainable"
		],
		"category": "Recurrent"
	},
	"simpleRNN": {
		"description": "Fully-connected RNN where the output is to be fed back to input.",
		"options": [
			"trainable", "use_bias", "units", "activation", "kernel_initializer", "bias_initializer", "recurrent_initializer",
			"recurrent_constraint", "bias_constraint", "dropout", "recurrent_dropout", "return_sequences", "unroll", "kernel_constraint",
			"return_state"
		],
		"category": "Recurrent"
	},

	/*
	"convLstm2d": {
		"description": "Convolutional LSTM layer - Xingjian Shi 2015.",
		"options": [
			"activation", "use_bias", "kernel_initializer", "recurrent_initializer",
			"bias_initializer", "dropout", "trainable", "recurrent_activation",
			"unit_forget_bias", "implementation", "return_sequences", "return_state",
			"go_backwards", "stateful", "unroll", "filters", "kernel_size",
			"strides", "padding", "dilation_rate"
		],
		"category": "Recurrent"
	},
	*/


	"alphaDropout": {
		"description": "Applies Alpha Dropout to the input. As it is a regularization layer, it is only active at training time.",
		"options": [
			"rate", "trainable"
		],
		"category": "Noise"
	},
	"gaussianDropout": {
		"description": "Apply multiplicative 1-centered Gaussian noise. As it is a regularization layer, it is only active at training time.",
		"options": [
			"rate", "trainable"
		],
		"category": "Noise"
	},
	"gaussianNoise": {
		"description": "Apply additive zero-centered Gaussian noise. As it is a regularization layer, it is only active at training time.",
		"options": [
			"stddev", "trainable"
		],
		"category": "Noise"
	},

	"zeroPadding2d": {
		"description": "Zero-padding layer for 2D input (e.g., image).",
		"options": [
			"padding", "trainable"
		],
		"category": "Padding"
	}
};

var model_data_structure = {
	"sgd": ["learning_rate"],
	"rmsprop": ["learning_rate", "rho", "decay", "epsilon", "momentum"],
	"adam": ["learning_rate", "beta1", "beta2", "epsilon"],
	"adagrad": ["learning_rate"],
	"adadelta": ["learning_rate", "rho", "epsilon"]
};

var activations = {
	"sigmoid": "Sigmoid",
	"elu": "ELU",
	"linear": "Linear",
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
	//"constant": "constant",
	"glorotNormal": "glorotNormal",
	"heNormal": "heNormal",
	"heUniform": "heUniform",
	"leCunNormal": " leCunNormal",
	"leCunUniform": "leCunUniform",
	"ones": "ones",
	"randomNormal": "randomNormal",
	"randomUniform": " randomUniform",
	//"truncatedNormal": "truncatedNormal",
	"varianceScaling": "varianceScaling",
	"zeros": "zeros",
	//"string": "string"
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
var loaded_tfvis = 0;

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
