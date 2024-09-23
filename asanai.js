"use strict";
//
//HERE_TENSOR_DIVISION_ERROR

var log = console.log;

class asanAI {
	nr_images_per_category = {};

	#image_div_name = "";

	#max_activation_iterations = 5;

	#err_once_msgs = [];

	#scale_factor = 2;

	#_enable_fcnn_internals = false;

	#layer_states_saved = {}

	#hide_fcnn_text = false;

	#fcnn_width = 800;
	#fcnn_height = 800;

	#lang_cookie_name = "asanai_language_cookie";

	#maximally_activated_neuron_class = "maximally_activated_class";

	#currently_generating_images = false;

	#show_internals_slider_value = true;

	#create_model_queue = [];

	#model_is_trained = false;

	#model_config_hash = "";

	confusion_matrix_data = [];

	#loss = "categoricalCrossentropy";
	#metric = 'categoricalCrossentropy';
	#optimizer = 'adam';
	#batch_size = 10;
	#data_origin = "default";
	#epochs = 10;
	#seed_two = 42;

	#optimizer_table_div_name = "";

	#validation_split = 0;

	#model_data_structure = {
		"sgd": ["learningRate", "momentum"],
		"rmsprop": ["learningRate", "rho", "epsilon", "momentum"],
		"adam": ["learningRate", "beta1", "beta2", "epsilon"],
		"adagrad": ["learningRate", "initialAccumulatorValue", "epsilon"],
		"adadelta": ["learningRate", "rho", "epsilon"],
		"adamax": ["learningRate", "beta1", "beta2", "epsilon"]
	}
	
	#metric_shortnames = {
		"mse": "meanSquaredError",
		"mape": "meanAbsolutePercentageError",
		"mae": "meanAbsoluteError"
	}
	
	#global_model_data = undefined;

	#mode = "beginner";
	#allowed_layer_cache = [];

	#_custom_tensors = {};

	#is_repairing_output_shape = false;

	#shown_has_zero_data = false;
	#layer_structure_cache = null;
	#has_zero_output_shape = false;
	#special_reason_disable_training = false;

	#x_file = null;
	#y_file = null;
	#y_shape = null;

	#csv_allow_training = false;
	#has_missing_values = false;
	#atrament_data = {};

	#waiting_updated_page_uuids = [];
	#number_channels = 3;
	#image_url_tensor_div = null;
	#math_items_hashes = {};
	#learning_rate = 0.01;
	#epsilon = 0.0001;
	#decimal_points_math_mode = 3;
	#prev_layer_data = [];
	#current_epoch = 0;
	#original_title = document.title;
	#max_epoch = 30;
	#plotly_div = "";
	#this_training_start_time = null;
	#max_number_of_images_in_grid = 50;
	#is_classification = true;
	#lang = this.get_lang_cookie();
	#language = {}
	#started_training = false;
	#last_batch_time = null;
	#last_batch_plot_time = null;
	#math_tab_code_div = null;
	#layers_gui_div_name = null;

	#debug = false;

	#interpolation = {
		nearest: "nearest",
		bilinear: "bilinear"
	}

	#constraints = {
		"": "None",
		"maxNorm": "maxNorm",
		"minMaxNorm": "minMaxNorm",
		"nonNeg": "nonNeg",
		"unitNorm": "unitNorm"
	}

	#disable_show_python_and_create_model = false;

	#finished_loading = true;

	#valid_initializer_types = ["kernel", "bias", "gamma", "beta", "activity", "moving_variance", "moving_mean", "alpha", "beta"];

	#regularizer_select = {
		"none": "none",
		"l1": "l1",
		"l1l2": "l1l2",
		"l2": "l2"
	}

	#dtypes = {
		"float32": "float32",
		"int32": "int32",
		"bool": "bool",
		//"complex64": "complex64" //,
		//'string': 'string'
	}

	#initializer_options = {
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
	}

	#layer_options_defaults = {
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

		"kernel_size_x": "1",
		"kernel_size_y": "1",
		"kernel_size_z": "1",

		"target_shape": this.#calculate_default_target_shape
	}

	#activations = {
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
	}

	#initializers = {
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
	}

	#training_logs_epoch = {
		"loss": {
			"x": [],
			"y": [],
			"type": "scatter",
			"mode": this.#get_plotly_type(),
			"name": "Loss"
		}
	}

	#training_logs_batch = {
		"loss": {
			"x": [],
			"y": [],
			"type": "scatter",
			"mode": this.#get_plotly_type(),
			"name": "Loss"
		}
	}

	#time_per_batch = {
		"time": {
			"x": [],
			"y": [],
			"type": "scatter",
			"mode": this.#get_plotly_type(),
			"name": "Time per batch (in seconds)"
		}
	}

	#printed_msgs = [];
	#confusion_matrix_and_grid_cache = {};
	#_enable_debug = false;
	#write_tensors_info_div = "";
	#status_bar_background_color = "#262626";
	#status_bar_text_color = "#fff";
	#last_tensor_size_cpu = 0;
	#last_num_global_tensors = 0;
	#last_tensor_size_gpu = 0;
	#asanai_object_name = "asanai";
	#bar_background_color = "#909090";
	#fcnn_div_name = null;
	#kernel_pixel_size_max = 50;
	#pixel_size_max = 50;
	#show_sliders = false;
	#webcam_height = null;
	#webcam_width = null;
	#is_dark_mode = false;
	#show_bars_instead_of_numbers = true;
	#max_neurons_fcnn = 32;
	#draw_internal_states = false;
	#internal_states_div = "";
	#pixel_size = 3;
	#divide_by = 255;
	#labels = [];
	#bar_width = 100;
	#show_and_predict_webcam_in_div_div = null;
	#currently_switching_models = false;
	#num_channels = 3;
	#default_bar_color = "orange";
	#max_bar_color = "green";
	#kernel_pixel_size = 5;
	#model_summary_div = null;
	#started_webcam = false;
	#camera = null
	#last_video_element = null;
	#model_height = null;
	#model_width = null;
	#model = null;
	#images_to_repredict = [];
	#images_to_repredict_divs = [];
	#custom_tensors = {};

	#layer_names = [];

	#js_names_to_python_names = {
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

	#layer_options = {
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
	}

	#python_names_to_js_names = {};

	constructor (...args) {
		var last_tested_tf_version = "4.21.0";
		var last_tested_jquery_version = "3.7.1";
		var last_tested_plotly_version = "2.14.0";
		var last_tested_temml_version = "0.10.18";


		this.tf_version = this.#get_version(`tf.version["tfjs-core"]`, last_tested_tf_version, "tensorflow.js");
		this.jquery_version = this.#get_version(`jQuery().jquery`, last_tested_jquery_version, "jQuery");
		this.plotly_version = this.#get_version(`Plotly.version`, last_tested_plotly_version, "Plotly");
		this.temml_version = this.#get_version(`temml.version`, last_tested_temml_version, "temml");


		for (var key of Object.keys(this.#js_names_to_python_names)) {
			this.#python_names_to_js_names[this.#js_names_to_python_names[key]] = this.#lowercase_first_letter(key);
		}

		this.#layer_names = Object.keys(this.#layer_options);

		if(typeof(hashwasm) == "undefined") {
			throw new Error("Please load md5.umd.min.js");
		}

		if(args.length == 1) {
			args = args[0];

			if(!Object.keys(args).includes("asanai_object_name")) {
				throw new Error(`asanai_object_name must be set!`);
			}

			if(Object.keys(args).includes("asanai_object_name")) {
				if(typeof(args.asanai_object_name) != "string") {
					throw new Error(`asanai_object_name must be a string!`);
				}

				this.#set_asanai_object_name(args.asanai_object_name);

				delete args["asanai_object_name"];
			}

			if(Object.keys(args).includes("labels")) {
				this.set_labels(args.labels);

				delete args["labels"];
			}

			if(Object.keys(args).includes("translations_file")) {
				this.load_languages(args["translations_file"])

				delete args["translations_file"];
			} else {
				this.load_languages();
			}

			if(Object.keys(args).includes("model")) {
				this.set_model(args.model);

				delete args["model"];
			}

			if(Object.keys(args).includes("optimizer_table_div_name")) {
				this.#optimizer_table_div_name = args["optimizer_table_div_name"];

				if(typeof(args["optimizer_table_div_name"]) != "string") {
					throw new Error(`optimizer_table_div_name must be a string, is ${typeof(args["optimizer_table_div_name"])}!`);
				}

				if(!$("#" + this.#optimizer_table_div_name).length) {
					throw new Error(`#${this.#optimizer_table_div_name} could not be found!`);
				}

				delete args["optimizer_table_div_name"];
			}

			if(Object.keys(args).includes("model_data")) {
				if(!Object.keys(args).includes("optimizer_config")) {
					throw new Error("model_data must be used together with optimizer_config. Can only find model_data, but not optimizer_config");
				}
				this.#model = this.create_model_from_model_data(args["model_data"], args["optimizer_config"]);

				delete args["model_data"];
				delete args["optimizer_config"];
			}

			if(Object.keys(args).includes("divide_by")) {
				if(typeof(args.divide_by) == "number" || this.#looks_like_number(args.divide_by)) {
					this.#divide_by= this.#parse_float(args.divide_by);

					delete args["divide_by"];
				} else {
					throw new Error("divide_by is not a number");
				}
			}

			if(Object.keys(args).includes("max_neurons_fcnn")) {
				if(typeof(args.max_neurons_fcnn) == "number") {
					this.#max_neurons_fcnn = args.max_neurons_fcnn;

					delete args["max_neurons_fcnn"];
				} else {
					throw new Error("max_neurons_fcnn is not a number");
				}
			}

			if(Object.keys(args).includes("internal_states_div")) {
				if(typeof(args.internal_states_div) == "string") {
					this.#internal_states_div = args.internal_states_div;

					delete args["internal_states_div"];
				} else {
					throw new Error("internal_states_div is not a string");
				}
			}

			if(Object.keys(args).includes("draw_internal_states")) {
				if(typeof(args.draw_internal_states) == "boolean") {
					this.#draw_internal_states = args.draw_internal_states;

					delete args["draw_internal_states"];
				} else {
					throw new Error("draw_internal_states is not a boolean");
				}
			}

			if(Object.keys(args).includes("math_tab_code_div")) {
				if(typeof(args.math_tab_code_div) == "string") {
					if($("#" + args.math_tab_code_div).length) {
						this.#math_tab_code_div = args.math_tab_code_div;

						delete args["math_tab_code_div"];
					} else {
						throw new Error(`#${args.math_tab_code_div} could not be found`);
					}
				} else {
					throw new Error("math_tab_code_div is not a string");
				}
			}

			var ignored_keys = Object.keys(args);

			if(ignored_keys.length) {
				var keys_str = `[constructor] The following keys were invalid as parameters to asanAI: ${ignored_keys.join(", ")}. Cannot initialize with wrong parameters (it's for your own safety!)`;

				throw new Error(keys_str);
			}
		} else if (args.length > 1) {
			throw new error("All arguments must be passed to asanAI in a JSON-like structure as a single parameter");
		}

		this.#write_optimizer_table_to_page();
	}

	load_languages (filename = 'translations.json') {
		try {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', filename, false);
			xhr.send();

			if (xhr.status === 200) {
				this.#language = JSON.parse(xhr.responseText);
			} else {
				throw new Error(`Failed to load JSON file: ${filename}`);
			}
		} catch (error) {
			throw new Error(`Failed to load ${filename}. Make sure you downloaded the proper file from asanai.scads.ai or the source code of asanAI at https://github.com/NormanTUD/asanAI and include it in your directory. Without this file, asanAI.js will not work.`);
		}
	}

	set_image_url_tensor_div (name) {
		if($("#" + name).length == 1) {
			this.#image_url_tensor_div = name;
		}
	}

	get_image_url_tensor_div() {
		return this.#image_url_tensor_div;
	}

	set_image_div_name(name) {
		if($("#" + name).length == 1) {
			this.#image_div_name = name;
		} else {
			this.err(`Cannot find #${name}`);
		}
	}

	get_image_div_name() {
		return this.#image_div_name;
	}

	create_model_from_model_data (model_data, optimizer_config) {
		this.assert(Array.isArray(model_data), "[create_model_from_model_data] model data is not an array");

		var restart_camera = false;
		if(this.#camera) {
			restart_camera = true;
			this.stop_camera();
		}

		if(!optimizer_config) {
			this.err("[create_model_from_model_data] optimizer_config cannot be left empty. It is needed for compiling the this.#model.");
			return;
		}

		if(!typeof(optimizer_config) == "object") {
			this.err("[create_model_from_model_data] optimizer_config must be a associative array.");
			return;
		}

		if(model_data.length == 0) {
			this.err(`[create_model_from_model_data] model_data has no layers`);
			return;
		}

		if("optimizer" in optimizer_config) {
			this.#optimizer = optimizer_config["optimizer"];
		}

		if("learning_rate" in optimizer_config) {
			this.#learning_rate = optimizer_config["learning_rate"];
			optimizer_config["learningRate"] = optimizer_config["learning_rate"];
			delete optimizer_config["learning_rate"];
		}

		if("learning_rate" in optimizer_config) {
			this.#learning_rate = optimizer_config["learning_rate"];
			optimizer_config["learningRate"] = optimizer_config["learning_rate"];
			delete optimizer_config["learning_rate"];
		}

		var model_uuid = this.#uuidv4();
		var __model = this.tf_sequential(model_uuid);

		console.log("model = tf.sequential()");

		for (var layer_idx = 0; layer_idx < model_data.length; layer_idx++) {
			var layer = model_data[layer_idx];

			var keys = Object.keys(layer);
			this.assert(keys.length == 1, `layer ${layer_idx} has ${keys.length} values instead of 1`)

			var layer_name = keys[0];
			var layer_config = layer[layer_name];

			var code = `model.add(tf.layers.${layer_name}(${JSON.stringify(layer_config)}))`;

			//console.log(code)

			eval(`__${code}`);
		}

		if(!__model.layers.length) {
			this.err("[create_model_from_model_data] Could not add any layers.");
			return;
		}


		this.#layer_states_saved = {}

		__model.compile(optimizer_config);

		this.set_model(__model);

		if(restart_camera) {
			this.start_camera();
		}

		this.#write_optimizer_table_to_page();

		return __model;
	}

	summary () {
		if(!this.#model) {
			this.err("No model given. Cannot do summary.");
			return;
		}

		this.#model.summary();
	}

	#uuidv4() {
		var res = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);

		return res;
	}

	get_item_value_model(layer) {
		this.assert(typeof (layer) == "number", "Layer is not an integer, but " + typeof (layer));

		var classname = this.#model.layers[layer].getClassName();

		if(!classname) {
			this.err("cannot get class name for layer " + i) ;
			return;
		}

		if(classname == "Dense") {
			return this.#model.layers[layer].units;
		} else if(classname == "Conv2D") {
			return this.#model.layers[layer].filters;
		} else if(classname == "Flatten") {
			return 0;
		} else {
			this.err(`Layer type ${classname} not yet supported`);
		}
	}

	get_units_at_layer(i, use_max_layer_size) {
		var units = undefined;
		try {
			var units = this.get_item_value_model(i);
			if(units) {
				units = this.#parse_int(units);
			} else {
				units = 0;
			}
		} catch (e) {
			console.log(e);
		}

		var max_neurons_fcnn = this.#max_neurons_fcnn;

		if(units > max_neurons_fcnn && use_max_layer_size) {
			this.log("FCNN-Visualization: Units is " + units + ", which is bigger than " + max_neurons_fcnn + ". " + max_neurons_fcnn + " is the maximum, it will get set to this for layer " + i);
			units = max_neurons_fcnn;
		}

		return units;
	}

	#get_fcnn_data () {
		var names = [];
		var units = [];
		var meta_infos = [];

		if(!this.#model) {
			this.wrn("this.#model not found for restart_fcnn");
			return;
		}

		if(!Object.keys(this.#model).includes("layers")) {
			this.wrn("this.#model.layers not found for restart_fcnn");
			return;
		}

		if(this.#model.layers.length == 0) {
			this.err("this.#model.layers.length is 0");
			return;
		}

		for (var i = 0; i < this.#model.layers.length; i++) {
			var class_name = this.#model.layers[i].getClassName();
			if(!["Dense", "Flatten", "Conv2D"].includes(class_name)) {
				continue;
			}

			var _unit = this.get_units_at_layer(i);
			if(i == 0) {
				names.push(`Input Layer`);
			} else if (i == this.#model.layers.length - 1) {
				names.push(`Output Layer`);
			} else {
				names.push(`${class_name} ${i}`);
			}

			units.push(_unit);

			var output_shape_of_layer = "";
			try {
				output_shape_of_layer = this.#model.layers[i].outputShape;
			} catch (e) {

			}

			var kernel_size_x, kernel_size_y;

			try {
				kernel_size_x = this.#model.layers[i].kernelSize[0]
				kernel_size_y = this.#model.layers[i].kernelSize[1];
			} catch (e) {}

			var input_shape_of_layer = "";
			try {
				input_shape_of_layer = this.#model.layers[i].input.shape;
			} catch(e) {

			}

			meta_infos.push({
				layer_type: class_name,
				nr: i,
				input_shape: input_shape_of_layer,
				output_shape: output_shape_of_layer,
				kernel_size_x: kernel_size_x,
				kernel_size_y: kernel_size_y
			});
		}

		return [names, units, meta_infos];
	}

	restart_fcnn (divname=this.#fcnn_div_name, hide_text=this.#hide_fcnn_text) {
		this.#hide_fcnn_text = hide_text;
		var fcnn_data = this.#get_fcnn_data();

		if(!fcnn_data) {
			this.err("Could not get FCNN data");
			return;
		}

		var [names, units, meta_infos] = fcnn_data;

		this.#draw_fcnn(divname, units, names, meta_infos, hide_text);
	}

	#draw_fcnn(...args) {
		this.assert(args.length == 4 || args.length == 5, "#draw_fcnn must have 4 or 5 arguments");

		var divname = args[0];
		var layers = args[1];
		var labels = args[2];
		var meta_infos = args[3];
		var hide_text = args.length >= 3 ? args[4] : false;

		var $div = $("#" + divname);
		if(!$div.length) {
			this.err_once(`[#draw_fcnn] cannot use non-existant div. I cannot find #${divname}`);
			return;
		}

		var canvas = $("#__fcnn_canvas");

		if (!canvas.length) {
			var $canvas = $(`<canvas id='__fcnn_canvas'></canvas>`);
			canvas = $canvas[0];
			$("#" + divname).append(canvas);
		} else {
			canvas = canvas[0];
		}

		var ctx = canvas.getContext("2d");

		// Set canvas dimensions and background
		var canvasWidth = this.#fcnn_width;
		var canvasHeight = this.#fcnn_height;

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		var maxNeurons = Math.max(...layers);
		var maxRadius = Math.min(8, (canvasHeight / 2) / maxNeurons, (canvasWidth / 2) / (layers.length + 1));

		// Adjust spacing based on the number of neurons in each layer
		var layerSpacing = canvasWidth / (layers.length + 1);
		var maxSpacing = Math.min(maxRadius * 4, (canvasHeight / maxNeurons));
		var maxShapeSize = Math.min(8, (canvasHeight / 2) / maxNeurons, (canvasWidth / 2) / (layers.length + 1));

		this.#_draw_neurons_and_connections(ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius);

		if(!hide_text) {
			this.#_draw_layers_text(layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing);
		}
	}

	set_fcnn_width (new_width) {
		if(this.#parse_int(new_width) > 0) {
			this.#fcnn_width = new_width;
		} else {
			this.err(`[set_fcnn_width] this.#parse_int(new_width) is less not larger than 0. Will use the default (${this.#fcnn_width})`)
		}
	}

	set_fcnn_height (new_height) {
		if(this.#parse_int(new_height) > 0) {
			this.#fcnn_height = new_height;
		} else {
			this.err(`[set_fcnn_height] this.#parse_int(new_height) is less not larger than 0. Will use the default (${this.#fcnn_height})`)
		}
	}

	#_draw_layers_text (layers, meta_infos, ctx, canvasHeight, canvasWidth, layerSpacing, labels) {
		for (var i = 0; i < layers.length; i++) {
			if (labels && labels[i]) {
				ctx.beginPath();
				var font_size = Math.max(12, Math.min(6, (canvasWidth / (layers.length * 24))));
				ctx.font = font_size + "px Arial";
				if(this.#is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				ctx.fillText(labels[i], (i + 1) * layerSpacing, canvasHeight - (2*24) - 5);
				ctx.closePath();
			}

			if (meta_infos && meta_infos[i]) {
				ctx.beginPath();
				var meta_info = meta_infos[i];

				var _is = meta_info.input_shape;
				var _os = meta_info.output_shape;

				var font_size = Math.max(12, Math.min(6, (canvasWidth / (layers.length * 24))));
				ctx.font = font_size + "px Arial";
				if(this.#is_dark_mode) {
					ctx.fillStyle = "white";
				} else {
					ctx.fillStyle = "black";
				}
				ctx.textAlign = "center";
				ctx.fillText("Input:  [" + _is.filter(n => n).join(", ") + "]", (i + 1) * layerSpacing, canvasHeight - (24) - 5);
				ctx.fillText("Output: [" + _os.filter(n => n).join(", ") + "]", (i + 1) * layerSpacing, canvasHeight - 5);
				ctx.closePath();
			}
		}
	}

	transformArrayWHD_DWH(inputArray) {
		var width = inputArray.length;
		var height = inputArray[0].length;
		var depth = inputArray[0][0].length;

		// Initialisiere das neue Array
		var newArray = [];
		for (var i = 0; i < depth; i++) {
			newArray[i] = [];
			for (var j = 0; j < width; j++) {
				newArray[i][j] = [];
				for (var k = 0; k < height; k++) {
					newArray[i][j][k] = inputArray[j][k][i];
				}
			}
		}

		return newArray;
	}

	#_draw_neurons_or_conv2d(layerId, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info) {
		var this_layer_states = null;
		var this_layer_output = null;

		for (var j = 0; j < numNeurons; j++) {
			ctx.beginPath();
			var neuronY = (j - (numNeurons - 1) / 2) * verticalSpacing + layerY;
			ctx.beginPath();

			if (shapeType === "circle") {
				if(this.#layer_states_saved && this.#layer_states_saved[`${layerId}`]) {
					this_layer_states = this.#layer_states_saved[`${layerId}`]["output"][0];

					if (this.get_shape_from_array(this_layer_states).length == 1) {
						this_layer_output = this_layer_states;
					} else {
						this.log(`#_draw_neurons_or_conv2d: shape doesn't have length 1, but ${this.get_shape_from_array(this_layer_states)}`);
					}
				}

				if(this_layer_output && this.#_enable_fcnn_internals) {
					var minVal = Math.min(...this_layer_output);
					var maxVal = Math.max(...this_layer_output);

					var value = this_layer_output[j];
					var normalizedValue = Math.floor(((value - minVal) / (maxVal - minVal)) * 255);

					ctx.fillStyle = `rgb(${normalizedValue}, ${normalizedValue}, ${normalizedValue})`;

					// Adjust the radius based on available vertical space
					var availableSpace = verticalSpacing / 2 - 2; // Subtracting 2 for a small margin
					var radius = Math.min(maxShapeSize, availableSpace);
					ctx.arc(layerX, neuronY, radius, 0, 2 * Math.PI);
				} else {
					var availableSpace = verticalSpacing / 2 - 2;
					var radius = Math.min(maxShapeSize, availableSpace);
					ctx.arc(layerX, neuronY, radius, 0, 2 * Math.PI);
					ctx.fillStyle = "white";
				}
			} else if (shapeType === "rectangle_conv2d") {
				if (this.#layer_states_saved && this.#layer_states_saved[`${layerId}`]) {
					this_layer_states = this.#layer_states_saved[`${layerId}`]["output"];

					if (this.get_shape_from_array(this_layer_states).length == 4) {
						this_layer_output = this.transformArrayWHD_DWH(this_layer_states[0]);
						this_layer_output = this_layer_output[j];
					}
				}

				if (this_layer_output && this.#_enable_fcnn_internals) {
					var n = this_layer_output.length;
					var m = this_layer_output[0].length;
					var minVal = Infinity;
					var maxVal = -Infinity;

					for (var x = 0; x < n; x++) {
						for (var y = 0; y < m; y++) {
							var value = this_layer_output[x][y];
							if (value < minVal) minVal = value;
							if (value > maxVal) maxVal = value;
						}
					}

					var scale = 255 / (maxVal - minVal);
					var imageData = ctx.createImageData(m, n);
					for (var x = 0; x < n; x++) {
						for (var y = 0; y < m; y++) {
							var value = Math.floor((this_layer_output[x][y] - minVal) * scale);
							var index = (x * m + y) * 4;
							imageData.data[index] = value;
							imageData.data[index + 1] = value;
							imageData.data[index + 2] = value;
							imageData.data[index + 3] = 255;
						}
					}

					var _ww = Math.min(meta_info["kernel_size_x"] * 3, verticalSpacing - 2) * this.#scale_factor;
					var _hh = Math.min(meta_info["kernel_size_y"] * 3, verticalSpacing - 2) * this.#scale_factor;

					var _x = layerX - _ww / 2;
					var _y = neuronY - _hh / 2;
					ctx.putImageData(imageData, _x, _y, 0, 0, _ww, _hh);
				} else {
					var _ww = Math.min(meta_info["kernel_size_x"] * 3, verticalSpacing - 2);
					var _hh = Math.min(meta_info["kernel_size_y"] * 3, verticalSpacing - 2);

					var _x = layerX - _ww / 2;
					var _y = neuronY - _hh / 2;

					ctx.rect(_x, _y, _ww, _hh);
					ctx.fillStyle = "lightblue";
				}
			}

			if(this.#is_dark_mode) {
				ctx.strokeStyle = "white";
			} else {
				ctx.strokeStyle = "black";
			}
			ctx.lineWidth = 1;
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
	}


	#_draw_neurons_and_connections (ctx, layers, meta_infos, layerSpacing, canvasHeight, maxSpacing, maxShapeSize, maxRadius) {
		var _height = null;
		// Draw neurons
		for (var i = 0; i < layers.length; i++) {
			var meta_info = meta_infos[i];
			var layer_type = meta_info["layer_type"];
			var layerX = (i + 1) * layerSpacing;
			var layerY = canvasHeight / 2;
			var numNeurons = layers[i];
			var verticalSpacing = maxSpacing;
			var shapeType = "circle"; // Default shape is circle

			if (numNeurons * verticalSpacing > canvasHeight) {
				verticalSpacing = canvasHeight / numNeurons;
			}

			// Check if the layer type is "conv2d"
			if (layer_type.toLowerCase().includes("conv2d")) {
				shapeType = "rectangle_conv2d";
			} else if (layer_type.toLowerCase().includes("flatten")) {
				shapeType = "rectangle_flatten";
			}

			if(shapeType == "circle" || shapeType == "rectangle_conv2d") {
				this.#_draw_neurons_or_conv2d(i, numNeurons, ctx, verticalSpacing, layerY, shapeType, layerX, maxShapeSize, meta_info);
			} else if (shapeType == "rectangle_flatten") {
				_height = Math.min(650, meta_info["output_shape"][1]);
				this.#_draw_flatten(i, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height);
			} else {
				alert("Unknown shape Type: " + shapeType);
			}
		}
		this.#_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height);
	}

	#normalizeArray(array) {
		var min = Math.min(...array);
		var max = Math.max(...array);
		return array.map(value => ((value - min) / (max - min)) * 255);
	}

	disable_fcnn_internals() {
		this.#_enable_fcnn_internals = false;
	}

	enable_fcnn_internals() {
		this.#_enable_fcnn_internals = true;
	}

	#_draw_flatten (layerId, ctx, meta_info, maxShapeSize, canvasHeight, layerX, layerY, _height) {
		if(meta_info["output_shape"]) {
			var this_layer_states = null;

			if(this.#layer_states_saved && this.#layer_states_saved[`${layerId}`]) {
				this_layer_states = this.#layer_states_saved[`${layerId}`];
			}

			ctx.beginPath();
			var rectSize = maxShapeSize * 2;

			var layerY = canvasHeight / 2;

			var _width = rectSize;

			var _x = layerX - _width / 2;
			var _y = layerY - _height / 2;

			if(this_layer_states && this.get_shape_from_array(this_layer_states["output"]).length == 2) {
				// OK
			} else {
				if(this_layer_states) {
					this.log(`Invalid get_shape_from_array(this_layer_states['output']) for layer ${layerId}:`, this.get_shape_from_array(this_layer_states["output"]));
				}
				this_layer_states = null;
			}

			if(this_layer_states && this.#_enable_fcnn_internals) {
				var this_layer_output = this_layer_states["output"].flat();

				var normalizedValues = this.#normalizeArray(this_layer_output);

				// Zeichnen der horizontalen Linien basierend auf den normalisierten Werten
				var numValues = normalizedValues.length;
				var lineHeight = _height / numValues;  // Höhe einer einzelnen Linie

				for (var i = 0; i < numValues; i++) {
					var colorValue = Math.round(normalizedValues[i]);
					var _rgb = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
					ctx.fillStyle = _rgb; // RGB-Wert
					ctx.fillRect(_x, _y + i * lineHeight, _width, lineHeight);
				}

				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;
				ctx.fill();
				ctx.stroke();
			} else {
				ctx.rect(_x, _y, _width, _height);
				ctx.fillStyle = "lightgray";

				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;
				ctx.fill();
				ctx.stroke();
			}

			ctx.closePath();
		} else {
			alert("Has no output shape");
		}
	}

	#_draw_connections_between_layers(ctx, layers, layerSpacing, meta_infos, maxSpacing, canvasHeight, layerY, layerX, maxRadius, _height) {
		// Draw connections
		for (var i = 0; i < layers.length - 1; i++) {
			var meta_info = meta_infos[i];

			var layer_type = meta_info["layer_type"];
			var layer_input_shape = meta_info["input_shape"];
			var layer_output_shape = meta_info["output_shape"];

			var currentLayerX = (i + 1) * layerSpacing;
			var nextLayerX = (i + 2) * layerSpacing;
			var currentLayerNeurons = layers[i];
			var nextLayerNeurons = layers[i + 1];

			var next_layer_type = null;
			var next_layer_input_shape = null;
			var next_layer_input_shape = null;
			var next_layer_output_shape = null;

			var last_layer_type = null;
			var last_layer_input_shape = null;
			var last_layer_input_shape = null;
			var last_layer_output_shape = null;

			if((i + 1) in meta_infos) {
				var next_meta_info = meta_infos[i + 1];
				next_layer_type = next_meta_info["layer_type"];
				next_layer_input_shape = next_meta_info["input_shape"];
				next_layer_output_shape = next_meta_info["output_shape"];
			}

			if(i > 0) {
				var last_meta_info = meta_infos[i - 1];
				last_layer_type = last_meta_info["layer_type"];
				last_layer_input_shape = last_meta_info["input_shape"];
				last_layer_output_shape = last_meta_info["output_shape"];
			}

			var force_min_y = null;
			var force_max_y = null;

			if(layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				currentLayerNeurons = layer_input_shape[layer_input_shape.length - 1];
			}

			if(next_layer_type == "Flatten" || layer_type == "MaxPooling2D") {
				nextLayerNeurons = Math.min(64, next_layer_output_shape[next_layer_output_shape.length - 1]);
			}

			var currentSpacing = Math.min(maxSpacing, (canvasHeight / currentLayerNeurons) * 0.8);
			var nextSpacing = Math.min(maxSpacing, (canvasHeight / nextLayerNeurons) * 0.8);

			for (var j = 0; j < currentLayerNeurons; j++) {
				var currentNeuronY = (j - (currentLayerNeurons - 1) / 2) * currentSpacing + layerY;

				// Check if the current layer is a Flatten layer
				if (layer_type.toLowerCase().includes("flatten")) {
					// Adjust the y-positions of connections to fit with the "flatten square"
					var flattenSquareTopY = layerY - (_height / 2);
					var flattenSquareBottomY = layerY + (_height / 2);
					currentNeuronY = Math.min(flattenSquareBottomY, Math.max(flattenSquareTopY, currentNeuronY));
				}

				for (var k = 0; k < nextLayerNeurons; k++) {
					var nextNeuronY = (k - (nextLayerNeurons - 1) / 2) * nextSpacing + layerY;

					// Adjust the y-positions of connections to fit with the "flatten square"
					if (next_layer_type.toLowerCase().includes("flatten")) {
						var flattenSquareTopY = layerY - (_height / 2);
						var flattenSquareBottomY = layerY + (_height / 2);
						nextNeuronY = Math.min(flattenSquareBottomY, Math.max(flattenSquareTopY, nextNeuronY));
					}

					ctx.beginPath();
					ctx.moveTo(currentLayerX + maxRadius, currentNeuronY);
					ctx.lineTo(nextLayerX - maxRadius, nextNeuronY);
					ctx.strokeStyle = "gray";
					ctx.stroke();
				}
			}
		}
	}

	draw_fcnn (divname=this.#fcnn_div_name, max_neurons=32, hide_text=this.#hide_fcnn_text) { // TODO: max neurons
		this.#hide_fcnn_text = hide_text;
		if(!divname) {
			this.err("[draw_fcnn] Cannot continue draw_fcnn without a divname");
			return;
		}
		var $divname = $("#" + divname);
		this.assert(divname.length != 1, `div by id ${divname} could not be found`);
		
		this.#fcnn_div_name = divname;

		this.restart_fcnn(divname, hide_text);
	}

	is_model (_m) {
		if(!_m) {
			return false;
		}

		if(!Object.keys(_m).includes("_callHook")) {
			return false;
		}

		if(!Object.keys(_m).includes("metricsNames")) {
			this.err("The given model is a valid model, but it has not been compiled yet");
			return false;
		}

		return true;
	}

	#get_version (code, last_tested, name) {
		code = "try { " + code + "} catch (e) { }";
		try {
			var res = eval(code);

			if(("" + res).includes("undefined")) {
				throw new Error("is null");
			} else if(res != last_tested) {
				this.wrn(`Your ${name}-version is ${res}, but the last tested one was ${last_tested}. Keep that in mind. It may result in errors.`);
			}

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("is null") || ("" + e).includes("is not defined")) {
				throw new Error(`${name} is not installed or not included properly. Install ${name}, version ${last_tested}`)
			} else {
				throw new Error(e);
			}
		}
	}

	assert(condition, msg) {
		if(!condition) {
			throw new Error(msg);
		}
	}

	is_tf_tensor (arg) {
		if(typeof(arg) != "object") {
			return false;
		}

		if(!Object.keys(arg).includes("isDisposedInternal")) {
			return false;
		}

		if(!Object.keys(arg).includes("kept")) {
			return false;
		}

		return true;
	}

	#_register_tensors (...args) {
		for (var i = 0; i < args.length; i++) {
			if(this.is_tf_tensor(args[i])) {
				this.#custom_tensors["" + args[i].id] = [this.#get_stack_trace(), args[i], this.#tensor_print_to_string(args[i])];
			}
		}

		this.clean_custom_tensors();
	}

	array_sync (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.arraySync();

		return res;
	}

	tf_to_int (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toInt();

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_to_float (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toFloat();

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_to_tensor (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.toTensor(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_mean (...args) {
		this.#_register_tensors(...args);
		var res = tf.mean(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_relu (...args) {
		this.#_register_tensors(...args);
		var res = tf.relu(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_concat (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args.shift();
		var res = first_tensor.concat(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	#expand_dims (...args) {
		this.#_register_tensors(...args);
		var res = tf.expandDims(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_transpose (...args) {
		this.#_register_tensors(...args);
		var res = tf.transpose(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}


	tf_sub (...args) {
		this.#_register_tensors(...args);
		var res = tf.sub(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_min (...args) {
		this.#_register_tensors(...args);
		var res = tf.min(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_max (...args) {
		this.#_register_tensors(...args);
		var res = tf.max(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_add (...args) {
		this.#_register_tensors(...args);
		var first_tensor = args[0];
		var second_arg = args[1];
		if(!Object.keys(second_arg).includes("isDisposedInternal")) {
			this.err("Error: second argument to tf_add is wrong. See stacktrace.");
			return;
		}
		var res = first_tensor.add(second_arg, ...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

		this.clean_custom_tensors();

		return res;
	}

	tf_mul (...args) {
		this.#_register_tensors(...args);
		var res = tf.mul(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_div (...args) {
		this.#_register_tensors(...args);
		var res = tf.div(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_moments (...args) {
		this.#_register_tensors(...args);
		var res = tf.moments(...args);

		return res;
	}

	tf_reshape (...args) {
		this.#_register_tensors(...args);
		var res = tf.reshape(...args);

		this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];
		this.clean_custom_tensors();

		return res;
	}

	tf_unique (...args) {
		this.#_register_tensors(...args);
		var res = tf.unique(...args);

		this.#custom_tensors["" + res.values.id] = [this.#get_stack_trace(), res.values, this.#tensor_print_to_string(res.values)];
		this.#custom_tensors["" + res.indices.id] = [this.#get_stack_trace(), res.indices, this.#tensor_print_to_string(res.indices)];
		this.clean_custom_tensors();

		return res;
	}

	#tensor_print_to_string(_tensor) {
		if(!this.#_enable_debug) {
			return "Run asanai.enable_debug() to enable tensor printing.";
		}

		try {
			var logBackup = console.log;
			var logMessages = [];

			console.log = function () {
				logMessages.push.apply(logMessages, arguments);
			};

			_tensor.print(1);

			console.log = logBackup;

			return logMessages.join("\n");
		} catch (e) {
			if(("" + e).includes("Error: Tensor is disposed")) {
				this.wrn("tensor to be printed was already disposed");
			} else {
				this.err("tensor_print_to_string failed:", e);

			}
			return "<span class='error_msg'>Error getting tensor as string</span>";
		}
	}

	#removeTimestampAndLines(inputString) {
		try {
			// Remove the "t=\d" pattern
			const cleanedString = inputString.replace(/\?t=\d+/g, "");

			// Split the string into lines
			const lines = cleanedString.split("\n");

			// Remove the first two lines
			lines.splice(0, 2);

			// Join the remaining lines back into a single string
			const resultString = lines.join("\n");

			return resultString;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("" + e);

			return "";
		}
	}

	#get_stack_trace () {
		var s = "";
		try {
			var a = {};
			a.debug();
		} catch(ex) {
			s = "" + ex.stack;
		}

		s = this.#removeTimestampAndLines(s);

		return s;
	};


	async #next_frame(...args) {
		this.#_register_tensors(...args);
	}

	shuffleCombo (...args) {
		this.#_register_tensors(...args);
		try {
			return tf.util.shuffleCombo(...args);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("" + e);
			return args;
		}
	}

	async dispose (item) { // start_tensors
		try {
			//console.trace();
			//console.log(item);
			if(item) {
				var tensor_id = item.id;
				tf.dispose(item);

				if(this.#custom_tensors[tensor_id]) {
					delete this.#custom_tensors[tensor_id];
				}

				await this.#next_frame();
			} else {
				/*
				this.wrn("item was empty in this.dispose():"); // not a real async
				console.trace();
				*/
			}

			this.clean_custom_tensors();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tf_model (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.model(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tidy (...args) {
		try {
			var res = tf.tidy(...args);

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			throw new Error(e);
		}
	}

	tf_sequential(model_uuid) {
		this.assert(model_uuid, "model_uuid is not defined");
		this.assert(typeof(model_uuid) == "string", "model_uuid must be a string");

		var res = tf.sequential();

		res.originalAdd = res.add;

		var asanai_this = this;

		res.add = function (...args) {
			var r = res.originalAdd(...args);

			try {
				var k = res.layers[res.layers.length - 1].kernel;
				if(k) {
					asanai_this.#custom_tensors["" + k.id] = ["UUID:" + model_uuid, k, "[kernel in tf_sequential]"];
				}
			} catch (e) {
				asanai_this.wrn(e);
			}

			try {
				var b = res.layers[res.layers.length - 1].bias;

				if(b) {
					asanai_this.#custom_tensors["" + b.id] = ["UUID:" + model_uuid, b, "[bias in tf_sequential]"];
				}
			} catch (e) {
				asanai_this.wrn(e);
			}

			asanai_this.clean_custom_tensors();

			return r;
		};

		asanai_this.#custom_tensors["" + res.id] = ["UUID:" + model_uuid, res, "[model in tf_sequential]"];

		asanai_this.clean_custom_tensors();

		return res;
	}

	buffer(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.buffer(...args);

			//this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	from_pixels (...args) {
		this.#_register_tensors(...args);

		try {
			if(!["IMG", "CANVAS"].includes(args[0].nodeName)) {
				this.err(`args[0] is not a valid type, should be in IMG, CANVAS, but is ${args[0].nodeName}`);
				return null;
			}

			var res = tf.browser.fromPixels(...args);

			//this.log(`x = asanai.from_pixels(asanai.get_elements_by_xpath('${this.get_element_xpath(args[0])}')[0])`);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e, "args:", args[0]);

			return null;
		}
	}

	input(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.input(...args);

			this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, "[input]"];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	ones(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.ones(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	reshape(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.reshape(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	min(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.min(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	max(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.max(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	add(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.add(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	abs(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.abs(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	async tf_data_webcam (...args) {
		this.#_register_tensors(...args);
		try {
			var res = await tf.data.webcam(...args);

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#resizeImage (...args) {
		return this.#resizeBilinear(...args);
	}

	#resizeNearestNeighbor(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.resizeNearestNeighbor(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, "[#resizeNearestNeighbor]"];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#resizeBilinear(...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.resizeBilinear(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, "[resizeBilinear]"];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#rotateWithOffset (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.rotateWithOffset(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#flipLeftRight (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.image.flipLeftRight(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#clipByValue (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.clipByValue(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	#randomUniform (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.randomUniform(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tf_square (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.square(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tf_mean (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.mean(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	sqrt (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.sqrt(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tensor1d (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.tensor1d(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tensor2d (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.tensor2d(...args);

			this.#custom_tensors["" + res.dataId.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	tensor (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.tensor(...args);

			this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	grad (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.grad(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	divNoNan (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.divNoNan(...args);

			this.#custom_tensors["" + res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	one_hot (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.oneHot(...args);

			this.#custom_tensors[res.id] = [this.#get_stack_trace(), res, this.#tensor_print_to_string(res)];

			this.clean_custom_tensors();

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	clean_custom_tensors () {
		var keys = Object.keys(this.#custom_tensors);

		if(!keys.length) {
			return;
		}
		var disposed_keys = [];

		for (var i in keys) {
			var key = keys[i];

			try {
				if(!Object.keys(this.#custom_tensors).includes(key) || this.#custom_tensors[key][1].isDisposedInternal || this.#custom_tensors[key][1].isDisposed) {
					disposed_keys.push(key);
				}
			} catch (e) {
				if(("" + e).includes("this.#custom_tensors[key] is undefined")) {
					//
				} else {
					this.wrn(e);
				}
			}
		}

		for (var i in disposed_keys) {
			delete this.#custom_tensors[disposed_keys[i]];
		}
	}

	#parse_int (...args) {
		var res = parseInt(...args);

		if(isNaN(res)) {
			this.wrn("NaN detected in #parse_int, args: " + JSON.stringify(args));
			console.trace();
		}

		return res;
	}

	#parse_float (...args) {
		var res = parseFloat(...args);

		if(isNaN(res)) {
			this.wrn("NaN detected in #parse_float, args: " + JSON.stringify(args));
			console.trace();
		}

		return res;
	}

	async loadLayersModel (...args) {
		this.#_register_tensors(...args);
		try {
			var res = await tf.loadLayersModel(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	toPixels (...args) {
		this.#_register_tensors(...args);
		try {
			var res = tf.browser.toPixels(...args);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);

			return null;
		}
	}

	wrn (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}
		}

		msg = msgs.join("\n");

		$("#__status__bar__log").html("[WARN] " + msg);

		console.warn(...msgs);

		return msg;
	}

	log (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.log(msgs[i]);
		}

		msg = msgs.join("\n");

		$("#__status__bar__log").html(msg);
		$("#__loading_screen__text").html(msg);

		return msg;
	}

	dbg (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.debug(msgs[i]);
		}

		msg = msgs.join("\n");

		//$("#__status__bar__log").html("[DEBUG] " + msg);

		return msg;
	}

	err_once (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}
			if(!this.#err_once_msgs.includes(msgs[i]))  {
				console.error(msgs[i]);
				this.#err_once_msgs.push(msgs[i]);
			}
		}

		if(msgs.length) {
			msg = msgs.join("\n");

			$("#__status__bar__log").html("[ERROR] " + msg);
			$("#__loading_screen__text").html("[ERROR] " + msg);
		}

		return msg;
	}

	err (...msgs) {
		var msg = "";
		for (var i = 0; i < msgs.length; i++) {
			if(Object.keys(msgs[i]).includes("message")) {
				msgs[i] = msgs[i].message;
			}

			console.error(msgs[i]);
		}

		msg = msgs.join("\n");

		$("#__status__bar__log").html("[ERROR] " + msg);
		$("#__loading_screen__text").html("[ERROR] " + msg);

		return msg;
	}

	get_model () {
		return this.#model;
	}

	async #redo_what_has_to_be_redone (_restart_webcam) {
		if(this.#model.input.shape.length == 4) {
			this.#model_height = this.#model.input.shape[1];
			this.#model_width = this.#model.input.shape[2];
			this.#num_channels = this.#model.input.shape[3];
		}

		if(this.#fcnn_div_name) {
			this.restart_fcnn();
		}

		if(this.#model_summary_div) {
			this.write_model_summary();
		}

		if(_restart_webcam) {
			this.start_camera();
		}

		if(this.#images_to_repredict) {
			for (var i = 0; i < this.#images_to_repredict.length; i++) {
				var this_img_element_xpath = this.#images_to_repredict[i];
				var this_img_element = this.get_elements_by_xpath(this_img_element_xpath);
				if($(this_img_element).length) {
					var this_div_element = this.#images_to_repredict_divs[i];

					await this.predict_image(this_img_element, this_div_element, false, false);
				} else {
					this.err(`[set_model] Cannot find element by xpath for reprediction: ${this_img_element_xpath}`);
				}
			}
		} else {
			this.dbg(`[set_model] No images to repredict`);
		}
	}

	async set_model (_m) {
		if(!this.is_model(_m)) {
			throw new Error("[set_model] Given item is not a valid model");
			return;
		}

		if(this.#model) {
			//await this.dispose(this.#model);

			this.clean_custom_tensors();
		}

		this.#currently_switching_models = true;

		var _restart_webcam = 0;
		if(this.#started_webcam) {
			this.stop_camera();
			_restart_webcam = 1;
		}

		this.#model = _m;

		if(this.#model.output.shape.length == 2) {
			this.#is_classification = true;
		}

		await this.#redo_what_has_to_be_redone(_restart_webcam);

		this.#currently_switching_models = false;

		var asanai_this = this;

		await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);

		if(this.#layers_gui_div_name) {
			await this.show_layers_gui();
		}


		if(this.#internal_states_div) {
			this.show_internals()
		}

		this.log(this.#tr("model_was_set"));

		return this.#model;
	}

	get_elements_by_xpath (STR_XPATH) {
		this.assert(typeof(STR_XPATH) == "string", "[get_elements_by_xpath] Parameter is not string, but " + typeof(STR_XPATH));

		var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
		var xnodes = [];
		var xres;
		while (xres = xresult.iterateNext()) {
			xnodes.push(xres);
		}

		return xnodes;
	}

	stop_camera (item) {
		this.#started_webcam = false;
		if(this.#camera) {
			this.#camera.stop()
		}

		this.#camera = null;

		$(this.#last_video_element).hide();
		$("#" + this.#show_and_predict_webcam_in_div_div).hide();

		if(item) {
			$(item).text("Start webcam");
		}
	}

	start_camera (item) {
		this.#started_webcam = true;
		if(this.webcam_prediction_div_name) {
			try {
				this.show_and_predict_webcam_in_div(this.webcam_prediction_div_name, this.#webcam_height, this.#webcam_width);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				log(e)
				if(("" + e).includes("The fetching process for the")) {
					this.err("[start_camera] This error may happen when switching #models: " + e);
				} else {
					throw new Error("" + e);
				}
			}
		}

		$(this.#last_video_element).show();
		$("#" + this.#show_and_predict_webcam_in_div_div).show();

		if(item) {
			$(item).text("Stop webcam");
		}
	}

	get_webcam () {
		return this.#camera;
	}

	async toggle_webcam (item=null) {
		if(this.#camera) {
			this.stop_camera(item);
		} else {
			this.start_camera(item);
		}


	}

	#tensor_shape_fits_input_shape (tensor_shape, model_shape) {
		this.assert(Array.isArray(tensor_shape), "tensor_shape is not an array");
		this.assert(Array.isArray(model_shape), "model_shape is not an array");

		if(tensor_shape.length != model_shape.length) {
			this.wrn(`#tensor_shape_fits_input_shape failed. Different number of values: tensor_shape: [${tensor_shape.map(item => item === null ? "null" : item).join(", ")}], model_shape: [${model_shape.map(item => item === null ? "null" : item).join(", ")}]`);
			return false;
		}


		var mismatch = 0;

		for (var i = 0; i < tensor_shape.length; i++) {
			if (!(tensor_shape[i] == model_shape[i] || model_shape[i] === null || model_shape[i] === undefined)) {
				mismatch++;
			}
		}

		if(mismatch) {
			return false;
		} else {
			return true;
		}
	}

	get_element_xpath(element) {
		this.assert(typeof (element) == "object", "item is not an object but " + typeof (element));

		const idx = (sib, name) => sib
			? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
			: 1;
		const segs = elm => !elm || elm.nodeType !== 1
			? [""]
			: elm.id && document.getElementById(elm.id) === elm
				? [`id("${elm.id}")`]
				: [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
		return segs(element).join("/");
	}

	#show_images_to_be_predicted () {
		var elements = [];
		for (var i = 0; i < this.#images_to_repredict.length; i++) {
			var _xpath = this.#images_to_repredict[i];
			var _elements = this.get_element_by_xpath(_xpath);
			var this_div_element = this.#images_to_repredict_divs[i];
			elements.push(_elements, this_div_element)
		}

		for (var i = 0; i < elements.length; i++) {
			$(elements[i]).show();
		}
	}

	get_element_by_xpath (path) {
		return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	}

	#hide_images_to_be_predicted (msg="") {
		var elements = [];

		if(!msg) {
			msg = `ERROR: Cannot show image!`;
		}

		for (var i = 0; i < this.#images_to_repredict.length; i++) {
			var _xpath = this.#images_to_repredict[i];
			var _elements = this.get_element_by_xpath(_xpath);
			var this_div_element = this.#images_to_repredict_divs[i];
			elements.push(_elements, this_div_element)
		}

		for (var i = 0; i < elements.length; i++) {
			var message = $(`<span class='cannot_show_image_message'>${msg}</span>`);

			var next_element = $(elements[i]).next();
			var prev_element = $(elements[i]).prev();

			$(elements[i]).hide();

			if(!next_element.hasClass(`cannot_show_image_message`) && !prev_element.hasClass(`cannot_show_image_message`)) {
				message.insertAfter($(elements[i]));
			}
		}

		this.hide_internals();
	}

	async predict_image (img_element_or_div, write_to_div="", _add_to_repredict=true, _add_on_click_repredict=false) {
		this.assert(img_element_or_div, "img_element_or_div is empty");
		this.assert(typeof(_add_to_repredict) == "boolean", "_add_to_repredict is not a boolean");
		this.assert(typeof(_add_on_click_repredict) == "boolean", "_add_on_click_repredict is not a boolean");

		if(!this.#model) {
			this.err(`[predict_image] Cannot predict image without a loaded model`);
			return;
		}

		if(write_to_div) {
			if(typeof(write_to_div) == "string") {
				var $write_to_div = $("#" + write_to_div);
				if($write_to_div.length == 1) {
					write_to_div = $write_to_div[0];
				} else {
					this.wrn(`[predict_image] Could not find div to write to by id ${write_to_div}`);
					return;
				}
			} else if(!write_to_div instanceof HTMLElement) {
				this.err(`[predict_image] write_to_div is not a HTMLElement`);
				return;
			}
		}

		if(typeof(img_element_or_div) == "string") {
			var $img_element_or_div = $("#" + img_element_or_div);
			if($img_element_or_div.length == 1) {
				img_element_or_div = $img_element_or_div[0];
			} else {
				this.err(`[predict_image] Cannot find exactly one element titled ${img_element_or_div}`);
				return;
			}
		}

		this.assert(img_element_or_div, "img_element_or_div is empty");

		var valid_tags = ["CANVAS", "IMG"];
		var img_tag_name;

		if (img_element_or_div instanceof jQuery || Array.isArray(img_element_or_div)){
			img_element_or_div = img_element_or_div[0];
		}

		img_tag_name = img_element_or_div.tagName;

		this.assert(img_tag_name, "img_tag_name is empty!");

		if(!valid_tags.includes(img_tag_name)) {
			this.err(`[predict_image] Element found, but is not valid tag. Is: ${img_tag_name}, but should be in [${valid_tags.join(", ")}]`);
			return;
		}

		var model_input_shape = this.#model.input.shape;

		if(this.#model.input.shape.length != 4) {
			var msg = `Input shape does not have 4 elements, it is like this: [${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}]. Cannot predict it as an image.`;
			this.err(`[predict_image] ${msg}`);

			this.#hide_images_to_be_predicted(`${msg}`)

			return;
		} else {
			$(".cannot_show_image_message").hide();
		}

		this.#show_images_to_be_predicted()

		var _height = model_input_shape[1];
		var _width = model_input_shape[2];

		var asanai_this = this;
		var original_image = asanai_this.from_pixels(img_element_or_div, asanai_this.#num_channels)

		var data = this.tidy(() => {
			var image_tensor = asanai_this.#expand_dims(original_image);
			image_tensor = asanai_this.#resizeImage(image_tensor, [_height, _width]);
			return image_tensor;
		});

		var result = this.predict(data);

		if(result) {
			if(write_to_div) {
				this.#_show_output(result, write_to_div);
			}
		} else {
			this.wrn(`[predict_image] result was empty (type: ${typeof(result)})`);
		}

		if(_add_to_repredict) {
			var _xpath = this.get_element_xpath(img_element_or_div);
			if(!this.#images_to_repredict.includes(img_element_or_div)) {
				this.#images_to_repredict.push(_xpath);
				this.#images_to_repredict_divs.push(write_to_div);
			}
		}

		if(_add_on_click_repredict) {
			if($(img_element_or_div).attr("onclick")) {
				this.dbg(`[predict_image] Element already has onclick. Not adding a new one.`);
			} else {
				var write_to_div_id = $(write_to_div).attr("id");
				if(write_to_div_id) {
					if(!this.#asanai_object_name) {
						this.err(`[predict_image] To call this function, run "asanai_object.#set_asanai_object_name('asanai_object')". This is needed to define onclick functions that go back to this class, and I cannot determine the object's variable name by myself.`);
						return;
					} else {
						$(img_element_or_div).attr("onclick", `${this.#asanai_object_name}.predict_image(this, ${write_to_div_id})`);
					}
				} else {
					this.err(`[predict_image] Could not attach onclick handler to element: write_to_div element has no ID`);
				}
			}
		}

		this.dispose(data);
		this.dispose(result);
		this.dispose(original_image);

		return result;
	}

	debug_different_models() {
		var zeros = tf.zeros([1,40,40,3]);
		var ones = tf.ones([1,40,40,3]);
		var gm = asanai.get_model();

		log("asanai.predict zeros/ones");
		asanai.predict(zeros).print();
		asanai.predict(ones).print();

		log("gm.predict zeros/ones");
		gm.predict(zeros).print();
		gm.predict(ones).print();
	}

	predict (_tensor) {
		/*
		console.log("_tensor:")
		_tensor.print()
		console.trace();

		var min_input_array = _tensor.min().arraySync()
		var max_input_array = _tensor.max().arraySync()

		console.log(`predict: min/max ${min_input_array}/${max_input_array}`);
		*/

		if(!this.#model) {
			this.err("[predict] Cannot predict without a model");
			return;
		}

		if(!this.#model.input) {
			this.err("[predict] Cannot predict without a this.#model.input");
			return;
		}

		if(!this.#model.input.shape) {
			this.err("[predict] Cannot predict without a this.#model.input.shape");
			return;		
		}

		if(this.#num_channels != 3) {
			this.#num_channels = 3;
			this.wrn(`[predict] Setting num_channels to 3, because webcam data does not have transparency.`);
		}

		/*
		console.log(`layer ${this.#model.layers.length - 1} weights 0 print`);
		this.#model.layers[this.#model.layers.length - 1].weights[0].val.print();
		*/

		if(!this.#tensor_shape_fits_input_shape(_tensor.shape, this.#model.input.shape)) {
			this.err(`[predict] Tensor does not fit model shape. Not predicting. Tensor shape: [${_tensor.shape.map(item => item === null ? "null" : item).join(", ")}], model_shape: [${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}].`)
			return;
		}

		/*
		if(this.#looks_like_number("" + this.#divide_by)) {
			if (typeof(this.#divide_by) == "number" && this.#divide_by != 0 && this.#divide_by != 1) {
				var asanai_this = this;

				_tensor = this.tidy(() => {
					//HERE_TENSOR_DIVISION_ERROR

					console.log("OLD TENSOR:")

					_tensor.print();

					return _tensor;

					//var _new_tensor = asanai_this.tf_div(_tensor, tf.scalar(asanai_this.#divide_by));

					//console.trace();
					//console.log("NEW TENSOR:")
					//_new_tensor.print()

					//return _new_tensor;
				})
			} else {
				console.error(`this.#divide_by = {asanai_this.#divide_by} is not a number, or 0 or 1`)
			}
		} else {
			console.error(`${this.#divide_by} is not a number!`)
		}
		*/

		var output;
		try {
			var asanai_this = this;

			output = asanai_this.tidy(() => {
				return asanai_this.tf_to_float(_tensor);
			});
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("" + e);
			return;
		}

		var added_layer = 0

		var input = output;

		for (var i = 0; i < this.#model.layers.length; i++) {
			var original_input = output;

			try {
				output = this.#model.layers[i].apply(output)

				/*
				var min_output_array = output.min().arraySync()
				var max_output_array = output.max().arraySync()

				console.log(`layer ${i} min: ${min_output_array}, max: ${max_output_array}`);
				*/
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				this.err("Predict-Error: " + e);
				return;
			}

			if(this.#draw_internal_states) {
				if(i == 0 && this.#show_sliders) {
					var $internal_states_div = $("#" + this.#internal_states_div);

					if($("#show_internals_slider").length == 0) {
						var _html = this.#get_internals_slider_html_code(
							this.#pixel_size,
							this.#pixel_size_max,
							this.#kernel_pixel_size,
							this.#kernel_pixel_size_max
						);

						//$internal_states_div.parent().prepend($(_html));
						$(_html).insertBefore($internal_states_div);
					}
				}


				try {
					var asanai_this = this;
					this.tidy(() => {
						asanai_this.#_draw_internal_states(i, original_input, output);
					});
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					this.err("" + e);
				}
			}

			var layer_name = this.get_model().getLayer(i).name;

			if(this.#_enable_fcnn_internals && layer_name) {
				if(layer_name.startsWith("conv2d") || layer_name.startsWith("flatten") || layer_name.startsWith("dense")) {
					var this_layer_data = {
						input: this.array_sync(original_input),
						output: this.array_sync(output)
					}

					this.#layer_states_saved[`${added_layer}`] = this_layer_data;
					added_layer++;
				}
			}

			this.restart_fcnn();

			this.dispose(input);
			this.dispose(original_input);
		}

		this.dispose(_tensor);

		return output;
	}

	get_layer_states_saved() {
		return this.#layer_states_saved;
	}

	async show_and_predict_webcam_in_div(divname=this.#show_and_predict_webcam_in_div_div, _w, _h) {
		var $divname = $("#" + divname);

		this.assert(divname.length != 1, `[show_and_predict_webcam_in_div] div by id ${divname} could not be found`);	

		if(!this.#model) {
			this.#started_webcam = false;
			this.err("[show_and_predict_webcam_in_div] Cannot predict without a loaded model");
			return;
		}

		if(!this.#model.input.shape.length == 4) {
			this.#started_webcam = false;
			this.err(`[show_and_predict_webcam_in_div] Model input shape but be image like [b, h, w, c], but is: ${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}`);
			return;
		}

		this.#show_and_predict_webcam_in_div_div = divname;

		this.webcam_prediction_div_name = divname;

		if(!_w) {
			_w = 300;
			this.#webcam_width = _w;
		}

		if(!_h) {
			_h = 300;
			this.#webcam_height = _h;
		}

		var $video_element = $divname.find("#" + divname + "_webcam_element");
		var $desc = $divname.find(".desc");

		var $stop_start_webcam_button = $(".stop_start_webcam_button");
		if(!$stop_start_webcam_button.length) {
			$stop_start_webcam_button = $(`<button class='stop_start_webcam_button' onclick="${this.#asanai_object_name}.toggle_webcam(this)">Stop webcam</button>`);
			$stop_start_webcam_button.insertBefore($divname);
		}

		if($video_element.length > 1) {
			this.wrn(`More than one video element found #${divname}. Using the first one`);
			$video_element = $video_element[0];
		} else if ($video_element.length) {
			$video_element = $video_element[0];
		} else {
			$video_element = $(`<video id="${divname}_webcam_element" width=${_w} height=${_h}></video>`)

			$divname.append($video_element);

			$video_element = $video_element[0];
		}

		this.#last_video_element = $video_element;

		if($desc.length > 1) {
			this.wrn(`More than one description element found #${divname}. Using the first one`);
			$desc = $desc[0];
		} else if ($desc.length) {
			$desc = $desc[0];
		} else {
			$desc = $(`<span class='desc'></span>`)

			$divname.append($desc);

			$desc = $desc[0];
		}

		this.#started_webcam = true;
		try {
			this.#camera = await tf.data.webcam($video_element);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("The fetching process for the")) {
				this.err("[show_and_predict_webcam_in_div] " + e)
				return;
			} else {
				throw new Error(e);
			}
		}

		while (this.#started_webcam) {
			if(this.#internal_states_div) {
				$("#" + this.#internal_states_div).html("");			
			}

			var image;
			try {
				if(this.#camera) {
					image = await this.#camera.capture();
				} else {
					throw new Error("camera is null");
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				this.stop_camera();

				if(("" + e).includes("is null") || ("" + e).includes("thrown converting video to pixels")) {
					this.err(`[show_and_predict_webcam_in_div] camera is null. Stopping webcam.`);
					return;
				} else {
					this.start_camera();
				}
			}

			var asanai_this = this;

			if(!this.#model) {
				this.err(`[show_and_predict_webcam_in_div] model not defined`);
				return;
			}

			if(!image) {
				this.err(`[show_and_predict_webcam_in_div] image is empty. Cannot continue.`);
				return;
			}

			var worked = this.tidy(() => {
				try {
					var _data = asanai_this.#resizeImage(image, [asanai_this.#model_height, asanai_this.#model_width]);
					var resized = asanai_this.#expand_dims(_data);
					resized = asanai_this.tf_div(resized, asanai_this.#divide_by);

					var res;

					try {
						res = asanai_this.predict(resized)
					} catch (e) {
						if(Object.keys(e).includes("message")) {
							e = e.message;
						}

						asanai_this.err("" + e);
						asanai_this.err(`Input shape of the model: [${asanai_this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}]. Input shape of the data: [${resized.shape.map(item => item === null ? "null" : item).join(", ")}]`);

						return false;
					}

					if(!res) {
						console.log(`res was empty:`, res);
						return false;
					}

					var prediction = asanai_this.array_sync(res);

					asanai_this.#_show_output(res, $desc);

					return true;
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					if(("" + e).includes("model is not defined")) {
						return false;
					} else if(("" + e).includes("first_tensor is undefined")) {
						return false;
					} else {
						throw new Error(e);
					}

					return false;
				}
			});

			if(!worked) {
				this.err(`[show_and_predict_webcam_in_div] Resizing image data failed. Stopping camera.`);
				this.stop_camera();
			}

			await this.dispose(image);

			await this.delay(50);
		}

		this.dbg("[show_and_predict_webcam_in_div] this.#started_webcam is false, while loop has ended.")
	}

	delay(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	#visualize_numbers_on_canvas (numberArray, blockWidth = 1, blockHeight = 25) {
		var canvas = document.createElement("canvas");
		canvas.id = "neurons_canvas_" + this.#uuidv4();
		canvas.classList.add("neurons_canvas_class");

		// Calculate the canvas width based on the number of elements
		var canvasWidth = numberArray.length * blockWidth;
		var canvasHeight = blockHeight;

		// Set the canvas dimensions
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		var ctx = canvas.getContext("2d");
		var blocksPerRow = Math.floor(canvas.width / blockWidth);

		this.#scaleNestedArray(numberArray);

		for (var i = 0; i < numberArray.length; i++) {
			var value = numberArray[i];
			var color = "rgb(" + value + "," + value + "," + value + ")";

			var x = (i % blocksPerRow) * blockWidth;
			var y = Math.floor(i / blocksPerRow) * blockHeight;

			ctx.fillStyle = color;
			ctx.fillRect(x, y, blockWidth, blockHeight);
		}

		return canvas;
	}

	#get_methods (obj) {
		return Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === "function")
	}

	hide_internals () {
		this.#draw_internal_states = false;
		$("#" + this.#internal_states_div).html("");
		$("#show_internals_slider").remove();
	}

	#get_internals_slider_html_code (pixel_val, pixel_max, kernel_val, kernel_max) {
		if(!this.#asanai_object_name) {
			this.err(`[#get_internals_slider_html_code] To call this function, run "asanai_object.#set_asanai_object_name('asanai_object')". This is needed to define onclick functions that go back to this class, and I cannot determine the object's variable name by myself.`);
			return;
		}

		var html = `<div id='show_internals_slider' style='user-select: none'>`
		html += `Pixel-Size: <input type="range" min="1" max="${pixel_max}" value="${pixel_val}" onchange="${this.#asanai_object_name}.set_pixel_size($(this).val())">`;
		html += `Kernel-Pixel-Size: <input type="range" min="1" max="${kernel_max}" value="${kernel_val}" onchange="${this.#asanai_object_name}.set_kernel_pixel_size($(this).val())">`;
		html += `</div>`;

		return html;
	}

	show_internals (divname=this.#internal_states_div, show_sliders=this.#show_internals_slider_value) {
		if(!this.#model) {
			this.dbg("No model found");

			return;
		}

		if(!typeof(show_sliders) == "boolean") {
			this.err("[show_internals] second parameter, show_sliders, must either be true or false)");
			return;
		}

		this.#show_internals_slider_value = show_sliders;

		this.#show_sliders = show_sliders;

		if(!divname) {
			this.err("[show_internals] Cannot call show_internals without a divname (at least once)");
			return;
		}

		var $div = $("#" + divname)

		if(!$div.length) {
			this.err(`[show_internals] #${divname} could not be found`);
			return;
		}

		if(!this.#model.layers) {
			this.dbg("No layer found");
		}

		this.#draw_internal_states = true;
		this.#internal_states_div = divname;
	}

	#normalize_to_image_data (input_data) {
		var asanai_this = this;

		var res = this.tidy(() => {
			var flattened_input = input_data;

			var tmp;

			if(asanai_this.is_tf_tensor(flattened_input)) {
				tmp = asanai_this.array_sync(flattened_input);
				flattened_input = tmp;
			}

			while (asanai_this.get_shape_from_array(flattened_input).length > 1) {
				flattened_input = flattened_input.flat();
			}

			var max = Math.max(...flattened_input);
			var min = Math.min(...flattened_input);

			//asanai_this.log("max: " + max + ", min: " + min);

			var range = tf.sub(max, min);

			if(!asanai_this.is_tf_tensor(input_data)) {
				input_data = asanai_this.tensor(input_data);
			}

			//
			var divisor = max - min;

			var multiplicator = tf.sub(input_data, min);

			if(divisor == 0) {
				return asanai_this.array_sync(input_data);
			}

			var twofiftyfive = tf.ones(input_data.shape);
			twofiftyfive = tf.mul(twofiftyfive, 1);

			var divisor_tensor = tf.ones(input_data.shape);
			divisor_tensor = tf.mul(divisor_tensor, divisor);

			var scaled_tensor = tf.div(tf.mul(input_data, twofiftyfive), divisor_tensor);


			var _r = asanai_this.array_sync(scaled_tensor);

			asanai_this.dispose(tmp);

			return _r;
		});

		return res;
	}

	#_draw_internal_states (layer, inputs, applied) {
		var number_of_items_in_this_batch = inputs.shape[0];
		//log("number_of_items_in_this_batch: " + number_of_items_in_this_batch);

		var layer_name;
		try {
			layer_name = this.#model.layers[layer].getClassName();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[#_draw_internal_states] Cannot get layer-name: " + e);

			return;
		}

		for (var batchnr = 0; batchnr < number_of_items_in_this_batch; batchnr++) {
			var input_data = this.#normalize_to_image_data(inputs);
			var output_data = this.#normalize_to_image_data(applied);

			var __parent = $("#" + this.#internal_states_div);

			var layer_div = __parent.find($($(".layer_data")[layer]));
			if(layer_div.length == 0) {
				layer_div = $("<div class='layer_data'></div>");
				__parent.append(layer_div);
			}

			layer_div.html("<h3 class=\"data_flow_visualization layer_header\">Layer " + layer + " &mdash; " + layer_name + " " + this.#get_layer_identification(layer) + "</h3>").hide();

			layer_div.show();

			var style_none = " style='display: none' ";
			var start = "<div class='data_flow_visualization ";

			layer_div.append(`${start} input_layer_header' ${style_none} id='layer_${layer}_input'><h4>Input:</h4></div>`);
			layer_div.append(`${start} weight_matrix_header' ${style_none} id='layer_${layer}_kernel'><h4>Weight Matrix:</h4></div>`);
			layer_div.append(`${start} output_header' ${style_none} id='layer_${layer}_output'><h4>Output:</h4></div>`);
			layer_div.append(`${start} equations_header' ${style_none} id='layer_${layer}_equations'></div>`);

			var input = $("#layer_" + layer + "_input");
			var kernel = $("#layer_" + layer + "_kernel");
			var output = $("#layer_" + layer + "_output");
			var equations = $("#layer_" + layer + "_equations");

			var kernel_data = [];

			if(this.#model.layers[layer] && Object.keys(this.#model.layers[layer]).includes("kernel")) {
				if(this.#model.layers[layer].kernel.val.shape.length == 4) {
					var ks_x = 0;
					var ks_y = 1;
					var number_filters = 2;
					var filters = 3;

					kernel_data = this.tidy(() => {
						var res = this.tidy(() => {

							var transposed = this.tf_transpose(
								this.#model.layers[layer].kernel.val,
								[filters, ks_x, ks_y, number_filters]
							)

							var _res = this.array_sync(transposed);

							this.dispose(transposed);

							return _res;
						});

						return res;
					});
				}

				kernel_data = tf.tidy(() => { return this.#normalize_to_image_data(kernel_data); });
			}

			var canvasses_input = this.#draw_image_if_possible(layer, "input", input_data);
			var canvasses_kernel = this.#draw_image_if_possible(layer, "kernel", kernel_data);
			var canvasses_output = this.#draw_image_if_possible(layer, "output", output_data);

			function uniqueArray1( ar ) {
				var j = {};

				ar.forEach( function(v) {
					j[v+ '::' + typeof v] = v;
				});

				return Object.keys(j).map(function(v){
					return j[v];
				});
			}


			var unique_values_input = Math.max(...uniqueArray1(input_data.flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat()))
			var unique_values_output = Math.max(...uniqueArray1(input_data.flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat().flat()))

			//HERE_TENSOR_DIVISION_ERROR
			/*
			console.debug(`input_data for layer ${layer}`, input_data)
			console.debug(`output_data for layer ${layer}`, output_data)
			console.log(
				`max input unique for layer ${layer}:`, unique_values_input,
				`max output unique for layer ${layer}:`, unique_values_output
			);
			*/
			//console.trace()

			if(layer == 0) {
				for (var input_canvas_idx = 0; input_canvas_idx < canvasses_input.length; input_canvas_idx++) {
					input.append(canvasses_input[input_canvas_idx]).show();

					var id_name = `layer_${layer}_neuron_${input_canvas_idx}`;
					if($("#" + id_name).length) {
						$("#" + id_name).html("").append(canvasses_input[input_canvas_idx]); // You have to show it yourself.
					} else {
						this.#log_once(`${id_name} could not be found`)
					}
				}
			}

			if(this.get_shape_from_array(output_data[0]).length == 1) {
				var h = this.#visualize_numbers_on_canvas(output_data[0])
				equations.append(h).show();

				for (var neuron_idx = 0; neuron_idx < this.get_model().layers[layer].units; neuron_idx++) {
					var id_name = `layer_${layer}_neuron_${neuron_idx}`;
					if($("#" + id_name).length) {
						$("#" + id_name).html("").append(h); // You have to show it yourself.
					} else {
						this.#log_once(`${id_name} could not be found`)
					}
				}
			} else {
				for (var canvasses_output_idx = 0; canvasses_output_idx < canvasses_output.length; canvasses_output_idx++) {
					var img_output = canvasses_output[canvasses_output_idx];
					output.append(img_output).show();

					var id_name = `layer_${layer}_neuron_${canvasses_output_idx}`;
					if($("#" + id_name).length) {
						$("#" + id_name).html("").append(img_output); // You have to show it yourself.
					} else {
						this.#log_once(`${id_name} could not be found`)
					}
				}

				for (var kernel_canvas_idx = 0; kernel_canvas_idx < canvasses_kernel.length; kernel_canvas_idx++) {
					if(kernel_canvas_idx in canvasses_kernel) {
						var this_kernel = canvasses_kernel[kernel_canvas_idx];
						if(this_kernel) {
							kernel.append(this_kernel).show();

							var id_name = `layer_${layer}_kernel_${kernel_canvas_idx}`;
							if($("#" + id_name).length) {
								$("#" + id_name).html("").append(this_kernel); // You have to show it yourself.
							} else {
								this.#log_once(`${id_name} could not be found`)
							}
						} else {
							this.log(canvasses_kernel);
							this.err(`Kernel ${kernel_canvas_idx} for layer ${layer} is false or undefined`)
						}
					} else {
						this.log(canvasses_kernel);
						this.err(`${kernel_canvas_idx} not in canvasses_kernel for layer ${layer}`);
					}
				}
			}


			this.dispose(kernel_data)

			/*
			 else {
				var h = this.#array_to_html(output_data[0]);
				equations.append(h).show();
			}
			*/
		}
	}

	#draw_grid (canvas, pixel_size, colors, black_and_white, onclick, data_hash, _class="") {
		this.assert(typeof(this.#pixel_size) == "number", "pixel_size must be of type number, is " + typeof(this.#pixel_size));
		this.assert(this.#get_dim(colors).length == 3, "color input shape is not of length of 3, but: [" + this.#get_dim(colors).join(", ") +"]");

		this.#scaleNestedArray(colors);

		var drew_something = false;

		var _height = colors.length;
		var _width = colors[0].length;

		$(canvas).attr("width", _width * this.#pixel_size);
		$(canvas).attr("height", _height * this.#pixel_size);
		if(_class) {
			$(canvas).attr("class", _class);
		}

		if(typeof(data_hash) == "object") {
			for (name in data_hash) {
				$(canvas).data(name, data_hash[name]);
			}
		}

		if(onclick) {
			$(canvas).attr("onclick", onclick);
		}

		var ctx = $(canvas)[0].getContext("2d");
		ctx.beginPath();

		var min = 0;
		var max = 0;

		for (var x = 0, i = 0; i < _width; x += this.#pixel_size, i++) {
			for (var y = 0, j = 0; j < _height; y += this.#pixel_size, j++) {
				var red, green, blue;

				if(black_and_white) {
					//red = green = blue = this.#parse_int(colors[j][i]); // TODO
					red = green = blue = parseInt(colors[j][i]);
				} else {
					red = this.#parse_int(colors[j][i][0]);
					green = this.#parse_int(colors[j][i][1]);
					blue = this.#parse_int(colors[j][i][2]);
				}

				var color = `rgb(${red}, ${green}, ${blue})`;

				var pixel = {
					x: x,
					y: y,
					w: this.#pixel_size,
					h: this.#pixel_size,
					fill: color,
					stroke: color
				};

				this.#draw_rect(ctx, pixel);
			}
		}

		ctx.fill();
		ctx.closePath();

		return canvas;
	}

	get_shape_from_array(a) {
		var dim = [];
		for (;;) {
			dim.push(a.length);
			if (Array.isArray(a[0])) {
				a = a[0];
			} else {
				break;
			}
		}
		return dim;
	}

	#get_layer_identification (i) {
		if(this.#model === null || this.#model === undefined) {
			return;
		}

		if(this.#model.layers[i] && Object.keys(this.#model.layers[i]).length >= 1) {
			var object_keys = Object.keys(this.#model.layers[i]);
			var new_str = "";

			if(object_keys.includes("filters") && object_keys.includes("kernelSize")) {
				new_str = this.#model.layers[i]["filters"] + "@" + this.#model.layers[i].kernelSize.join("x");

			} else if(object_keys.includes("filters")) {
				new_str = "Filters:&nbsp;" + this.#model.layers[i]["filters"];

			} else if(object_keys.includes("units")) {
				new_str = "Units:&nbsp;" + this.#model.layers[i]["units"];

			} else if(object_keys.includes("rate")) {
				new_str = "Rate:&nbsp;" + this.#model.layers[i]["rate"];

			} else if(object_keys.includes("poolSize")) {
				new_str = this.#model.layers[i].poolSize.join("x");
			}

			return new_str;
		}

		return "";
	}

	#get_dim(a) {
		var dim = [];
		for (;;) {
			dim.push(a.length);

			if (Array.isArray(a[0])) {
				a = a[0];
			} else {
				break;
			}
		}
		return dim;
	}

	get_kernel_pixel_size () {
		return this.#kernel_pixel_size;
	}

	set_kernel_pixel_size (_new) {
		if(this.#looks_like_number(_new)) {
			if(this.#kernel_pixel_size == this.#parse_int(_new)) {
				this.wrn(`[set_kernel_pixel_size] Size has not changed.`);
			} else {
				this.#kernel_pixel_size = this.#parse_int(_new);
				this.#redo_what_has_to_be_redone()
			}
		} else {
			throw new Error(`[set_kernel_pixel_size] The parameter given (${_new}, type: ${typeof(_new)}) is not a number and does not does not look like a number.`);
		}
	}

	get_pixel_size () {
		return this.#pixel_size;
	}

	set_pixel_size (_new) {
		if(this.#looks_like_number(_new)) {
			if(this.#pixel_size == this.#parse_int(_new)) {
				this.wrn(`[set_pixel_size] Size has not changed.`);
			} else {
				this.#pixel_size = this.#parse_int(_new);
				this.#redo_what_has_to_be_redone()
			}
		} else {
			throw new Error(`[set_pixel_size] The parameter given (${_new}, type: ${typeof(_new)}) is not a number and does not does not look like a number.`);
		}
	}

	#draw_image_if_possible (layer, canvas_type, colors) {
		var canvas = null;

		try {
			var ret = [];

			var colors_shape = this.#get_dim(colors);

			if(colors_shape.length != 4) {
				//this.log("colors had no length of 4 but [" + this.#get_dim(colors).join(", ") + "]");
				return false;
			}

			colors_shape = this.#get_dim(colors);

			if(canvas_type == "output" || canvas_type == "input") {
				//this.log("pixels.shape: [" + this.#get_dim(colors).join(", ") + "]");

				var _num_channels = colors_shape[colors_shape.length - 1];

				if(_num_channels == 3) {
					if(canvas_type == "input") {
						canvas = this.#get_canvas_in_class(layer, "input_image_grid");
					} else {
						canvas = this.#get_canvas_in_class(layer, "image_grid");
					}

					ret.push(this.#draw_grid(canvas, this.#pixel_size, colors[0], 0, "", ""));
				} else {
					for (var i = 0; i < _num_channels; i++) {
						if(canvas_type == "input") {
							canvas = this.#get_canvas_in_class(layer, "input_image_grid");
						} else {
							canvas = this.#get_canvas_in_class(layer, "image_grid");
						}

						var inputTensor = this.tensor(colors);

						var slice = this.tidy(() => {
							var _h = inputTensor.shape[1];
							var _w = inputTensor.shape[2];
							var _slice = inputTensor.slice([0, 0, 0, i], [1, _h, _w, 1]);

							return _slice;
						});

						var asanai_this = this;

						var _slice_array = this.tidy(() => {
							var res = asanai_this.array_sync(slice);

							asanai_this.dispose(slice);

							return res;
						});

						var _grid_canvas = this.#draw_grid(canvas, this.#pixel_size, _slice_array[0], 1, "", "");

						ret.push(_grid_canvas);
						this.dispose(inputTensor);
					}
				}
			} else if(canvas_type == "kernel") {
				var shape = this.#get_dim(colors);

				var canvasses = [];

				for (var filter_id = 0; filter_id < shape[0]; filter_id++) {
					for (var channel_id = 0; channel_id < shape[1]; channel_id++) {
						canvas = this.#get_canvas_in_class(layer, "filter_image_grid");

						var drawn = this.#draw_kernel(canvas, this.#kernel_pixel_size, colors[filter_id]);

						ret.push(drawn);
					}
				}
			}
		} catch (e) {
			this.err(e);
		}

		return ret;
	}

	#array_to_html(array) {
		var m = "";
		for (var i = 0; i < array.length; i++) {
			if(typeof(array[i]) == "object") {
				for (var j = 0; j < array[i].length; j++) {
					m += array[i][j] + " ";
				}
			} else {
				m += array[i];
			}
			m += "<br>";
		}

		return m;
	}

	#get_canvas_in_class (layer, classname, dont_append, use_uuid=0) {
		var _uuid = "";
		var _uuid_str = "";
		if (use_uuid) {
			_uuid = this.#uuidv4();
			_uuid_str = " id='" + _uuid + "'";
		}
		var new_canvas = $("<canvas" + _uuid_str + "/>", {class: "layer_image", style: 'margin: 5px'}).prop({
			width: 0,
			height: 0
		});
		if(!dont_append) {
			$($("." + classname)[layer]).append(new_canvas);
		}

		return new_canvas[0];
	}

	#scaleNestedArray(arr) {
		// Find the minimum and maximum values in the nested array
		let min = Number.MAX_VALUE;
		let max = Number.MIN_VALUE;

		function findMinMax(arr) {
			for (let item of arr) {
				if (Array.isArray(item)) {
					findMinMax(item);
				} else {
					if (item < min) min = item;
					if (item > max) max = item;
				}
			}
		}

		findMinMax(arr);

		// Scale the values
		function scaleValue(value) {
			return (value - min) * (255 / (max - min));
		}

		function scaleNested(arr) {
			for (let i = 0; i < arr.length; i++) {
				if (Array.isArray(arr[i])) {
					scaleNested(arr[i]);
				} else {
					arr[i] = scaleValue(arr[i]);
				}
			}
		}

		scaleNested(arr);
	}

	#draw_kernel(canvasElement, rescaleFactor, pixels) {
		// canvasElement is the HTML canvas element where you want to draw the image
		// rescaleFactor is the factor by which the image should be resized, e.g., 2 for twice the size
		// pixels is a 3D array [n, m, a] where n is the height, m is the width, and a is the number of channels

		this.#scaleNestedArray(pixels);

		var context = canvasElement.getContext('2d'); // Get the 2D rendering context

		var kernel_shape = this.#get_dim(pixels);

		this.assert(kernel_shape.length == 3, `kernel is not an image, it has shape [${kernel_shape.map(item => item === null ? "null" : item).join(", ")}]`);

		var [_height, _width, channels] = [pixels.length, pixels[0].length, pixels[0][0].length]; // Destructure the dimensions

		if (channels === 3) {
			// Draw a color image on the canvas and resize it accordingly
			canvasElement.width = _width * rescaleFactor;
			canvasElement.height = _height * rescaleFactor;

			for (let i = 0; i < _height; i++) {
				for (let j = 0; j < _width; j++) {
					var [r, g, b] = pixels[i][j]; // Assuming channels are [red, green, blue]
					context.fillStyle = `rgb(${r}, ${g}, ${b}`;
					context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
				}
			}
		} else {
			// Draw only the first channel
			canvasElement.width = _width * rescaleFactor;
			canvasElement.height = _height * rescaleFactor;

			for (let i = 0; i < _height; i++) {
				for (let j = 0; j < _width; j++) {
					const grayscaleValue = pixels[i][j][0]; // Assuming the first channel is grayscale
					context.fillStyle = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue}`;
					context.fillRect(j * rescaleFactor, i * rescaleFactor, rescaleFactor, rescaleFactor);
				}
			}
		}

		return canvasElement;
	}

	#draw_rect(ctx, rect) {
		ctx.fillStyle = rect.fill;
		ctx.strokeStyle = rect.stroke;
		ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
		ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	}

	write_model_summary(divname=this.#model_summary_div) {
		if(!divname) {
			this.err("Cannot call write_model_summary without a divname (at least once)");
			return;
		}

		var $div = $("#" + divname)

		if(!$div.length) {
			this.err(`#${divname} could not be found`);
			return;
		}

		if(!$div.is(":visible")) {
			return;
		}

		this.assert(typeof(this.#model) == "object", "model is not an object");

		var logBackup = console.log;
		var logMessages = [];

		console.log = function () {
			logMessages.push.apply(logMessages, arguments);
		};

		this.#model.summary(200);

		$div.html(this.#summary_to_table(logMessages));

		console.log = logBackup;

		this.#model_summary_div = divname;
	}

	#summary_to_table(lines) {
		var new_array = [];

		var colspan_nr = 0;

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];

			if (line.match(/^=+$/)) {
			} else if (line.match(/\s{2,}/)) {
				var regex = new RegExp(/\s*(.*?)\s*(\[.*\])\s*(\[.*\])\s*(\d+)\s*/, "g");
				var result = regex.exec(line);
				var splitted = [];
				if(result) {
					splitted = [result[1], "<pre>" + result[2] + "</pre>", "<pre>" + result[3] + "</pre>", result[4]];
				} else {
					var splitted = line.split(/\s{2,}/).filter(n => n);
					for (var j = 0; j < splitted.length; j++) {
						if (splitted[j].startsWith("[")) {
							splitted[j] = "<pre>" + splitted[j] + "</pre>";
						}
					}
				}

				new_array.push(splitted);
				if (splitted.length > colspan_nr) {
					colspan_nr = splitted.length;
				}
			} else if (!line.match(/^_+$/) && line) {
				new_array.push(line);
			}
		}

		var table = "<table border=1 style='border-collapse: collapse;'>\n";
		for (var i = 0; i < new_array.length; i++) {
			var d_or_h = "d";
			if (i == 0) {
				d_or_h = "h";
			}
			if (typeof (new_array[i]) == "object") {
				table += "<tr><t" + d_or_h + ">" + new_array[i].join("</t" + d_or_h + "><t" + d_or_h + ">") + "</t" + d_or_h + "></tr>\n";
			} else {
				table += "<tr><td colspan=" + colspan_nr + ">" + new_array[i] + "</td></tr>\n";
			}
		}

		table += "</table>\n";

		return table;
	}


	write_tensors_info(divname=this.#write_tensors_info_div, time=200) {
		if($("#__status__bar__").length == 1) {
			this.err("[write_tensors_info] Cannot use status bar and write_tensors_info at the same time. Chose one.");
			return;
		}

		var $div = $("#" + divname);

		if(!$div.length) {
			this.err("Cannot find #" + divname);
			return;
		}

		this.#write_tensors_info_div = divname;

		if(!this.#looks_like_number(time)) {
			console.err("write_tensors_info: second parameter must be a number. Time will be set to 200 ms");
			time = 200;
		}

		var asanai_this = this;

		var _tensor_debugger = function () {
			var memory;
			try {
				memory = tf.memory();
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("tf is null")) {
					this.err("tf is null");
				} else {
					throw new Error(e);
				}

				return;
			}


			var bytes = memory["numBytes"];
			var gpu_bytes = memory["numBytesInGPU"];

			var num_tensors =  memory["numTensors"]; // Object.keys(tensors).length;
			var ram_mb = bytes / 1024 / 1024;
			ram_mb = ram_mb.toFixed(2);
			var gpu_mb = gpu_bytes / 1024 / 1024;
			if(gpu_mb) {
				gpu_mb = gpu_mb.toFixed(2);
			}

			var tensor_color = "";
			var gpu_color = "";
			var cpu_color = "";

			if(asanai_this.#last_num_global_tensors > num_tensors) {
				tensor_color = "#00ff00";
			} else if (asanai_this.#last_num_global_tensors < num_tensors) {
				tensor_color = "#ff0000";
			}

			if(asanai_this.#last_tensor_size_cpu > ram_mb) {
				cpu_color = "#00ff00";
			} else if (asanai_this.#last_tensor_size_cpu < ram_mb) {
				cpu_color = "#ff0000";
			}

			if(asanai_this.#last_tensor_size_gpu > gpu_mb) {
				gpu_color = "#00ff00";
			} else if (asanai_this.#last_tensor_size_gpu < gpu_mb) {
				gpu_color = "#ff0000";
			}

			var debug_string = `${asanai_this.trm("tensors")}: ` + asanai_this.colorize(num_tensors, tensor_color) + ", RAM: " + asanai_this.colorize(ram_mb, cpu_color) + "MB";

			if(gpu_mb.toString().match(/^\d+(?:\.\d+)?$/)) {
				debug_string = debug_string + ", GPU: " + asanai_this.colorize(gpu_mb, gpu_color) + "MB";
			}

			if(Object.keys(asanai_this.#custom_tensors).length) {
				debug_string += ", asanAI: " + Object.keys(asanai_this.#custom_tensors).length;
			}

			var $div = $("#" + divname);
			var memdeb = $div[0];

			function removeDataLangAttributeChangeQuotesRemoveTranslationClasses(inputString) {
				try {
					// Define the regex pattern to match 'data-lang' attribute
					var pattern = /\s*data-lang="[^"]*"/g;

					// Replace the pattern in the input string
					var resultString = inputString.replace(pattern, '');

					resultString = resultString.replace(/"/g, "'");

					resultString = resultString.replace(/<span class='TRANSLATEME_tensors'>[^<]*<\/span>/g, "");

					return resultString;
				} catch (error) {
					console.error("An error occurred:", error);
					return inputString; // Return original string in case of error
				}
			}


			if(memdeb) {
				var _inner_html = removeDataLangAttributeChangeQuotesRemoveTranslationClasses(memdeb.innerHTML);
				var $_div_html = removeDataLangAttributeChangeQuotesRemoveTranslationClasses($div.html());
				var cleaned_debug_string = removeDataLangAttributeChangeQuotesRemoveTranslationClasses(debug_string)

				if(_inner_html != cleaned_debug_string) {
					if($_div_html != cleaned_debug_string) {
						$div.html(debug_string);
					}
				}
			} else {
				asanai_this.wrn("memory_debugger_div not found. Did you, by any chance, manually remove it?");
			}

			asanai_this.#last_num_global_tensors = num_tensors;
			asanai_this.#last_tensor_size_cpu = ram_mb;
			asanai_this.#last_tensor_size_gpu = gpu_mb;

			asanai_this.#update_translations();
		}

		self.write_tensor_interval = setInterval(_tensor_debugger , 200);
	}

	colorize (text, color) {
		if(color) {
			return "<span style='color: " + color + "'>" + text + "</span>";
		}
		return text;
	}

	hide_tensors_info () {
		if(self.write_tensor_interval) {
			clearInterval(self.write_tensor_interval)
			$("#" + self.#write_tensors_info_div).html("");

			self.write_tensor_interval = null;
		} else {
			this.err("Cannot delete tensor info without tensor info being installed first via write_tensors_info(divname, time_in_ms)");
		}
	}

	#looks_like_number(item) {
		if(typeof(item) == "number") {
			return true;
		}

		if (/^[+-]?(?:(?:\d+(?:\.\d+)?))$/.test(item)) {
			return true;
		}

		return false;
	}

	get_divide_by () {
		return this.#divide_by;
	}

	set_divide_by (number) {
		if(this.#looks_like_number(number)) {
			this.#divide_by = this.#parse_float(number);
			return this.#divide_by;
		}

		this.err(`"${number}" does not seem to be a number. Cannot set it.`);
	}

	#_show_images_in_output (predictions_tensor, write_to_div) {
		if(!this.is_tf_tensor(predictions_tensor)) {
			this.err("[#_show_images_in_output] predictions tensor (first parameter) is not a tensor");
			return;
		}

		if(typeof(write_to_div) == "string") {
			var $write_to_div = $("#" + write_to_div);
			if($write_to_div.length == 1) {
				write_to_div = $write_to_div[0];
			} else {
				this.err(`[#_show_images_in_output] Could not find div to write to by id ${write_to_div}`);
				return;
			}
		} else if(!write_to_div instanceof HTMLElement) {
			this.err(`[#_show_images_in_output] write_to_div is not a HTMLElement`);
			return;
		}

		if(!predictions_tensor.shape.length == 4) {
			this.err(`[#_show_images_in_output] predictions tensor does not have 4 elements in length, but [${predictions_tensor.shape.map(item => item === null ? "null" : item).join(", ")}]`);
			return;
		}

		var asanai_this = this;

		var normalized = this.tidy(() => {
			var _n = asanai_this.tensor(asanai_this.#normalize_to_image_data(asanai_this.array_sync(predictions_tensor)));

			return _n;
		});

		var synched = this.tidy(() => {
			var res = asanai_this.array_sync(normalized);
			return res;
		});

		this.dispose(normalized);

		var _dim = this.#get_dim(synched);

		var canvas = $(`<canvas height=${_dim[0]} width=${_dim[1]} />`)[0];

		$(write_to_div).html("");

		for (var image_idx = 0; image_idx < _dim[0]; image_idx++) {
			var this_synched = synched[0];
			var _grid_canvas = this.#draw_grid(canvas, this.#pixel_size, this_synched, 1, "", "");
			$(write_to_div).append(_grid_canvas);
		}
	}

	#_show_output (predictions_tensor, write_to_div) {
		if(!this.is_tf_tensor(predictions_tensor)) {
			this.err("[#_show_output] predictions tensor (first parameter) is not a tensor");
			return;
		}

		if(typeof(write_to_div) == "string") {
			var $write_to_div = $("#" + write_to_div);
			if($write_to_div.length == 1) {
				write_to_div = $write_to_div[0];
			} else {
				this.err(`[#_show_output] Could not find div to write to by id ${write_to_div}`);
				return;
			}
		} else if(!write_to_div instanceof HTMLElement) {
			this.err(`[#_show_output] write_to_div is not a HTMLElement`);
			return;
		}

		if(this.#model.output.shape.length == 2) {
			this.#_predict_table(predictions_tensor, write_to_div);
		} else if(this.#model.output.shape.length == 4) {
			this.#_show_images_in_output(predictions_tensor, write_to_div)
		} else {
			var error = `Unimplemented output shape: [${this.#model.output.shape.map(item => item === null ? "null" : item).join(", ")}]`;
			this.err(error);
			$(write_to_div).html(error);
		}
	}

	#_predict_table (predictions_tensor, write_to_div) {
		if(!this.is_tf_tensor(predictions_tensor)) {
			this.err("[#_predict_table] Predictions tensor is (first parameter) is not a tensor");
			return;
		}

		if(write_to_div) {
			if(typeof(write_to_div) == "string") {
				var $write_to_div = $("#" + write_to_div);
				if($write_to_div.length == 1) {
					write_to_div = $write_to_div[0];
				} else {
					this.err(`[#_predict_table] Could not find div to write to by id ${write_to_div}`);
					return;
				}
			} else if(!write_to_div instanceof HTMLElement) {
				this.err(`[#_predict_table] write_to_div is not a HTMLElement`);
				return;
			}
		}

		var asanai_this = this;
		var predictions = tf.tidy(() => { return asanai_this.array_sync(predictions_tensor); });

		var max = 0;

		for (var i = 0; i < predictions[0].length; i++) {
			if(max < predictions[0][i]) {
				max = predictions[0][i];
			}
		}

		var html = "<table class='predict_table'>";

		for (var i = 0; i < predictions[0].length; i++) {
			html += this.#_draw_bars_or_numbers(i, predictions[0], max);
		}

		html += "</table>";

		$(write_to_div).html(html);
	}

	#last_layer_is_softmax () {
		// TODO
		var _last_layer_is_softmax = this.#model.layers[this.#model.layers.length - 1].activation
	}

	enable_show_bars() {
		this.#show_bars_instead_of_numbers = true;
	}

	disable_show_bars() {
		this.#show_bars_instead_of_numbers = false;
	}

	#_draw_bars_or_numbers (i, predictions, max) {
		var label = this.#labels[i % this.#labels.length];
		var val = predictions[i];
		var w = Math.floor(val * this.#bar_width);

		var html = "";

		var bar_style = ` style='margin-top: 4px; display: inline-block;`;
		bar_style += `height: 3px; background-color: ${this.#bar_background_color}; padding: 5px; width: ${this.#bar_width}px;' `;

		var highest_bar_css = `background-color: #${this.#max_bar_color} !important;`;

		var label_element_css = "width: 100%; text-align: left; height: 40px;";

		var best_result_css = `background-color: ${this.#max_bar_color}; color: white;`;

		var label_element = ` class='label_element' style='${label_element_css}' `;
		var label_element_best_result = ` class='label_element best_result' style='${best_result_css} ${label_element_css}' `;

		if(this.#show_bars_instead_of_numbers) {
			if(label) {
				if(val == max) {
					html =`<tr><td ${label_element}>${label}</td><td><span ${bar_style}><span style='${highest_bar_css} background-color: ${this.#max_bar_color}; margin-wtop: 2px; width: ${w}px; display: block; height: 4px'></span></span></td></tr>`;
				} else {
					html = `<tr><td ${label_element}>${label}</td><td><span ${bar_style}><span style='margin-top: 2px; background-color: ${this.#default_bar_color}; width: ${w}px; display: block; height: 4px'></span></span></td></tr>`;
				}
			} else {
				if(val == max) {
					html = `<tr><td><span ${bar_style}><span style='${highest_bar_css} background-color: ${this.#max_bar_color};width:${w}px; display: block; height: 4px'></span></span></td></tr>`;
				} else {
					html = `<tr><td><span ${bar_style}><span style='width: background-color: ${this.#default_bar_color};${w}px; display: block; height: 4px'></span></span></td></tr>`;
				}
			}
		} else {
			if(label) {
				if(val == max) {
					html = `<tr><td><b ${label_element_best_result}>${label}</td><td>${val}</b></td></tr>\n`;
				} else {
					html = `<tr><td class='label_element'>${label}</td><td>${val}</td></tr>\n`;
				}
			} else {
				if(val == max) {
					html = `<tr><td><b ${label_element_best_result}>${val}</b></td></tr>\n`;
				} else {
					html = `<tr><td>${val}</td></tr>`;
				}
			}
		}

		return html;
	}

	get_labels () {
		return this.#labels;
	}

	set_labels (_l) {
		if(Array.isArray(_l)) {
			if(this.#get_dim(_l).length == 1) {
				if(JSON.stringify(_l) == JSON.stringify(this.#labels)) {
					this.wrn(`Given labels are the same as the ones set earlier. Not re-setting them.`);
				} else {
					this.#labels = _l;

					if(this.#model) {
						if(this.#model.output.shape.length == 2) {
							var num_labels = this.#model.output.shape[1];

							if(this.#labels.length != num_labels) {
								this.wrn(`Your model expects ${num_labels}, but you have set ${this.#labels.length} labels.`);
							}

							this.#redo_what_has_to_be_redone();
						}
					}
				}
			} else {
				throw new Error("labels cannot be a multdimensional array");
			}
		} else {
			throw new Error("labels must be an array");
		}
	}

	async loadImage(img_id, width, height, url) {
		return new Promise((resolve, reject) => {
			const imgElement = new Image();
			imgElement.id = img_id;
			imgElement.width = width;
			imgElement.height = height;
			imgElement.className = 'load_images_into_div_image_element';
			imgElement.src = url;

			var $img = $(imgElement);

			imgElement.onload = () => {
				$(imgElement).attr('data-loaded', 'true');
				resolve(imgElement);
			};

			imgElement.onerror = () => {
				$(imgElement).attr('data-loaded', 'true');
				log("Image failed to load:", imgElement.src);
				reject(new Error(`Failed to load image: ${imgElement.src}`));
			};
		});
	}

	async load_image_urls_to_div_and_tensor (divname, urls_and_categories, one_hot = 1, shuffle = 1) {
		function uniqueArray1( ar ) {
			var j = {};

			ar.forEach( function(v) {
				j[v+ '::' + typeof v] = v;
			});

			return Object.keys(j).map(function(v){
				return j[v];
			});
		}


		if(!this.#model) {
			this.err(`[load_image_urls_to_div_and_tensor] Cannot continue without a loaded model`);
			return;
		}

		if(!this.#model.layers) {
			this.err(`[load_image_urls_to_div_and_tensor] Cannot continue with a model without layers`);
			return;
		}

		if(!Array.isArray(this.#model.input.shape)) {
			this.err(`[load_image_urls_to_div_and_tensor] this.#model.input.shape is not an array`);
			return;
		}

		if(this.#model.input.shape.length != 4) {
			this.err(`[load_image_urls_to_div_and_tensor] this.#model.input must be an array with 4 elements, but is [${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}]`);
			return;
		}

		if(!this.#model_height) {
			this.err(`[load_image_urls_to_div_and_tensor] this.#model_height has no value`);
			return;
		}

		if(!this.#model_width) {
			this.err(`[load_image_urls_to_div_and_tensor] this.#model_width has no value`);
			return;
		}

		var $div = $("#" + divname);
		if(!$div.length) {
			this.err(`[load_image_urls_to_div_and_tensor] cannot use non-existant div. I cannot find #${divname}`);
			return;
		}

		if(!Array.isArray(urls_and_categories)) {
			this.err(`[load_image_urls_to_div_and_tensor] urls_and_categories is not an array`);
			return;
		}

		if(!urls_and_categories.length) {
			this.err(`[load_image_urls_to_div_and_tensor] urls_and_categories is empty`);
			return;
		}

		this.#image_url_tensor_div = divname;

		var urls = [];
		var categories = [];

		var unique_categories = [];

		if(shuffle) {
			urls_and_categories = urls_and_categories.sort((a, b) => 0.5 - Math.random());
		}

		for (var i = 0; i < urls_and_categories.length; i++) {
			var _this = urls_and_categories[i];
			var url;
			var cat;

			if(typeof(_this) == "object") {
				url = _this[0];
			} else {
				this.err(`No url for url for urls_and_categories[${i}] found`);
				return;
			}

			if(1 in _this) {
				cat = _this[1];
			} else {
				this.err(`No url for url for urls_and_categories[${i}] found`);
				return;
			}

			urls.push(url);
			categories.push(cat);

			if(!unique_categories.includes(cat)) {
				unique_categories.push(cat);
			}
		}

		this.assert(Array.isArray(urls), `urls is not an array but ${typeof(urls)}`);
		this.assert(Array.isArray(categories), `categories is not an array but ${typeof(categories)}`);
		this.assert(Array.isArray(unique_categories), `categories is not an array but ${typeof(unique_categories)}`);
		this.assert(unique_categories.length <= categories.length, `unique_categories.length = ${unique_categories.length} is larger than categories.length = ${categories.length}, which should never occur.`);

		if(!urls.length) {
			this.err("[load_image_urls_to_div_and_tensor] urls-array is empty");
			return;
		}

		if(!urls.length) {
			this.err("[load_image_urls_to_div_and_tensor] categories-array is empty");
			return;
		}

		var imgs = [];

		var __is = this.#model.input.shape;

		var image_tensors_array = [];

		var category_output = [];

		for (var i = 0; i < urls.length; i++) {
			if(i == 0) {
				$div.html("");
			}

			var url = urls[i];

			this.assert(typeof(url) == "string", `${urls[i]} is not a string but ${typeof(urls[i])}`);

			var height = 50;
			var width = 50;

			if(this.#model_height) {
				height = this.#model_height;
			}

			if(this.#model_width) {
				width = this.#model_width;
			}

			var _uuid = this.#uuidv4();

			var img_id = `load_images_into_div_image_${_uuid}`;

			var $img = null;

			try {
				var _loaded_img_ret_val = await this.loadImage(_uuid, this.#model_width, this.#model_height, url);
				$img = $(_loaded_img_ret_val);

				var this_img = $img[0];

				imgs.push(this_img);

				$div.append($img);

				while ($img.attr('data-loaded') !== 'true') {
					log("WWWWW");
					await this.delay(10);
				}

				var this_num_channels = this.#num_channels;

				var pixel_data = this.from_pixels(this_img, this_num_channels);

				var img_array = this.array_sync(pixel_data);

				image_tensors_array.push(img_array)
				category_output.push(unique_categories.indexOf(categories[i]));

				this.dispose(pixel_data)
			} catch (e) {
				this.err("" + e)
			}
		}

		var category_tensor = this.tensor(category_output);

		image_tensors_array = this.tensor(image_tensors_array);

		if(one_hot) {
			var asanai_this = this;

			category_tensor = this.tidy(() => {
				var __tensor = category_tensor.toInt();

				var _unique_categories_length = unique_categories.length;

				var _res = asanai_this.one_hot(__tensor, _unique_categories_length);

				this.dispose(__tensor)

				return _res;
			});

			var last_layer_activation = this.#model.layers[this.#model.layers.length - 1].getConfig().activation;
			
			if(last_layer_activation != "softmax") {
				this.wrn("[load_image_urls_to_div_and_tensor] The last layer is not softmax, but you chose one hot encoding. Though this is possible, usually, it is not what you want. Set the last layer's activation function to softmax.");
			}
		}

		this.set_labels(unique_categories);

		var res = {
			html_image_elements: imgs,
			labels: unique_categories,
			x: image_tensors_array,
			y: category_tensor
		};

		//this.log("res:", res);

		return res;
	}

	#set_document_title (t) {
		if(t != document.title) {
			document.title = t;
		}
	}

	async #input_shape_is_image (is_from_webcam=0) {
		if(!this.#model) {
			this.err(`cannot find this.#model`);
			return;
		}

		if(!this.#model.input) {
			this.err(`cannot find this.#model.input`);
			return;
		}

		if(!this.#model.input.shape) {
			this.err(`cannot find this.#model.input.shape`);
			return;
		}

		if(!this.#model.input.shape.length) {
			this.err(`could find this.#model.input.shape.length but is 0`);
			return;
		}

		var shape = this.#model.input.shape;
		if(shape.length == 4 && shape[3] == 3) {
			return true;
		}
		if(shape.length == 3 && shape[2] == 3) {
			return true;
		}
		return false;
	}

	load_image_urls_into_div (divname, ...urls) {
		if(!divname) {
			this.err(`[load_image_urls_into_div] cannot use empty div.`);
			return;
		}

		if(urls.length == 0) {
			this.warn(`[load_image_urls_into_div]: Empty url list`);
		}

		var $div = $("#" + divname);
		if(!$div.length) {
			this.err(`[load_image_urls_into_div] cannot use non-existant div. I cannot find #${divname}`);
			return;
		}

		this.#image_url_tensor_div = divname;

		this.assert(Array.isArray(urls), `urls is not an array but ${typeof(urls)}`);

		while (this.get_shape_from_array(urls).length > 1) {
			urls = urls.flat();
		}

		if(!urls.length) {
			this.err("[load_image_urls_into_div] urls-array is empty");
			return;
		}

		var imgs = [];

		for (var i = 0; i < urls.length; i++) {
			var url = urls[i];

			this.assert(typeof(url) == "string", `${urls[i]} is not a string but ${typeof(urls[i])}`);

			var height = 50;
			var width = 50;

			if(this.#model_height) {
				height = this.#model_height;
			}

			if(this.#model_width) {
				height = this.#model_width;
			}

			var _uuid = this.#uuidv4();

			var img = $(`<img id='load_images_into_div_image_${_uuid}' width=${width} height=${height} src='${url}' />`);

			imgs.push(img);

			$div.append(img);
		}

		return imgs;
	}

	#log_once (...args) {
		var md5 = JSON.stringify(args);

		if(this.#printed_msgs.includes(md5)) {
			return;
		}

		this.#printed_msgs.push(md5);

		this.log(...args);
	}

	findIndexByKey(_array, key) {
		key = decodeURIComponent(key);

		try {
			this.assert(Array.isArray(_array), "Input is not an _array");
			this.assert(typeof key === "string", "Key is not a string");

			for (let i = 0; i < _array.length; i++) {
				if (_array[i] === key) {
					return i; // Found the key, return its index
				}
			}

			this.assert(false, `Key "${key}" not found in the _array: ${JSON.stringify(_array)}`);
		} catch (error) {
			console.log("Error:", error);
			// Handle the error intelligently, log and/or perform other actions as needed
		}
	}

	#get_last_layer_activation_function () {
		if(!this.#model) {
			this.wrn("this.#model not found for restart_fcnn");
			return;
		}

		if(!Object.keys(this.#model).includes("layers")) {
			this.wrn("this.#model.layers not found for restart_fcnn");
			return;
		}

		if(this.#model.layers.length == 0) {
			this.err("this.#model.layers.length is 0");
			return;
		}

		var last_layer_activation = this.#model.layers[this.#model.layers.length - 1].getConfig().activation;

		return last_layer_activation;
	}

	async visualize_train () {
		if(!$("#visualize_images_in_grid").is(":checked")) {
			this.wrn("visualize_train: #visualize_images_in_grid is not checked");
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(this.#data_origin != "default") {
			this.#log_once("Train visualization only works for default data.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(!this.#is_classification) {
			this.#log_once("Train visualization only works for classification problems.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(!await this.#input_shape_is_image()) {
			this.#log_once(`Train visualization only works for images. Input-shape: [${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}]`);
			$("#canvas_grid_visualization").html("");
			return;
		}

		if(this.#get_last_layer_activation_function() != "softmax") {
			this.#log_once("Train visualization only works when the last layer is softmax.");
			$("#canvas_grid_visualization").html("");
			return;
		}

		var imgs = [];
		var categories = [];
		var probabilities = [];

		var max = this.#max_number_of_images_in_grid;

		if(max == 0) {
			return;
		}

		if($("#plotly_epoch_history").length) {
			$("#plotly_epoch_history").show();
		}

		if(!this.#labels.length) {
			$("#canvas_grid_visualization").html("");

			return;
		}

		if(!this.#image_div_name) {
			this.err(`[visualize_train] this.#image_div_name not set`);
			return;
		}

		var image_elements = $("#" + this.#image_div_name).find("img,canvas");
		if(!image_elements.length) {
			this.err(`[visualize_train] could not find image_elements (${this.#image_div_name})`);
			return;
		}

		var total_wrong = 0;
		var total_correct = 0;

		var category_overview = {};

		for (var i = 0; i < image_elements.length; i++) {
			var img_elem = image_elements[i];

			var img_elem_xpath = this.get_element_xpath(img_elem);
			
			var this_predicted_array = [];


			var src;
			try {
				src = img_elem.src;
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = message;
				}

				e = "" + e;

				throw new Error(e);

				continue;
			}

			if(!src) {
				this.err("[visualize_train] Cannot use images without src tags");
				continue;
			}

			if(i <= max) {
				var res_array;

				if(!img_elem) {
					tf.engine().endScope();
					this.wrn("[visualize_train] img_elem not defined!", img_elem);
					continue;
				}

				var asanai_this = this;

				var img_tensor = this.tidy(() => {
					try {
						var res = asanai_this.#expand_dims(asanai_this.#resizeImage(asanai_this.from_pixels(img_elem), [asanai_this.#model_height, asanai_this.#model_width]));
						res = asanai_this.divNoNan(res, asanai_this.#divide_by);
						return res;
					} catch (e) {
						this.err(e);
						return null;
					}
				});

				if(img_tensor === null) {
					this.wrn("[visualize_train] Could not load image from pixels from this element:", img_elem);
					continue;
				}

				var res = this.tidy(() => { return this.#model.predict(img_tensor); });

				res_array = this.array_sync(res)[0];
				await this.dispose(img_tensor);
				await this.dispose(res);

				this.assert(Array.isArray(res_array), `res_array is not an array, but ${typeof(res_array)}, ${JSON.stringify(res_array)}`);

				this_predicted_array = res_array;

				if(this_predicted_array) {
					this.#confusion_matrix_and_grid_cache[img_elem_xpath] = this_predicted_array;

					var max_probability = Math.max(...this_predicted_array);
					var category = this_predicted_array.indexOf(max_probability);

					//console.log("xpath:", img_elem_xpath, "category", category, "max_probability:", max_probability, "this_predicted_array:", this_predicted_array);

					categories.push(category);
					probabilities.push(max_probability);
					imgs.push(img_elem);
				} else {
					this.err(`[visualize_train] Cannot find prediction for image with xpath ${img_elem_xpath}`);
				}
			}

			try {
				var tag_name = img_elem.tagName;
				if(src && tag_name == "IMG") {
					var predicted_tensor = this_predicted_array;

					if(predicted_tensor === null || predicted_tensor === undefined) {
						this.dbg("[visualize_train] Predicted tensor was null or undefined");
						return;
					}

					var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));

					var correct_category = this.#extractCategoryFromURL(src, img_elem);
					if(correct_category === undefined || correct_category === null) {
						continue;				
					}

					var predicted_category = this.#labels[predicted_index];

					var correct_index = -1;

					try {
						correct_index = this.findIndexByKey(this.#labels, correct_category) % this.#labels.length;
					} catch (e) {
						this.wrn("[visualize_train] " + e);
						return;
					}

					if(!Object.keys(category_overview).includes(predicted_category)) {
						category_overview[predicted_category] = {
							wrong: 0,
							correct: 0,
							total: 0
						};
					}

					//log("predicted_category " + predicted_category + " detected from " + src + ", predicted_index = " + predicted_index + ", correct_index = " + correct_index);

					if(predicted_index == correct_index) {
						total_correct++;

						category_overview[predicted_category]["correct"]++;
					} else {
						total_wrong++;

						category_overview[predicted_category]["wrong"]++;
					}
					category_overview[predicted_category]["total"]++;
				} else {
					this.err(`[visualize_train] Cannot use img element, src: ${src}, tagName: ${tag_name}`);
				}
			} catch (e) {
				console.log(e);
			}

		}

		for (var i = 0; i < Object.keys(category_overview).length; i++) {
			var category = Object.keys(category_overview)[i];
			category_overview[category]["percentage_correct"] = this.#parse_int((category_overview[category]["correct"] / category_overview[category]["total"]) * 100);
		}

		if(imgs.length && categories.length && probabilities.length) {
			this.draw_images_in_grid(imgs, categories, probabilities, category_overview);
		} else {
			$("#canvas_grid_visualization").html("");
		}
	}

	draw_images_in_grid (images, categories, probabilities, category_overview) {
		$("#canvas_grid_visualization").html("");
		var numCategories = this.#labels.length;

		this.assert(numCategories >= 1, "numCategories is not larger than 0")

		var margin = 10;
		var canvases = [];

		var _height = $("#visualization").height()

		if(!_height) {
			_height = 460;
		}

		// create a canvas for each category
		for (let i = 0; i < numCategories; i++) {
			var canvas = document.createElement("canvas");
			var relationScale = 1;
			var visualization_width = $("#visualization").width();
			if(!visualization_width) {
				visualization_width = window.innerWidth
			}
			var pw = this.#parse_int(visualization_width * relationScale);
			var w = this.#parse_int(pw / (numCategories + 1));


			canvas.width = w;
			canvas.height = _height;

			var ctx = canvas.getContext("2d");

			ctx.fillStyle = "rgba(255, 255, 255, 0)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.font = "14px Arial";
			if(this.#is_dark_mode) {
				ctx.fillStyle = "#ffffff";
			} else {
				ctx.fillStyle = "#000000";
			}
			ctx.textAlign = "right";

			canvases.push(canvas);
		}

		var graphWidth = canvases[0].width - margin * 2;
		var graphHeight = canvases[0].height - margin * 2;
		var maxProb = 1;

		// draw y-axis labels

		for (let canvasIndex = 0; canvasIndex < numCategories; canvasIndex++) {
			var canvas = canvases[canvasIndex];
			var ctx = canvas.getContext("2d");

			ctx.textAlign = "center";
			var label = this.#labels[canvasIndex];
			var _text = label;

			_text = _text.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

			ctx.fillText(_text, canvas.width / 2, canvas.height - margin - 30);

			if(!category_overview) {
				dbg("[draw_images_in_grid] category_overview was empty");
				continue;
			}

			var __key = this.#labels[canvasIndex];
			if(!Object.keys(category_overview).includes(__key)) {
				if (__key == "fire") { __key = this.#language[this.#lang]["fire"]; }
				else if (__key == "mandatory") { __key = this.#language[this.#lang]["mandatory"]; }
				else if (__key == "prohibition") { __key = this.#language[this.#lang]["prohibition"]; }
				else if (__key == "rescue") { __key = this.#language[this.#lang]["rescue"]; }
				else if (__key == "warning") { __key = this.#language[this.#lang]["warning"]; }
			}

			if(!Object.keys(category_overview).includes(__key)) {
				//dbg("[draw_images_in_grid] category_overview did not contain key " + __key);
				continue;
			}

			var _d = category_overview[__key];

			var _acc_text =
				_d["correct"] +
				" " +
				this.#language[this.#lang]["of"] +
				" " +
				_d["total"] +
				" " +
				this.#language[this.#lang]["correct"] +
				" (" +
				_d["percentage_correct"] +
				"%)"
			;

			//log("TEXT:", _text);
			ctx.fillText(_acc_text, canvas.width / 2, canvas.height - margin);
		}

		var canvas_img_counter = {};
		var real_canvas_img_counter = [];

		for (let i = 0; i < images.length; i++) {
			var category = categories[i];

			real_canvas_img_counter[category] = 0;
		}

		for (let i = 0; i < images.length; i++) {
			var category = categories[i];

			canvas_img_counter[category] = 0;

			real_canvas_img_counter[category]++;
		}

		var targetSize = Math.min(this.#model.input.shape[1], this.#model.input.shape[2]); // Change this to the desired size

		// draw x-axis labels and images
		for (let i = 0; i < images.length; i++) {
			var image = images[i];
			var category = categories[i];
			var probability = probabilities[i];


			if(real_canvas_img_counter[category] > 0) {
				var canvas_width = canvases[0].width;

				targetSize = canvas_width / real_canvas_img_counter[category];

				targetSize = Math.min(this.#model.input.shape[1], this.#model.input.shape[2], targetSize); // Change this to the desired size
			}

			var xPos = margin * 1;
			var yPos = margin + graphHeight - probability / maxProb * graphHeight;

			var canvasIndex = category;
			var canvas = canvases[canvasIndex];
			if(canvas) {
				var ctx = canvas.getContext("2d");

				// draw image
				var scale = targetSize / Math.max(image.width, image.height);
				var w = image.width * scale;
				var h = image.height * scale;

				var imageX = xPos - this.#model.input.shape[2] / 2;
				imageX += canvas_img_counter[category] * targetSize;

				if(imageX < 0) {
					imageX = 0;
				}

				imageX = this.#parse_int(imageX);

				var imageY = this.#parse_int(yPos - h / 2);
				//console.log("DEBUG:", image, imageX, imageY, w, h);
				ctx.drawImage(image, imageX, imageY, w, h);

				canvas_img_counter[category]++;
			} else {
				wrn("[draw_images_in_grid] Canvas not defined. canvasIndex + 1:", canvasIndex);
			}
		}

		// append each canvas to its corresponding element
		for (let i = 0; i < numCategories; i++) {
			var canvas = canvases[i];
			if(canvas) {
				//var containerId = "#canvas_grid_visualization_" + (i + 1);
				var containerId = "#canvas_grid_visualization";
				$(canvas).appendTo($(containerId));
				if ((i + 1) < numCategories) {
					var color = '000';

					if(this.#is_dark_mode) {
						color = 'fff';
					}
				
					$(`<span class='border_of_grid_visualization' style="display: inline-block; vertical-align: top; border-left: 1px solid #${color}; height: ${_height}px"></span>`).appendTo($(containerId));
				}
			} else {
				wrn("[draw_images_in_grid] Canvas could not be appended!");
			}
		}

	}

	random_two(min, max) { // Seeded PRNG
		var x = Math.sin(this.#seed_two++) * 10000;
		var result = x - Math.floor(x);
		result = ((max - min) * result) + min;
		this.#seed_two = result;
		return result;
	}


	reset_training_logs () {
		this.#training_logs_epoch = {
			"loss": {
				"x": [],
				"y": [],
				"type": "scatter",
				"mode": this.#get_plotly_type(),
				"name": "Loss"
			}
		}

		this.#training_logs_batch = {
			"loss": {
				"x": [],
				"y": [],
				"type": "scatter",
				"mode": this.#get_plotly_type(),
				"name": "Loss"
			}
		}

		this.#time_per_batch = {
			"time": {
				"x": [],
				"y": [],
				"type": "scatter",
				"mode": this.#get_plotly_type(),
				"name": "Time per batch (in seconds)"
			}
		}
	}

	#_get_callbacks (_callbacks={}) {
		var callbacks = {};

		var asanai_this = this;

		callbacks["onTrainBegin"] = async function () {
			asanai_this.reset_training_logs();

			var $plotly_div = $("");

			if (asanai_this.#plotly_div) {
				$plotly_div = $("#" + asanai_this.#plotly_div);
			}

			if($plotly_div.length == 0) {
				asanai_this.wrn(`[onTrainBegin] Plotly div could not be found`);
			} else {
				$plotly_div.html(`<div id="plotly_batch_history"></div><div id="plotly_time_per_batch"></div><div id="plotly_epoch_history"></div>`)
			}

			asanai_this.#confusion_matrix_and_grid_cache = {};
			asanai_this.#current_epoch = 0;
			asanai_this.#this_training_start_time = Date.now();

			await asanai_this.visualize_train();
			await asanai_this.#confusion_matrix_to_page(); // async not possible

			asanai_this.#confusion_matrix_and_grid_cache = {};

			await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);

			if ("onTrainBegin" in _callbacks) { _callbacks["onTrainBegin"](); }
		};

		callbacks["onBatchBegin"] = async function () {
			asanai_this.#confusion_matrix_and_grid_cache = {};
			if(!asanai_this.#started_training) {
				asanai_this.#model.stopTraining = true;
			}

			//if($("#math_tab").is(":visible")) {
			//	await asanai_this.#write_model_to_latex_to_page(asanai_this);
			//}

			asanai_this.#confusion_matrix_and_grid_cache = {};

			await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);
			if ("onBatchBegin" in _callbacks) { _callbacks["onBatchBegin"](); }
		};

		callbacks["onEpochBegin"] = async function () {
			asanai_this.#confusion_matrix_and_grid_cache = {};
			asanai_this.#current_epoch++;
			var max_number_epochs = asanai_this.#max_epoch;
			var current_time = Date.now();
			var epoch_time = (current_time - asanai_this.#this_training_start_time) / asanai_this.#current_epoch;
			var epochs_left = max_number_epochs - asanai_this.#current_epoch;
			var seconds_left = asanai_this.#parse_int(Math.ceil((epochs_left * epoch_time) / 1000) / 5) * 5;
			var time_estimate = asanai_this.#human_readable_time(seconds_left);

			//$("#training_progress_bar").show();

			asanai_this.#set_document_title("[" + asanai_this.#current_epoch + "/" + max_number_epochs + ", " + time_estimate  + "] asanAI");

			var percentage = asanai_this.#parse_int((asanai_this.#current_epoch / max_number_epochs) * 100);
			$("#training_progressbar>div").css("width", percentage + "%");
			asanai_this.#confusion_matrix_and_grid_cache = {};

			await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);

			if ("onEpochBegin" in _callbacks) { _callbacks["onEpochBegin"](); }
		};

		callbacks["onBatchEnd"] = async function (batch, logs) {
			/*
			console.log("First layer first neuron:")
			console.log(asanai_this.#model["layers"][0].weights[0].val.arraySync()[0][0][0]);
			*/

			asanai_this.#confusion_matrix_and_grid_cache = {};
			delete logs["batch"];
			delete logs["size"];

			var batchNr = 1;
			var loss = logs["loss"];
			if(asanai_this.#training_logs_batch["loss"]["x"].length) {
				batchNr = Math.max(...asanai_this.#training_logs_batch["loss"]["x"]) + 1;
			}
			asanai_this.#training_logs_batch["loss"]["x"].push(batchNr);
			asanai_this.#training_logs_batch["loss"]["y"].push(loss);

			if(!asanai_this.#last_batch_time) {
				asanai_this.#last_batch_time = +new Date();
			} else {
				var current_time = +new Date();
				asanai_this.#time_per_batch["time"]["x"].push(batchNr);
				asanai_this.#time_per_batch["time"]["y"].push((current_time - asanai_this.#last_batch_time) / 1000);
				asanai_this.#last_batch_time = current_time;
			}

			var this_plot_data = [asanai_this.#training_logs_batch["loss"]];

			if(!asanai_this.#last_batch_plot_time || (Date.now() - asanai_this.#last_batch_plot_time) > 5) { // Only plot every min_time_between_batch_plots seconds
				if(batchNr == 1) {
					if($("#plotly_batch_history").length && $("#plotly_batch_history").is(":visible")) {
						Plotly.newPlot("plotly_batch_history", this_plot_data, asanai_this.#get_plotly_layout(asanai_this.#tr("batches")));
					}
					if($("#plotly_time_per_batch").length && $("#plotly_time_per_batch").is(":visible")) {
						Plotly.newPlot("plotly_time_per_batch", [asanai_this.#time_per_batch["time"]], asanai_this.#get_plotly_layout(asanai_this.#tr("time_per_batch")));
					}
				} else {
					try {
						if($("#plotly_batch_history").length && $("#plotly_batch_history").is(":visible")) {
							Plotly.update("plotly_batch_history", this_plot_data, asanai_this.#get_plotly_layout(asanai_this.#tr("batches")));
						}
						if($("#plotly_time_per_batch").length && $("#plotly_time_per_batch").is(":visible")) {
								Plotly.update("plotly_time_per_batch", [asanai_this.#time_per_batch["time"]], asanai_this.#get_plotly_layout(asanai_this.#tr("time_per_batch")));
						}
					} catch (e) {
						asanai_this.err("" + e);
					}
				}
				asanai_this.#last_batch_plot_time = Date.now();
			}

			if($("#predict_own_data").val()) {
				await predict($("#predict_own_data").val());
			}


			asanai_this.#confusion_matrix_and_grid_cache = {};

			await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);

			if ("onBatchEnd" in _callbacks) { _callbacks["onBatchEnd"](); }
		};

		callbacks["onEpochEnd"] = async function (batch, logs) {
			asanai_this.#confusion_matrix_and_grid_cache = {};
			delete logs["epoch"];
			delete logs["size"];

			var epochNr = 1;
			var loss = logs["loss"];
			if(asanai_this.#training_logs_epoch["loss"]["x"].length) {
				epochNr = Math.max(...asanai_this.#training_logs_epoch["loss"]["x"]) + 1;
			}
			asanai_this.#training_logs_epoch["loss"]["x"].push(epochNr);
			asanai_this.#training_logs_epoch["loss"]["y"].push(loss);

			var other_key_name = "val_loss";

			var this_plot_data = [asanai_this.#training_logs_epoch["loss"]];

			if(Object.keys(logs).includes(other_key_name)) {
				if(epochNr == 1) {
					asanai_this.#training_logs_epoch[other_key_name] = {
						"x": [],
						"y": [],
						"type": "scatter",
						"mode": asanai_this.#get_plotly_layout(),
						"name": "Loss"
					};
				}

				loss = logs[other_key_name];
				asanai_this.#training_logs_epoch[other_key_name]["x"].push(epochNr);
				asanai_this.#training_logs_epoch[other_key_name]["y"].push(loss);
				asanai_this.#training_logs_epoch[other_key_name]["mode"] = asanai_this.#get_plotly_type();
				asanai_this.#training_logs_epoch[other_key_name]["name"] = other_key_name;

				this_plot_data.push(asanai_this.#training_logs_epoch[other_key_name]);
			}

			if($("#plotly_epoch_history").length) {
				$("#plotly_epoch_history").show().parent().show();
				if(epochNr == 1) {
					Plotly.newPlot("plotly_epoch_history", this_plot_data, asanai_this.#get_plotly_layout(asanai_this.#tr("epochs")));
				} else {
					Plotly.update("plotly_epoch_history", this_plot_data, asanai_this.#get_plotly_layout(asanai_this.#tr("epochs")));
				}
			}

			await asanai_this.visualize_train();

			var this_plot_data = [asanai_this.#training_logs_batch["loss"]];
			if($("#plotly_batch_history").length && $("#plotly_batch_history").is(":visible")) {
				Plotly.update("plotly_batch_history", this_plot_data, asanai_this.#get_plotly_layout(asanai_this.#tr("batches")));
			}

			if($("#plotly_time_per_batch").length && $("#plotly_time_per_batch").is(":visible")) {
				Plotly.update("plotly_time_per_batch", [asanai_this.#time_per_batch["time"]], asanai_this.#get_plotly_layout(asanai_this.#tr("time_per_batch")));
			}
			asanai_this.#last_batch_plot_time = false;

			if(asanai_this.#training_logs_epoch["loss"].x.length >= 2) {
				var vl = Object.keys(asanai_this.#training_logs_epoch).includes("val_loss") ? asanai_this.#training_logs_epoch["val_loss"].y : null;
				var th = 18;
				var plotCanvas = asanai_this.create_tiny_plot(asanai_this.#training_logs_epoch["loss"].x, asanai_this.#training_logs_epoch["loss"].y, vl, th * 2, asanai_this.#parse_int(0.9 * th));
				$("#tiny_graph").html("");
				$("#tiny_graph").append(plotCanvas).show();
			} else {
				$("#tiny_graph").html("").hide();
			}
			$("#network_has_seen_msg").show();

			asanai_this.#confusion_matrix_to_page(); // async not possible

			asanai_this.#confusion_matrix_and_grid_cache = {};

			await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);

			if(await asanai_this.#input_shape_is_image()) {
				await asanai_this.#redo_what_has_to_be_redone()
			}

			if ("onEpochEnd" in _callbacks) { _callbacks["onEpochEnd"](); }
		};

		callbacks["onTrainEnd"] = async function () {
			asanai_this.#confusion_matrix_and_grid_cache = {};
			asanai_this.#favicon_default();
			await asanai_this.#write_model_to_latex_to_page(1, 1, asanai_this);
			asanai_this.#set_document_title(asanai_this.#original_title);

			$("#tiny_graph").hide();

			$("#network_has_seen_msg").hide();

			asanai_this.#confusion_matrix_to_page(); // async not possible

			//await reset_data();

			asanai_this.#confusion_matrix_and_grid_cache = {};

			if ("onTrainEnd" in _callbacks) { _callbacks["onTrainEnd"](); }
		};

		return callbacks;
	}

	#human_readable_time(seconds, start="", end="") {
		if (!seconds) {
			return this.#tr("one_second");
		}

		if(seconds > 86400 * 365) {
			var params = [];
			if(start != "") {
				params.push("Start:");
				params.push(start);
			}

			if(end != "") {
				params.push("End:");
				params.push(end);
			}

			this.wrn("[human_readable_time] Seconds is very large:", seconds, "Please check the source of that", params);
			console.trace();

			return null;
		}

		var levels = [
			[Math.floor(seconds / 31536000), this.#tr("years")],
			[Math.floor((seconds % 31536000) / 86400), this.#tr("days")],
			[Math.floor(((seconds % 31536000) % 86400) / 3600), this.#tr("hours")],
			[Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), this.#tr("minutes")],
			[(((seconds % 31536000) % 86400) % 3600) % 60, this.#tr("seconds")],
		];

		var returntext = "";

		if (levels[0][0] !== 0) {
			returntext += levels[0][0] + " " + (levels[0][0] === 1 ? levels[0][1].substr(0, levels[0][1].length - 1) : levels[0][1]);
		}

		if (levels[1][0] !== 0) {
			if (returntext) {
				returntext += ", ";
			}
			returntext += levels[1][0] + " " + (levels[1][0] === 1 ? levels[1][1].substr(0, levels[1][1].length - 1) : levels[1][1]);
		}

		if (levels[2][0] !== 0) {
			if (returntext) {
				returntext += ", ";
			}
			returntext += levels[2][0] + " " + (levels[2][0] === 1 ? levels[2][1].substr(0, levels[2][1].length - 1) : levels[2][1]);
		}

		if (levels[3][0] !== 0) {
			if (returntext) {
				returntext += ", ";
			}
			returntext += levels[3][0] + " " + (levels[3][0] === 1 ? levels[3][1].substr(0, levels[3][1].length - 1) : levels[3][1]);
		}

		if (levels[4][0] !== 0) {
			if (returntext) {
				returntext += ", ";
			}
			returntext += levels[4][0] + " " + (levels[4][0] === 1 ? levels[4][1].substr(0, levels[4][1].length - 1) : levels[4][1]);
		}

		return returntext;
	}

	async #confusion_matrix_to_page () {
		var labels = this.get_labels();

		if(!labels && labels.length != 0) {
			return;
		}

		if(!this.#is_classification) {
			return;
		}

		var $confusion_matrix = $(".confusion_matrix");

		if($confusion_matrix.length == 0) {
			this.err(`[confusion_matrix_to_page] .confusion_matrix not found!`);
			return;
		}

		var confusion_matrix_html = await this.#confusion_matrix(labels);

		if(confusion_matrix_html) {
			var str = "<h2>Confusion Matrix:</h2>\n" + confusion_matrix_html;
			$confusion_matrix.html(str);
		} else {
			$confusion_matrix.html("");
		}
	}

	async #confusion_matrix(classes) {
		if(!Array.isArray(classes)) {
			this.err(`[confusion_matrix] classes is not an Array but ${typeof(classes)}`);
			return "";
		}

		if(!classes.length) {
			if(this.#current_epoch < 2) {
				this.wrn("[confusion_matrix] No classes found");
			}
			return "";
		}

		if(!this.#is_classification) {
			this.wrn("[confusion_matrix] Only works with classification");
			return "";
		}

		if(!this.#model) {
			this.wrn("[confusion_matrix] model not defined. Cannot continue");
		}
		
		var $find_images_here = $("#" + this.#image_url_tensor_div);
		if($find_images_here.length == 0) {
			this.err(`[confusion_matrix] #${this.#image_url_tensor_div} cannot be found!`);
			return;
		}
		var imgs = $find_images_here.find("img,canvas");

		if(!imgs.length) {
			if(this.#current_epoch == 1) {
				this.wrn("[confusion_matrix] No images found");
			}

			return "";
		}

		var table_data = {};
		
		var num_items = 0;

		this.nr_images_per_category = {};

		for (var i = 0; i < imgs.length; i++) {
			var img_elem = imgs[i];
			var img_elem_xpath = this.get_element_xpath(img_elem);

			var predicted_tensor = this.#confusion_matrix_and_grid_cache[img_elem_xpath];

			if(!predicted_tensor) {
				var asanai_this = this;
				var img_tensor = this.tidy(() => {
					try {
						var predicted_tensor = asanai_this.#expand_dims(asanai_this.#resizeImage(asanai_this.from_pixels(img_elem), [asanai_this.#model_height, asanai_this.#model_width]));
						predicted_tensor = asanai_this.divNoNan(predicted_tensor, asanai_this.#divide_by);
						return predicted_tensor;
					} catch (e) {
						this.err(e);
						return null;
					}
				});

				if(img_tensor === null) {
					this.wrn("[confusion_matrix] Could not load image from pixels from this element:", img_elem);
					await this.dispose(img_tensor);
					continue;
				}

				try {
					var asanai_this = this;
					predicted_tensor = this.tidy(() => {
						return asanai_this.#model.predict(img_tensor);
					});

					predicted_tensor = this.tidy(() => {
						var _res = asanai_this.array_sync(predicted_tensor)[0];
						asanai_this.dispose(predicted_tensor); // await not possible
						return _res;
					});

					this.#confusion_matrix_and_grid_cache[img_elem_xpath] = predicted_tensor;
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					this.dbg("Cannot predict image: " + e);

					await this.dispose(img_tensor);
					await this.dispose(predicted_tensor);

					continue;
				}
			}

			//console.log("cached: ", predicted_tensor);

			if(!predicted_tensor) {
				this.err(`[confusion_matrix] Could not get predicted_tensor`);
				continue;
			}

			if(!predicted_tensor) {
				this.dbg("predicted_tensor is empty");

				await this.dispose(img_tensor);
				await this.dispose(predicted_tensor);

				continue;
			}


			this.assert(Array.isArray(predicted_tensor), `predicted_tensor is not an array, but ${typeof(predicted_tensor)}, ${JSON.stringify(predicted_tensor)}`);

			if(predicted_tensor === null || predicted_tensor === undefined) {
				this.dbg("Predicted tensor was null or undefined");
				continue;
			}

			var predicted_index = predicted_tensor.indexOf(Math.max(...predicted_tensor));
			var predicted_category = this.get_labels()[predicted_index];

			this.assert(typeof(predicted_category) == "string", "predicted_category is not of type string");

			var src = img_elem.src;
			var correct_category = decodeURI(this.#extractCategoryFromURL(src, img_elem));

			if(Object.keys(this.nr_images_per_category).includes(correct_category)) {
				this.nr_images_per_category[correct_category]++;
			} else {
				this.nr_images_per_category[correct_category] = 1;
			}

			if(!Object.keys(table_data).includes(correct_category)) {
				table_data[correct_category] = {};
			}

			if(Object.keys(table_data[correct_category]).includes(predicted_category)) {
				table_data[correct_category][predicted_category]++;
			} else {
				table_data[correct_category][predicted_category] = 1;
			}

			//console.log("xpath:", img_elem_xpath, "predicted_index:", predicted_index, "category", predicted_category);

			await this.dispose(img_tensor);
			await this.dispose(predicted_tensor);

			num_items++;
		}

		//log("inside asanai.js, this.nr_images_per_category:", this.nr_images_per_category)

		if(!num_items) {
			this.wrn("[confusion_matrix] Could not get any items!");
			return "";
		}

		var str = `<table class="confusion_matrix_table">` ;
		for (var i = 0; i <= classes.length; i++) {
			var class_vertical = classes[i - 1];

			if(i == 0) {
				str += `<tr>`;
				str += `<th class='confusion_matrix_tx' style='text-align: right'><i>${this.#tr("correct_category")}</i> &rarr;<br><i>${this.#tr("predicted_category")}</i> &darr;</th>`;
				for (var j =  0; j < classes.length; j++) {
					str += `<th class='confusion_matrix_tx'>${classes[j]}</th>`;
				}
				str += `</tr>`;
			} else {
				str += `<tr>`;
				for (var j =  0; j <= classes.length; j++) {
					var class_horizontal = classes[j - 1];

					if(j == 0) {
						str += `<th class="confusion_matrix_tx">${class_vertical}</th>`;
					} else {
						var text = `0`; // `${class_vertical} &mdash; ${class_horizontal}`;
						if(Object.keys(table_data).includes(class_vertical) && Object.keys(table_data[class_vertical]).includes(class_horizontal)) {
							text = table_data[class_vertical][class_horizontal];
						} else {
							if (!Object.keys(table_data).includes(class_vertical)) {
								table_data[class_vertical] = {};
							}

							if (!Object.keys(table_data[class_vertical]).includes(class_horizontal)) {
								table_data[class_vertical][class_horizontal] = 0;
							}

							table_data[class_vertical][class_horizontal] = 0;
						}

						var green = "#83F511";
						var red = "#F51137";

						var default_zero = `<td class="confusion_matrix_tx">${text}</td>`;

						if(class_vertical == class_horizontal) {
							if(text == `0`) {
								str += default_zero;
							} else {
								str += `<td class="confusion_matrix_tx" style='background-color: ${green}'>${text}</td>`;
							}
						} else {
							if(text == `0`) {
								str += default_zero;
							} else {
								str += `<td class="confusion_matrix_tx"style='background-color: ${red}'>${text}</td>`;
							}
						}
					}
				}
				str += `</tr>`;
			}
		}
		str += `</table>`;

		this.confusion_matrix_data = table_data;

		return str;
	}

	async fit (_x, _y, args={}, _plotly_data={}, _callbacks={}) {
		if(!Object.keys(args).length) {
			this.err(`[fit]: third argument, args, seems to be empty. Must at least contain epochs and batchSize`);
			return;
		}

		if(!Object.keys(args).includes("epochs")) {
			this.err(`[fit]: third argument, args, seems not to contain epochs. Must at least contain epochs and batchSize`);
			return;
		} else {
			if(this.#looks_like_number(args["epochs"])) {
				this.#max_epoch = this.#parse_int(args["epochs"]);
			} else {
				this.err(`Epochs does not look like a number`);
				return;
			}
		}

		if(!Object.keys(args).includes("batchSize")) {
			this.err(`[fit]: third argument, args, seems not to contain batchSize. Must at least contain epochs and batchSize`);
			return;
		}

		if(!this.#model) {
			this.err(`[fit] Cannot continue without a loaded model`);
			return;
		}

		if(!this.#model.layers) {
			this.err(`[fit] Cannot continue with a model without layers`);
			return;
		}

		if(this.#model.input.shape.length != _x.shape.length) {
			this.err(`[fit] Cannot fit, because the input shape of the model [${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}] differs from _x.shape [${_y.shape.map(item => item === null ? "null" : item).join(", ")}] in length`);
			return;
		} else {
			var mis = this.#model.input.shape;
			var xs = _x.shape;

			var matches = true;

			for (var k = 1; k < xs.length; k++) {
				if(mis[k] != xs[k]) {
					matches = false;
				}
			}

			if(!matches) {
				this.err(`[fit] Cannot fit, because the input shape of the model [${this.#model.input.shape.map(item => item === null ? "null" : item).join(", ")}] differs from _x.shape [${_x.shape.map(item => item === null ? "null" : item).join(", ")}]`);
				return;
			}
		}

		if(this.#model.output.shape.length != _y.shape.length) {
			this.err(`[fit] Cannot fit, because the output shape of the model [${this.#model.output.shape.map(item => item === null ? "null" : item).join(", ")}] differs from _y.shape [${_y.shape.map(item => item === null ? "null" : item).join(", ")}] in length`);
			return;
		} else {
			var mos = this.#model.output.shape;
			var ys = _y.shape;

			var matches = true;

			for (var k = 1; k < ys.length; k++) {
				if(mos[k] != ys[k]) {
					matches = false;
				}
			}

			if(!matches) {
				this.err(`[fit] Cannot fit, because the output shape of the model [${this.#model.output.shape.map(item => item === null ? "null" : item).join(", ")}] differs from _y.shape [${_y.shape.map(item => item === null ? "null" : item).join(", ")}]`);
				return;
			}
		}

		if(Object.keys(_plotly_data).length) {
			if(Object.keys(_plotly_data).includes("div")) {
				if(!$("#" + _plotly_data["div"]).length) {
					this.err(`#${_plotly_data["div"]} could not be found.`);
					return;
				} else {
					this.#plotly_div = _plotly_data["div"];
					args["callbacks"] = this.#_get_callbacks();
				}
			} else {
				this.err(`_plotly_data is defined but does not include div-option`);
			}
		}

		args["callbacks"] = this.#_get_callbacks(_callbacks);

		try {
			this.#started_training = true;


			var asanai_this = this;

			if (typeof(this.#divide_by) == "number" && this.#divide_by != 0 && this.#divide_by != 1) {
				_x = this.tidy(() => {
					var new_x = asanai_this.tf_div(_x, tf.scalar(asanai_this.#divide_by));

					return new_x;
				})
			}

			/*
			console.log("model-fit x:", _x.arraySync());
			console.log("model-fit y:", _y.arraySync());
			*/

			var history = this.#model.fit(_x, _y, args);

			await this.#redo_what_has_to_be_redone(false);

			return history;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			e = "" + e;

			if(e.includes("e is null")) {
				return false;
			} else if(e.includes("Cannot start training because another fit")) {
				this.wrn(`A fit is already ongoing. Can only fit one model at a time.`);
				return false;
			} else {
				this.#started_training = false;
				throw new Error(e);
			}
		}

		this.#started_training = false;
		await this.set_model(this.#model);

		this.#model_is_trained = true;

		return history;
	}

	get_custom_tensors () {
		return this.#custom_tensors;
	}

	tensor_debugger () {
		console.table(this.#custom_tensors);
	}

	is_valid_web_color (color) {
		const webColors = [
			"aquamarine",
			"azure",
			"beige",
			"bisque",
			"black",
			"blue",
			"brown",
			"burlywood",
			"chartreuse",
			"chocolate",
			"coral",
			"cornsilk",
			"crimson",
			"cyan",
			"firebrick",
			"fuchsia",
			"gainsboro",
			"goldenrod",
			"gray",
			"green",
			"honeydew",
			"indigo",
			"ivory",
			"khaki",
			"lavender",
			"lime",
			"linen",
			"magenta",
			"maroon",
			"moccasin",
			"navy",
			"olive",
			"orange",
			"orchid",
			"peru",
			"pink",
			"plum",
			"purple",
			"red",
			"salmon",
			"seashell",
			"sienna",
			"silver",
			"snow",
			"tan",
			"teal",
			"thistle",
			"tomato",
			"turquoise",
			"violet",
			"wheat",
			"white",
			"yellow",
		];

		// Convert the color input to lowercase for case-insensitivity
		const lowerCaseColor = color.toLowerCase();

		if (webColors.includes(lowerCaseColor)) {
			return true;
		}

		const colorRegex = /^(#([0-9a-fA-F]{3}){1,2}|(rgb|hsl)a?\(\s*((\d{1,3}\s*,\s*){2}\d{1,3}|(\d+(\.\d+)?%\s*,\s*){2}\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?|(\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%\s*,\s*\d{1,3}))\s*\))$/;

		if (color.match(colorRegex)) {
			return true;
		}

		return false;
	}

	get_max_bar_color () {
		return this.#max_bar_color;
	}

	get_default_bar_color () {
		return this.#default_bar_color;
	}

	async set_max_bar_color(color) {
		if(this.is_valid_web_color(color)) {
			if(this.get_max_bar_color() != color) {
				this.#max_bar_color = color;
				if(this.#model) {
					await this.set_model(this.#model);
				}

				if(this.get_bar_background_color() == color) {
					this.wrn(`[set_max_bar_color] New max bar color is the same as the background. You will not be able to see max bars.`);
				}
			} else {
				this.wrn(`[set_max_bar_color] Color stayed the same. Not changing.`);
			}
		} else {
			this.err(`[set_max_bar_color] Color "${color}" does not seem to be a valid web color. Valid are names like 'red' or 'green', strings like 'rgb(255, 0, 3)' or hex colors like '#ff0011'`);
		}
	}

	async set_default_bar_color(color) {
		if(this.is_valid_web_color(color)) {
			if(this.get_default_bar_color() != color) {
				this.#default_bar_color = color;
				if(this.#model) {
					await this.set_model(this.#model);
				}

				if(this.get_bar_background_color() == color) {
					this.wrn(`[set_default_bar_color] New default bar color is the same as the background. You will not be able to see default bars.`);
				}
			} else {
				this.wrn(`[set_default_bar_color] Color stayed the same. Not changing.`);
			}
		} else {
			this.err(`[set_default_bar_color] Color "${color}" does not seem to be a valid web color. Valid are names like 'red' or 'green', strings like 'rgb(255, 0, 3)' or hex colors like '#ff0011'`);
		}
	}

	get_bar_background_color () {
		return this.#bar_background_color;
	}

	async set_bar_background_color (color) {
		if(this.is_valid_web_color(color)) {
			if(this.get_bar_background_color() != color) {
				this.#bar_background_color = color;
				if(this.#model) {
					await this.set_model(this.#model);
				}

				if(color == this.get_max_bar_color()) {
					this.wrn(`[set_bar_background_color] Max-bar color is the same as background-color. Max bars will not be visible`);
				}

				if(color == this.get_default_bar_color()) {
					this.wrn(`[set_bar_background_color] Default-bar color is the same as background-color. Default bars will not be visible`);
				}
			} else {
				this.wrn(`[set_bar_background_color] Color stayed the same. Not changing.`);
			}
		} else {
			this.err(`[set_bar_background_color] Color "${color}" does not seem to be a valid web color. Valid are names like 'red' or 'green', strings like 'rgb(255, 0, 3)' or hex colors like '#ff0011'`);
		}
	}

	enable_debug () {
		this.#_enable_debug = true;
	}

	disable_debug () {
		this.#_enable_debug = false;
	}

	get_images_to_repredict () {
		return this.#images_to_repredict;
	}

	get_asanai_object_name () {
		return this.#asanai_object_name;
	}

	#set_asanai_object_name (name) {
		this.#asanai_object_name = name;
	}

	show_status_bar () {
		if($("#__status__bar__").length == 1) {
			this.err("[show_status_bar] Status bar element already exists. Not re-initializing it.");
			return;
		}

		if(this.#write_tensors_info_div) {
			this.err("[show_status_bar] Cannot use write_tensors_info and status_bar at the same time. Chose one.");
			return;
		}

		var css = `background-color: ${this.#status_bar_background_color}; `;
		css += `color: ${this.#status_bar_text_color}; `;
		css += `user-select: none; `;
		css += `height: 1.5em; `;
		css += `width: 100%; `;
		css += `position: fixed; `;
		css += `bottom: 0px; `;
		css += `margin: 0px; `;
		css += `border: 1px groove #626262; `;
		css += `z-index: 99; `;
		css += `padding-bottom: 5px; `;

		var $element = $(`<div style='${css}'><span id='__status__bar__log'></span><span style='right: 0px; position: fixed;' id='__status__bar__memory_debuger'></span></div>`);

		$($element).appendTo($("body"));;

		this.write_tensors_info("__status__bar__memory_debuger");

		return $element;
	}

	#get_plotly_layout (name="") {
		var plotly_layout = {
			paper_bgcolor: "rgba(0, 0, 0, 0)",
			plot_bgcolor: "rgba(0, 0, 0, 0)",
			gridcolor: "#7c7c7c",
			font: {
				family: "Courier New, monospace",
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

	#get_plotly_type () {
		return "lines";
	}

	create_tiny_plot(x, y, y_val, w, h) {
		// Check if x and y arrays have the same size
		if (x.length !== y.length) {
			throw new Error("x and y arrays must have the same size");
		}

		if((y_val && y_val.length != x.length) || !y_val) {
			y_val = [];
		}

		// Create a canvas element
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");

		// Define plot parameters

		// Calculate the x-axis scaling factor to fit the entire width
		const xScale = (w - 2) / (x.length - 1);

		// Find the range of y values
		const minY = Math.min(Math.min(...y), Math.min(...y_val));
		const maxY = Math.max(Math.max(...y), Math.max(...y_val));

		// Calculate the y-axis scaling factor
		const yScale = (h - 2) / (maxY - minY);

		// Plot the training loss (in blue)
		ctx.beginPath();
		ctx.strokeStyle = "blue";
		ctx.lineWidth = 2;

		ctx.beginPath();

		for (let i = 0; i < x.length; i++) {
			const xCoord = i * xScale;
			const yCoord = h - (y[i] - minY) * yScale;
			//log("x, y:", xCoord, yCoord);
			//log("h, y, y[i], minY, yScale:", h, y, y[i], minY, yScale, "<<<<<<");
			if (i === 0) {
				ctx.moveTo(xCoord, yCoord);
			} else {
				ctx.lineTo(xCoord, yCoord);
			}
		}

		ctx.stroke();

		if(y_val.length) {
			ctx.beginPath();
			ctx.strokeStyle = "orange";
			for (let i = 0; i < y_val.length; i++) {
				const xCoord = i * xScale;
				const yCoord = h - (y_val[i] - minY) * yScale;
				if (i === 0) {
					ctx.moveTo(xCoord, yCoord);
				} else {
					ctx.lineTo(xCoord, yCoord);
				}
			}
			ctx.stroke();
		}

		return canvas; // Return the canvas element
	}

	#favicon_default() {
		this.#change_favicon("favicon.ico");
	}

	#change_favicon(path) {
		this.assert(typeof (path) == "string", "Path for change_favicon(" + path + ") is not a string, but " + typeof (path));

		var link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement("link");
			link.rel = "icon";
			document.getElementsByTagName("head")[0].appendChild(link);
		}
		link.href = path;
	}

	#can_be_shown_in_latex () {
		if(!this.#model) {
			this.wrn("Hiding Math tab because there is no this.#model. This might be a bug.");
			return false;
		}

		if(!Object.keys(this.#model).includes("layers")) {
			this.dbg("model does not include layers. Cannot be shown in LaTeX");
			return false;
		}

		if(!Object.keys(this.#model["layers"]).includes("0")) {
			this.dbg("model does not include layers. Cannot be shown in LaTeX");
			return false;
		}

		/*
		if(this.#model.layers[0].input.shape.length != 2) {
			return false;
		}
		*/

		/*
		if(this.#model.layers[this.#model.layers.length - 1].input.shape.length != 2) {
			this.log("Hiding math tab because the output tensor has too many dimensions. It has " + this.#model.layers[this.#model.layers.length - 1].input.shape.length + ". Must be 2.");
			return false;
		}
		*/

		for (var i = 0; i < this.#model.layers.length; i++) {
			var this_layer_type = this.#model.layers[i].getClassName().toLowerCase();
			var valid_layers = [
				"conv2d",
				"dense",
				"flatten",
				"reshape",
				"elu",
				"leakyrelu",
				"relu",
				"softmax",
				"thresholdedrelu",
				"dropout",
				"batchnormalization",
				"debuglayer",
				"gaussiannoise"
			];
			if(!(valid_layers.includes(this_layer_type))) {
				this.log("Hiding math tab because " + this_layer_type + " is not in " + valid_layers.join(", "));
				return false;
			}
		}

		return true;
	}

	model_to_latex (asanai_this = this) {
		var layers = this.#model.layers;

		var input_shape = this.#model.layers[0].input.shape;

		var output_shape = this.#model.layers[this.#model.layers.length - 1].outputShape;

		var activation_function_equations = {
			"sigmoid": {
				"equation": "\\mathrm{sigmoid}\\left(x\\right) = \\sigma\\left(x\\right) = \\frac{1}{1+e^{-x}}",
				"equation_no_function_name": "\\sigma\\left(REPLACEME\\right) = \\frac{1}{1+e^{-REPLACEME}}",
				"lower_limit": 0,
				"upper_limit": 1,
				"math_ml": 1
			},
			"tanh": {
				"equation": "\\mathrm{tanh}\\left(x\\right) = \\frac{e^x-e^{-x}}{e^x+e^{-x}}",
				"equation_no_function_name": "\\frac{e^REPLACEME-e^{-REPLACEME}}{e^REPLACEME+e^{-REPLACEME}}",
				"lower_limit": -1,
				"upper_limit": 1
			},
			"relu": {
				"equation": "\\mathrm{relu}\\left(x\\right) = \\mathrm{max}\\left(0, x\\right)",
				"equation_no_function_name": "\\mathrm{max}\\left(0, REPLACEME\\right)",
				"lower_limit": 0
			},
			"thresholdedReLU": {
				"equation": "\\mathrm{thresholdedReLU}\\left(x\\right) = \\begin{cases}\nx & x > \\theta \\\\ \n 0 & \\mathrm{otherwise}\n\\end{cases}\n",
				"equation_no_function_name": "\\begin{cases}\nx & x > \\theta \\\\ \n 0 & \\mathrm{otherwise}\n\\end{cases}\n"
			},
			"LeakyReLU": {
				"equation": "\\mathrm{LeakyReLU}\\left(x\\right) = \\mathrm{max}\\left(\\alpha \\cdot x, x\\right)",
				"equation_no_function_name": "\\mathrm{max}\\left(ALPHAREPL \\cdot REPLACEME, REPLACEME\\right)"
			},
			"elu": {
				"equation": "\\mathrm{elu}\\left(x\\right) = \\left\\{\n\\begin{array}{ll}\nx & x \\geq 0 \\\\\n\\alpha\\left(e^x - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right.",
				"equation_no_function_name": "\\left\\{\n\\begin{array}{ll}\nREPLACEME & REPLACEME \\geq 0 \\\\\n\\alpha\\left(e^REPLACEME - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right."
			},
			"softplus": {
				"equation": "\\mathrm{softplus}\\left(x\\right) = \\ln\\left(1 + e^x\\right)",
				"equation_no_function_name": "\\ln\\left(1 + e^REPLACEME\\right)",
				"lower_limit": 0
			},
			"softmax": {
				"equation": "\\mathrm{softmax}\\left(x\\right) = \\frac{e^{z_j}}{\\sum^K_{k=1} e^{z_k}}",
				"equation_no_function_name": "\\frac{e^{z_j}}{\\sum^K_{k=1} e^{z_k}}",
				"lower_limit": 0,
				"upper_limit": 1,
			},
			"softsign": {
				"equation": "\\mathrm{softsign}\\left(x\\right) = \\frac{x}{\\left(1 + \\left| x \\right| \\right)}",
				"equation_no_function_name": "\\frac{REPLACEME}{\\left(1 + \\left| REPLACEME \\right| \\right)}",
				"lower_limit": -1,
				"upper_limit": 1
			},
			"selu": {
				"equation": "\\mathrm{selu}\\left(x\\right) = \\mathrm{scale} \\cdot \\mathrm{elu}\\left(x, \\alpha\\right) = \\mathrm{scale} \\cdot \\left\\{\n\\begin{array}{ll}\nx & x \\geq 0 \\\\\n\\alpha\\left(e^x - 1\\right)& \\, x \\lt 0 \\\\\n\\end{array}\n\\right.",
				"equation_no_function_name": "\\mathrm{scale} \\cdot \\left\\{\n\\begin{array}{ll}\nREPLACEME & REPLACEME \\geq 0 \\\\\n\\alpha\\left(e^REPLACEME - 1\\right)& \\, REPLACEME \\lt 0 \\\\\n\\end{array}\n\\right."
			},
			"relu6": {
				"equation": "\\mathrm{relu6}\\left(x\\right) = \\mathrm{min}\\left(\\mathrm{max}\\left(0, x\\right),6\\right)",
				"equation_no_function_name": "\\mathrm{min}\\left(\\mathrm{max}\\left(0, REPLACEME\\right),6\\right)",
				"lower_limit": 0,
				"upper_limit": 6
			}
		};

		var loss_equations = {
			"meanAbsoluteError": "\\mathrm{MAE} = \\frac{1}{n} \\sum_{i=1}^n \\left|y_i - \\hat{y}_i\\right|",
			"meanSquaredError": "\\mathrm{MSE} = \\frac{1}{n} \\sum_{i=1}^n \\left(y_i - \\hat{y}_i\\right)^2",
			"rmse": "\\mathrm{RMSE} = \\sqrt{\\mathrm{MSE}} = \\sqrt{\\frac{1}{n} \\sum_{i=1}^n \\left(y_i - \\hat{y}_i\\right)^2}",
			"categoricalCrossentropy": "\\text{Categorical Crossentropy:} -\\sum_{i=1}^n y_i \\log\\left(\\hat{y}_i\\right)",
			"binaryCrossentropy": "\\text{Binary Crossentropy:} -\\frac{1}{n} \\sum_{i=1}^n y_i \\cdot \\log\\left(\\hat{y}_i\\right) + 1\\left(-y_i\\right) \\cdot \\log\\left(1 - \\hat{y}_i\\right)",
			"meanSquaredLogarithmicError": "\\text{Mean Squared Logarithmic Error:} \\frac{1}{n} \\sum_{i=0}^n \\left(log\\left(y_i + 1\\right)- \\log\\left(\\hat{y}_i + 1\\right)\\right)^2",
			"poisson": "\\text{Poisson:} \\frac{1}{n} \\sum_{i=0}^n \\left(\\hat{x}_i - y_i\\cdot \\log\\left(\\hat{y}_i\\right)\\right)",
			"squaredHinge": "\\text{Squared Hinge:} \\sum_{i=0}^n \\left(\\mathrm{max}\\left(0, 1 - y_i \\cdot \\hat{y}_i\\right)^ 2\\right)",
			"logcosh": "\\text{logcosh:} \\sum_{i=0}^n \\log(\\cosh\\left(\\hat{y}_i - y_i\\right))",
			"meanAbsolutePercentageError": "\\text{MAPE} = \\frac{1}{n} \\sum_{t=1}^{n} \\left|\\frac{\\hat{y} - y}{\\hat{y}}\\right|"
		};

		var default_vars = {
			"g": {
				"name": "Gradient estimate"
			},
			"nabla_operator": {
				"name": "Nabla-Operator (Vector of partial derivatives), 3d example: ",
				"value": "\\begin{align} \\begin{bmatrix} \\frac{\\partial}{\\partial x} \\\\ \\frac{\\partial}{\\partial y} \\\\ \\frac{\\partial}{\\partial z} \\end{bmatrix} \\end{align}"
			},
			"theta": {
				"name": "Weights"
			},
			"eta": {
				"name": "Learning rate",
				"origin": "asanai_this.#learning_rate"
			},
			"epsilon": {
				"name": "Epsilon",
				"origin": "asanai_this.#epsilon"
			}
		};

		var optimizer_equations = {
			"sgd": {
				"equations": [
					"g = \\nabla_{\\theta}J(\\theta; x, y)",
					"\\Delta\\theta = -\\eta \\cdot g",
					"\\theta = \\theta + \\Delta\\cdot g"
				],
				"dependencies": [],
				"variables": {
					"\\eta": {
						"name": "Learning rate",
						"origin": "asanai_this.#learning_rate"
					},
					"\\theta": default_vars["theta"],
					"\\nabla": default_vars["nabla_operator"],
					"J": {
						"name": "Loss function"
					},
					"g": {
						"name": "Gradient"
					},
					"x": {
						"name": "Input values"
					},
					"y": {
						"name": "Output values"
					}
				}
			},
			"momentum": {
				"equations": [
					"\\Delta\\theta_t = -\\gamma v_{t-1} - \\eta g_t"
				],
				"dependencies": [],
				"variables": {
					"\\eta": default_vars["eta"],
					"\\theta": default_vars["theta"]
				}
			},
			"nag": {
				"equations": [
					"\\Delta\\theta_t = -\\gamma v_{t-1} - \\eta \\nabla_\\theta J(\\theta - \\gamma v_{t-1})"
				],
				"dependencies": [],
				"variables": {
					"\\theta": default_vars["theta"],
					"\\nabla": default_vars["nabla_operator"],
					"\\eta": default_vars["eta"],
				}
			},
			"adagrad": {
				"equations": [
					"\\Delta\\theta = - \\frac{\\eta}{\\sqrt{G}} \\bigodot g"
				],
				"dependencies": [],
				"variables": {
					"\\eta": default_vars["eta"],
					"g": default_vars["g"],
					"\\theta": default_vars["theta"]
				}
			},
			"adadelta": {
				"equations": [
					"\\Delta\\theta_t = - \\frac{\\mathrm{rmsprop}\\left[\\Delta\\theta\\right]_{t-1}}{\\mathrm{rmsprop}\\left[g_t\\right]}g_t"
				],
				"dependencies": ["rmsprop"],
				"variables": {
					"\\eta": default_vars["eta"],
					"g": default_vars["g"],
					"g_t": {
						"name": "Gradient at time t along } \\theta^j \\text{ "
					},
					"\\theta": default_vars["theta"],
					"\\epsilon": default_vars["epsilon"]
				}
			},
			"adamax": {
				"equations": [
					"\\theta = \\theta + \\alpha \\sum^m_{i=1}\\left(y^\\left(i\\right) - h_\\theta\\left(x^{\\left(i\\right)}\\right)\\right)x^{\\left(i\\right)}, \\quad \\text{Repeat until converge}"
				],
				"dependencies": [],
				"variables": {
					"\\theta": default_vars["theta"],
					"\\alpha": {
						"name": "Initial accumulator value"
					}
				}
			},
			"rmsprop": {
				"equations": [
					"\\Delta\\theta = - \\frac{\\eta}{\\sqrt{E\\left[g²\\right]+\\epsilon}}"
				],
				"dependencies": [],
				"variables": {
					"g": default_vars["g"],
					"\\eta": default_vars["eta"],
					"\\epsilon": default_vars["epsilon"]
				}
			},
			"adam": {
				"equations": [
					"v_t = \\beta_1 * \\cdot v_{t - 1} - \\left(1 - \\beta_1\\right) * g_t",
					"s_t = \\beta_2 * \\cdot s_{t - 1} - \\left(1 - \\beta_2\\right) * g^2_t",
					"\\Delta\\theta = - \\eta\\frac{v_t}{\\sqrt{s_t+\\epsilon}} * g_t",
					"\\theta_{t+1} = \\theta_t + \\Delta\\theta_t"
				],
				"dependencies": [],
				"variables": {
					"\\theta": {
						"name": "Weights"
					},
					"\\eta": default_vars["eta"],
					"\\epsilon": default_vars["epsilon"],
					"g_t": {
						"name": "Gradient at time t along } \\theta^j \\text{ "
					},
					"v_t": {
						"name": "Exponential average of gradients along }\\theta_j \\text{ "
					},
					"s_t": {
						"name": "Exponential average of squares of gradients along }\\theta_j \\text{ "
					},
					"\\beta_1, \\beta_2": {
						"name": "Hyperparameter"
					}
				}
			}
		};

		var activation_string = "";
		var str = "";
		var layer_data = this.#get_layer_data();

		var y_layer = [];

		for (var i = 0; i < output_shape[1]; i++) {
			y_layer.push(["y_{" + i + "}"]);
		}

		var colors = [];
		if(asanai_this.#prev_layer_data.length) {
			colors = this.#color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(asanai_this.#prev_layer_data)), JSON.parse(JSON.stringify(layer_data)));
		} else {
			colors = this.#color_compare_old_and_new_layer_data(JSON.parse(JSON.stringify(layer_data)), JSON.parse(JSON.stringify(layer_data)));
		}

		var input_layer = [];

		for (var i = 0; i < input_shape[1]; i++) {
			input_layer.push(["x_{" + i + "}"]);
		}

		var shown_activation_equations = [];

		for (var i = 0; i < this.#model.layers.length; i++) {
			var this_layer_type = this.#model.layers[i].getClassName().toLowerCase();
			if(i == 0) {
				str += "<h2>Layers:</h2>";
			}

			str += "<div class='temml_me'> \\text{Layer " + i + " (" + this_layer_type + "):} \\qquad ";

			if(this_layer_type == "dense") {
				var activation_name = this.#model.layers[i].activation.constructor.className;

				if(activation_name == "linear") {
					//
				} else if(Object.keys(activation_function_equations).includes(activation_name)) {
					if(!shown_activation_equations.includes(activation_name)) {
						var this_activation_string = activation_function_equations[activation_name]["equation"];

						var this_activation_array = [];

						if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
							this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
						}

						if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
							this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
						}

						if(this_activation_array.length) {
							this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
						}

						activation_string += "<div class='temml_me'>" + this_activation_string + "</div><br>\n";

						shown_activation_equations.push(activation_name);
					}
				} else {
					this.err("Activation name '" + activation_name + "' not found");
				}

				var activation_start = "";

				if(activation_name != "linear") {
					activation_start = "\\mathrm{\\underbrace{" + activation_name + "}_{\\mathrm{Activation}}}\\left(";
				}

				var kernel_name = "\\text{Weight Matrix}^{" + asanai_this.#array_size(layer_data[i].kernel).join(" \\times ") + "}";

				if(i == layer_data.length - 1) {
					str += asanai_this.#array_to_latex(y_layer, "Output") + " = " + activation_start;
					if(i == 0) {
						str += asanai_this.#a_times_b(asanai_this.#array_to_latex(input_layer, "Input"), asanai_this.#array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
					} else {
						var repeat_nr = i - 1;
						if(repeat_nr < 0) {
							repeat_nr = 0;
						}
						str += asanai_this.#a_times_b(asanai_this.#_get_h(repeat_nr), asanai_this.#array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
					}
				} else {
					str += asanai_this.#_get_h(i) + " = " + activation_start;
					if(i == 0) {
						str += asanai_this.#a_times_b(asanai_this.#array_to_latex(input_layer, "Input"), asanai_this.#array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
					} else {
						str += asanai_this.#a_times_b(asanai_this.#_get_h(i - 1), asanai_this.#array_to_latex_color(layer_data[i].kernel, kernel_name, colors[i].kernel));
					}
				}

				try {
					if("bias" in layer_data[i] && layer_data[i].bias.length) {
						str += " + " + asanai_this.#array_to_latex_color([layer_data[i].bias], "Bias", [colors[i].bias], 1);
					}
				} catch (e) {
					asanai_this.err(e);
				}

				if(activation_name != "linear") {
					str += "\\right)";
				}
			} else if (this_layer_type == "flatten") {
				var original_input_shape = JSON.stringify(this.#model.layers[i].getInputAt(0).shape.filter(Number));
				var original_output_shape = JSON.stringify(this.#model.layers[i].getOutputAt(0).shape.filter(Number));
				str += this.#_get_h(i) + " = " + this.#_get_h(i == 0 ? 0 : i - 1) + " \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
			} else if (this_layer_type == "reshape") {
				var original_input_shape = JSON.stringify(this.#model.layers[i].getInputAt(0).shape.filter(Number));
				var original_output_shape = JSON.stringify(this.#model.layers[i].getOutputAt(0).shape.filter(Number));
				var general_reshape_string = "_{\\text{Shape: " + original_input_shape + "}} \\xrightarrow{\\text{Reshape}} \\text{New Shape: }" + original_output_shape;
				if(i > 1) {
					str += this.#_get_h(i) + " = " + this.#_get_h(i - 1) + general_reshape_string;
				} else {
					str += this.#array_to_latex(input_layer, "Input") + " = h" + general_reshape_string;
				}
			} else if (["elu", "leakyReLU", "reLU", "softmax", "thresholdedReLU"].includes(this_layer_type)) {
				var activation_name = this_layer_type;
				if(activation_name == "leakyReLU") {
					activation_name = "LeakyReLU";
				} else if(activation_name == "reLU") {
					activation_name = "relu";
				}

				var prev_layer_name = "";

				if(i == 0) {
					prev_layer_name += this.#array_to_latex(input_layer, "Input");
				} else {
					prev_layer_name += this.#_get_h(i - 1);
				}

				if(i == layer_data.length - 1) {
					str += this.#array_to_latex(y_layer, "Output") + " = ";
				} else {
					str += this.#_get_h(i) + " = ";
				}

				if(Object.keys(activation_function_equations).includes(activation_name)) {
					var this_activation_string = activation_function_equations[activation_name]["equation_no_function_name"];

					this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

					var alpha = asanai_this.#parse_float(this.#get_item_value(i, "alpha"));
					if(typeof(alpha) == "number") {
						this_activation_string = this_activation_string.replaceAll("ALPHAREPL", "{" + alpha + "}");
						this_activation_string = this_activation_string.replaceAll("\\alpha", "\\underbrace{" + alpha + "}_{\\alpha} \\cdot ");
					}

					var theta = asanai_this.#parse_float(this.#get_item_value(i, "theta"));
					if(typeof(theta) == "number") {
						this_activation_string = this_activation_string.replaceAll("\\theta", "{\\theta = " + theta + "} \\cdot ");
					}

					var max_value_item = $($(".layer_setting")[i]).find(".max_value");

					this_activation_string = this_activation_string.replaceAll("REPLACEME", "{" + prev_layer_name + "}");

					var this_activation_array = [];

					if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
						this_activation_array.push("\\text{Lower-limit: } " + activation_function_equations[activation_name]["lower_limit"]);
					}

					if(Object.keys(activation_function_equations[activation_name]).includes("upper_limit")) {
						this_activation_array.push("\\text{Upper-limit: } " + activation_function_equations[activation_name]["upper_limit"]);
					}

					if(max_value_item.length) {
						var max_value = max_value_item.val();
						this_activation_array.push("\\text{Capped at maximally " + max_value + "}");
					}

					if(this_activation_array.length) {
						this_activation_string = this_activation_string + "\\qquad (" + this_activation_array.join(", ") + ")";
					}

					str += this_activation_string + "\n";
				} else {
					//log("Activation name '" + activation_name + "' not found");
				}
			} else if (this_layer_type == "batchNormalization") {
				// not used
				//x* = (x - E[x]) / sqrt(var(x))

				var prev_layer_name = "";

				var outname = "";

				if(i == layer_data.length - 1) {
					outname = this.#array_to_latex(y_layer, "Output") + " \\longrightarrow ";
				} else {
					outname += this.#_get_h(i) + " \\longrightarrow ";
				}

				var mini_batch_mean = "\\underbrace{\\mu_\\mathcal{B} = \\frac{1}{n} \\sum_{i=1}^n x_i}_{\\text{Batch mean}}";

				var mini_batch_variance = "\\underbrace{\\sigma_\\mathcal{B}^2 = \\frac{1}{n} \\sum_{i = 1}^n \\left(x_i - \\mu_\\mathcal{B}\\right)^2}_{\\text{Batch variance}}";

				var x_equation = "\\overline{x_i} \\longrightarrow \\underbrace{\\frac{x_i - \\mu_\\mathcal{B}}{\\sqrt{\\sigma_\\mathcal{B}^2 + \\epsilon \\left( = " + this.#model.layers[i].epsilon + "\\right)}}}_\\text{Normalize}";

				var beta_string = "";
				var gamma_string = "";
				if("beta" in layer_data[i]) {
					beta_string = array_to_latex_matrix(asanai_this.#array_to_fixed(layer_data[i].beta, this.#parse_int($("#decimal_points_math_mode").val())));
					beta_string = "\\displaystyle " + beta_string;
				}
				if("gamma" in layer_data[i]) {
					gamma_string = array_to_latex_matrix(asanai_this.#array_to_fixed(layer_data[i].gamma, this.#parse_int($("#decimal_points_math_mode").val())));
					gamma_string = "\\displaystyle " + gamma_string;
				}

				var y_equation = "y_i = \\underbrace{\\underbrace{\\gamma}_{" + gamma_string + "}\\overline{x_i} + \\underbrace{\\beta}_{" + beta_string + "}}_{\\text{Scaling\\&shifting}}";

				var between_equations = ",\\qquad ";
				var skip_between_equations = ",\\\\[10pt]\\\\\n";

				str += "\\begin{array}{c}\n";
				str += "\\displaystyle " + mini_batch_mean + between_equations;
				str += "\\displaystyle " + mini_batch_variance + between_equations;
				str += "\\displaystyle " + x_equation + skip_between_equations;
				str += "\\displaystyle " + outname + y_equation;
				str += "\\end{array}\n";
			} else if (this_layer_type == "dropout") {
				var dropout_rate = asanai_this.#parse_int(asanai_this.#parse_float($($(".layer_setting")[i]).find(".dropout_rate").val()) * 100);
				str += "\\text{Setting " + dropout_rate + "\\% of the input values to 0 randomly}";
			} else if (this_layer_type == "DebugLayer") {
				str += "\\text{The debug layer does nothing to the data, but just prints it out to the developers console.}";
			} else if (this_layer_type == "gaussianNoise") {
				str += "\\text{Adds gaussian noise to the input (only active during training), Standard-deviation: " + this.#get_item_value(i, "stddev") + ".}";
			} else if (this_layer_type == "conv1d") {
				str += this.#_get_h(i + 1) + " = \\sum_{i=1}^{N} \\left( \\sum_{p=1}^{K} " + this.#_get_h(i) + "(x+i, c) \\times \\text{kernel}(p, c, k) \\right) + \\text{bias}(k)";
			} else if (this_layer_type == "conv1d") {
				str += this.#_get_h(i + 1) + "\\sum_{i=1}^{N} \\left( \\sum_{p=1}^{K}" + this.#_get_h(i) + "(x+i, c) \\times \\text{kernel}(p, c, k) \\right) + \\text{bias}(k)";
			} else if (this_layer_type == "conv2d") {
				str += this.#_get_h(i + 1) + " = \\sum_{i=1}^{N} \\sum_{j=1}^{M} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} " + this.#_get_h(i) + "(x+i, y+j, c) \\times \\text{kernel}(p, q, c, k) \\right) + \\text{bias}(k)";
			} else if (this_layer_type == "conv3d") {
				str += this.#_get_h(i + 1) + " \\sum_{i=1}^{N} \\sum_{j=1}^{M} \\sum_{l=1}^{P} \\left( \\sum_{p=1}^{K} \\sum_{q=1}^{L} \\sum_{r=1}^{R} " + this.#_get_h(i) + "(x+i, y+j, z+l, c) \\times \\text{kernel}(p, q, r, c, k) \\right) + \\text{bias}(k)";
			} else if (this_layer_type == "maxPooling1D") {
				str += this.#_get_h(i + 1) + "\\max_{i=1}^{N}" + this.#_get_h(i) + "(x+i)";
			} else if (this_layer_type == "maxPooling2D") {
				str += this.#_get_h(i + 1) + "\\max_{i=1}^{N} \\max_{j=1}^{M} " + this.#_get_h(i) + "(x+i, y+j)";
			} else if (this_layer_type == "maxPooling3D") {
				str += this.#_get_h(i + 1) + "\\max_{i=1}^{N} \\max_{j=1}^{M} \\max_{l=1}^{P} " + this.#_get_h(i) + "(x+i, y+j, z+l)";
			} else {
				str += "\\mathrm{(The equations for this layer are not yet defined)}";
				this.log("Invalid layer type for layer " + i + ": " + this_layer_type);
			}

			str += "</div><br>";
			/*
			if(i != this.#model.layers.length - 1) {
				str += "<hr class='full_width_hr'>";
			}
			*/
		}

		if(Object.keys(loss_equations).includes($("#loss").val())) {
			str += "<h2>Loss:</h2><div class='temml_me'>" + loss_equations[$("#loss").val()] + "</div><br>";
		}

		var optimizer = this.#optimizer;
		if(Object.keys(optimizer_equations).includes(optimizer)) {
			var this_optimizer = optimizer_equations[optimizer];

			var dependencies = this_optimizer["dependencies"];

			str += "<h2>Optimizer:</h2>\n";

			if(this_optimizer.variables) {
				var varnames = Object.keys(this_optimizer.variables);
				//log("a", this_optimizer.variables);
				for (var m = 0; m < varnames.length; m++) {
					//log("b", this_optimizer.variables[varnames[m]]);
					var thisvarname = varnames[m];
					if(!m) {
						str += "<h3>Variables and definitions:</h3>\n";
					}

					var origin = this_optimizer.variables[thisvarname]["origin"];

					str += "<div class='temml_me'> \\displaystyle \\text{" + this_optimizer.variables[thisvarname]["name"] + ": } " + thisvarname;
					if(Object.keys(this_optimizer.variables[thisvarname]).includes("value")) {
						str += " = " + this_optimizer.variables[thisvarname]["value"];
					} else if(origin !== undefined) {
						var valofparam;
						eval(`valofparam = ${origin}`);
						str += " = " + valofparam;
					}
					str += "</div><br>";

					if(Object.keys(this_optimizer.variables).includes("example")) {
						str += "<div class='temml_me'> \\displaystyle " + this_optimizer.variables.example + " </div><br>";
					}
				}

				str += "<h3>Equations for optimizers:</h3>\n";
			}

			for (var m = 0; m < dependencies.length; m++) {
				if(dependencies[m] != optimizer) {
					str += "<div class='temml_me'>\\displaystyle \\text{" + dependencies[m] + ": }" + optimizer_equations[dependencies[m]]["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
				}
			}

			str += "<div class='temml_me'> \\displaystyle \\text{" + optimizer + ": }" + this_optimizer["equations"].join(" </div><br>\n<div class='temml_me'> ") + " </div><br>";
		} else {
			this.err("Unknown optimizer: " + optimizer);
			return;
		}

		this.#prev_layer_data = layer_data;

		if(activation_string && str) {
			return "<h2>Activation functions:</h2> " + activation_string + str;
		} else {
			if(str) {
				return str;
			}
		}

	}

	async #write_model_to_latex_to_page (reset_prev_layer_data, force, asanai_this) {
		if(!this.#math_tab_code_div) {
			//this.err(`math_tab_code_div not defined`);
			return;
		}
		if(!this.#can_be_shown_in_latex()) {
			this.err(`Cannot be shown in LaTeX`);
			return;
		}

		if(!force && $("#math_tab_label").css("display") == "none") {
			return;
		}

		if(reset_prev_layer_data) {
			this.#prev_layer_data = [];
		}

		var latex = this.model_to_latex(asanai_this);

		if(latex) {
			var $math_tab_code = $("#" + this.#math_tab_code_div);
			$math_tab_code.html(latex);

			try {
				var math_tab_code_elem = $math_tab_code[0];

				this.assert(math_tab_code_elem, "math_tab_code_elem could not be found");

				var xpath = this.get_element_xpath(math_tab_code_elem);
				var new_md5 = await this.#md5($(math_tab_code_elem).html());
				var old_md5 = this.#math_items_hashes[xpath];

				if(new_md5 != old_md5 || force || !$math_tab_code.is(":visible")) {
					try {
						await this.#_temml();
					} catch (e) {
						if(!("" + e).includes("assign to property") || ("" + e).includes("s.body[0] is undefined")) {
							this.info("" + e);
						} else if (("" + e).includes("too many function arguments")) {
							this.err("TEMML: " + e);
						} else {
							throw new Error(e);
						}
					}
					this.#math_items_hashes[xpath] = new_md5;
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("can't assign to property")) {
					this.err("failed temml:", e);
				} else {
					this.err(e);
				}
			}
		}

		await this.#_temml();
	}

	#color_compare_old_and_new_layer_data (old_data, new_data) {
		this.assert(old_data.length == new_data.length, "Old data and new data are vastly different. Have you changed the number of layers without resetting prev_layer_data?");

		var default_color = "#ffffff";
		var darkmode = 0;
		if(this.#is_dark_mode) {
			darkmode = 1;
		}

		if(darkmode) {
			default_color = "#353535";
		}

		var color_diff = [];

		for (var layer_nr = 0; layer_nr < old_data.length; layer_nr++) {
			var this_old_layer = old_data[layer_nr];
			var this_new_layer = new_data[layer_nr];

			this.assert(Object.keys(this_old_layer).join(",") == Object.keys(this_new_layer).join(","), "Old data and new data for layer " + layer_nr + " have different length data sets");

			var keys = Object.keys(this_old_layer);

			color_diff[layer_nr] = {};

			for (var key_nr = 0; key_nr < keys.length; key_nr++) {
				var this_key = keys[key_nr];

				if(!(this_old_layer[this_key].length == this_new_layer[this_key].length)) {
					//wrn("Keys are not equal for layer data of " + layer_nr + ", key: " + this_key);
					continue;
				}

				color_diff[layer_nr][this_key] = [];

				var this_old_sub_array = this_old_layer[this_key];
				var this_new_sub_array = this_new_layer[this_key];

				for (var item_nr = 0; item_nr < this_old_sub_array.length; item_nr++) {
					if(Object.keys(this_new_sub_array).includes("" + item_nr)) {
						if(Object.keys(this_old_sub_array).includes("" + item_nr)) {
							var this_new_item = this_new_sub_array[item_nr];
							var this_old_item = this_old_sub_array[item_nr];

							if(typeof(this_old_item) == "number") { // sub array is all numbers
								if(this_old_item == this_new_item) {
									color_diff[layer_nr][this_key][item_nr] = default_color;
								} else {
									if(this_old_item > this_new_item) {
										color_diff[layer_nr][this_key][item_nr] = "#cf1443";
									} else if(this_old_item < this_new_item) {
										color_diff[layer_nr][this_key][item_nr] = "#2E8B57";
									}
								}
							} else if (Array.isArray(this_old_item)) { // sub array contains more arrays (kernels most probably))
								color_diff[layer_nr][this_key][item_nr] = [];
								for (var kernel_nr = 0; kernel_nr < this_old_item.length; kernel_nr++) {
									try {
										if(this_old_item[kernel_nr] == this_new_item[kernel_nr]) {
											color_diff[layer_nr][this_key][item_nr][kernel_nr] = default_color;
										} else {
											if(this_old_item[kernel_nr] > this_new_item[kernel_nr]) {
												color_diff[layer_nr][this_key][item_nr][kernel_nr] = "#cf1443";
											} else if(this_old_item[kernel_nr] < this_new_item[kernel_nr]) {
												color_diff[layer_nr][this_key][item_nr][kernel_nr] = "#2E8B57";
											}
										}
									} catch (e) {
										this.wrn(e);
										console.trace();
									}
								}
							} else {
								this.err(`[color_compare_old_and_new_layer_data] this_old_item is neither a number nor an array.`);
							}
						}
					}
				}
			}

		}

		return color_diff;
	}

	#array_to_latex (array, desc, newline_instead_of_ampersand) {
		var str = "";
		str = "\\underbrace{\\begin{pmatrix}\n";

		var joiner = " & ";
		if(newline_instead_of_ampersand) {
			joiner = " \\\\\n";
		}

		var arr = [];

		for (var i = 0; i < array.length; i++) {
			array[i] = this.#array_to_fixed(array[i], this.#decimal_points_math_mode);
			arr.push(array[i].join(joiner));
		}

		str += arr.join("\\\\\n");

		str += "\n\\end{pmatrix}}";
		if(desc) {
			str += "_{\\mathrm{" + desc + "}}\n";
		}

		return str;
	}

	#a_times_b (a, b) {
		var res = a + " \\times " + b;

		return res;
	}

	#_get_h (i) {
		var res = "h_{\\text{Shape: }" + this.#get_layer_output_shape_as_string(i) + "}" + "'".repeat(i);

		return res;
	}

	#get_layer_data() {
		if(!this.#model) {
			this.wrn("this.#model not found for restart_fcnn");
			return;
		}

		if(!Object.keys(this.#model).includes("layers")) {
			this.wrn("this.#model.layers not found for restart_fcnn");
			return;
		}

		if(this.#model.layers.length == 0) {
			this.err("this.#model.layers.length is 0");
			return;
		}

		var layer_data = [];

		var possible_weight_names = ["kernel", "bias", "beta", "gamma", "moving_mean", "moving_variance"];

		for (var i = 0; i < this.#model.layers.length; i++) {
			var this_layer_weights = {};

			for (var n = 0; n < possible_weight_names.length; n++) {
				this_layer_weights[possible_weight_names[n]] = [];
			}

			try {
				if("weights" in this.#model.layers[i]) {
					for (var k = 0; k < this.#model.layers[i].weights.length; k++) {
						var wname = this.get_weight_name_by_layer_and_weight_index(i, k);
						if(possible_weight_names.includes(wname)) {
							var asanai_this = this;
							this_layer_weights[wname] = this.tidy(() => {
								var __res = asanai_this.array_sync(this.#model.layers[i].weights[k].val);
								var ___res = Array.from(__res);

								asanai_this.dispose(__res);

								return ___res;
							});
						} else {
							this.err("Invalid wname: " + wname);
							this.log(model.layers[i].weights[k]);
						}
					}
				}
			} catch (e) {
				if(("" + e).includes("Tensor is disposed")) {
					this.dbg("Model was disposed during get_layer_data(). This is probably because the model was recompiled during this.");
				} else {
					this.err(e);
				}
			}

			layer_data.push(this_layer_weights);
		}

		return layer_data;
	}

	get_weight_name_by_layer_and_weight_index (layer, index) {
		this.assert(typeof(layer) == "number", layer + " is not a number");
		this.assert(typeof(index) == "number", index + " is not a number");

		var original_name = this.#model.layers[layer].weights[index].name;

		var matches = /^.*\/(.*?)(?:_\d+)?$/.exec(original_name);
		if(matches === null) {
			this.err("matches is null. Could not determine name from " + original_name);
		} else if(1 in matches) {
			return matches[1];
		} else {
			this.err("Could not determine name from " + original_name + ", matches: ");
			this.log(matches);
			console.trace();
		}

		return null;
	}

	#get_layer_output_shape_as_string (i) {
		this.assert(typeof(i) == "number", i + " is not a number");
		this.assert(i < this.#model.layers.length, i + " is larger than " + (this.#model.layers.length - 1));
		if(Object.keys(this.#model).includes("layers")) {
			try {
				var str = this.#model.layers[i].outputShape.toString();
				str = str.replace(/^,|,$/g,"");
				str = "[" + str + "]";
				return str;
			} catch (e) {
				this.err(e);
			}
		} else {
			this.log("Layers not in this.#model");
		}
	}

	#array_size (ar) {
		var row_count = ar.length;
		var row_sizes = [];

		for(var i = 0; i < row_count; i++){
			row_sizes.push(ar[i].length);
		}

		var res = [row_count, Math.min.apply(null, row_sizes)];

		return res;
	}

	#array_to_latex_color (original_array, desc, color=null, newline_instead_of_ampersand=0) {
		if(!color) {
			return this.#array_to_latex(original_array, desc, newline_instead_of_ampersand);
		}

		var array = JSON.parse(JSON.stringify(original_array));
		var str = "\\underbrace{\\begin{pmatrix}\n";

		var joiner = " & ";
		if(newline_instead_of_ampersand) {
			joiner = " \\\\\n";
		}

		var arr = [];

		for (var i = 0; i < array.length; i++) {
			try {
				array[i] = this.#array_to_fixed(array[i], this.#decimal_points_math_mode);
			} catch (e) {
				this.err("ERROR in math mode (e, array, i, color):", e, array, i, color);
			}

			try {
				array[i] = this.#array_to_color(array[i], color[i]);
				arr.push(array[i].join(joiner));
			} catch (e) {
				this.err("ERROR in math mode (e, array, i, color):", e, array, i, color);
			}
		}

		str += arr.join("\\\\\n");

		str += "\n\\end{pmatrix}}";
		if(desc) {
			str += "_{\\mathrm{" + desc + "}}\n";
		}

		return str;
	}

	#array_to_fixed (array, fixnr) {
		if(fixnr == 0) {
			return array;
		}
		var x = 0;
		var len = array.length;
		while(x < len) {
			if(this.#looks_like_number(array[x])) {
				array[x] = this.#parse_float(this.#parse_float(array[x]).toFixed(fixnr));
			}
			x++;
		}

		return array;
	}

	#array_to_color (array, color) {
		var x = 0;
		var len = array.length;
		var new_array = [];
		while(x < len) {
			var this_color = "";

			if(color && Object.keys(color).includes("" + x)) {
				this_color = color[x];
			}

			if(this_color == "#353535" || this_color == "#ffffff" || this_color == "white" || this_color == "black" || !this_color) {
				new_array.push(array[x]);
			} else {
				new_array.push("\\colorbox{" + this_color + "}{" + array[x] + "}");
			}

			x++;
		}

		return new_array;
	}

	async #md5 (content) {
		try {
			var res = await hashwasm.md5(content);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[md5] " + e);
		}
	}

	info (...args) {
		args.forEach(arg => console.info(arg));
	}

	async #_temml () {
		while ($("#temml_blocker").length) {
			await this.delay(200);
		}

		$("<span display='style:none' id='temml_blocker'></span>").appendTo($("body"));
		$(".temml_me").each((i, e) => {
			try {
				if($(e).attr("data-rendered") != 1 && $(e).is(":visible") && e.textContent) {
					var original_latex = e.textContent;

					$(e)[0].innerHTML = "<img src='_gui/loading_favicon.gif' />";

					var tmp_element = $("<span id='tmp_equation' style='display: none'></span>");
					$(tmp_element).appendTo($("body"));

					temml.render(original_latex, tmp_element[0]);

					$(e)[0].innerHTML = tmp_element[0].innerHTML;
					$(e).attr("data-rendered", 1);
					$(e).attr("data-latex", original_latex);

					$("#tmp_equation").remove();

					var asanai_this = this;

					$(e).on("contextmenu", function(ev) {
						ev.preventDefault();
						asanai_this.create_centered_window_with_text(original_latex);
					});
				}
			} catch (e) {
				this.err("" + e);
			}
		});

		$("#temml_blocker").remove();
	}

	create_centered_window_with_text(parameter) {
		$(".math_copier").remove();

		// Create a div for the window
		var windowDiv = document.createElement('div');
		windowDiv.style.position = 'fixed';
		windowDiv.style.top = '50%'; // Center vertically
		windowDiv.style.left = '50%'; // Center horizontally
		windowDiv.style.transform = 'translate(-50%, -50%)'; // Center using transform
		windowDiv.style.width = '300px';
		windowDiv.style.backgroundColor = 'white';
		windowDiv.style.border = '1px solid #ccc';
		windowDiv.style.padding = '10px';
		windowDiv.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.2)';
		windowDiv.classList.add("math_copier");

		// Create the "x" button
		var closeButton = document.createElement('button');
		closeButton.textContent = 'x';
		closeButton.style.position = 'absolute';
		closeButton.style.top = '5px';
		closeButton.style.right = '5px';
		closeButton.style.border = 'none';
		closeButton.style.backgroundColor = 'red';
		closeButton.style.cursor = 'pointer';

		// Create the readonly textarea
		const textarea = document.createElement('textarea');
		textarea.readOnly = true;
		textarea.style.width = '100%';
		textarea.style.height = '200px';
		textarea.textContent = parameter;

		// Create the "Copy to Clipboard" button
		const copyButton = document.createElement('button');
		copyButton.textContent = this.#tr('copy_to_clipboard');
		copyButton.style.width = '100%';
		copyButton.style.marginTop = '10px';

		// Add a click event listener to copy the textarea's content to the clipboard
		copyButton.addEventListener('click', () => {
			textarea.select();
			document.execCommand('copy');
		});

		// Add the textarea, copy button, and close button to the window
		windowDiv.appendChild(closeButton);
		windowDiv.appendChild(textarea);
		windowDiv.appendChild(copyButton);

		// Add an event listener to close the window when the "x" button is clicked
		closeButton.addEventListener('click', () => {
			document.body.removeChild(windowDiv);
		});

		// Append the window to the body to display it
		document.body.appendChild(windowDiv);
	}

	#extractCategoryFromURL(_url, img_elem) {
		if(!_url) {
			this.dbg(`[extractCategoryFromURL] extractCategoryFromURL(${_url})`);
			return null;
		}

		if($(img_elem).data("real_category")) {
			return $(img_elem).data("real_category");
		}

		try {
			const categoryMatch = _url.match(/\/([^/]+)\/[^/]+?$/);

			if (categoryMatch) {
				const category = categoryMatch[1];
				return category;
			} else {
				console.warn("Category not found in the URL:", _url);
				return null; // Or handle the error in your specific way
			}
		} catch (error) {
			this.error("Error while extracting category:", error);
			return null; // Or handle the error in your specific way
		}
	}

	async show_layers_gui (divname=this.#layers_gui_div_name) {
		if(!this.#model) {
			this.err("Cannot show layers gui when no model is loaded.");
			return;
		}
		
		if(!divname) {
			this.err(`No divname given! Cannot continue show_layers_gui without divname parameter`);
			return;
		}

		if(typeof(divname) != "string") {
			this.err(`divname is not a string, but ${typeof(divname)}! Cannot continue show_layers_gui without divname being a valid string that refers to the ID of an element`);
			return;
		}

		if(!$("#" + divname).length) {
			this.err(`Cannot find #${divname} for show_layers_gui. Not showing layer GUI.`);
			return;
		}

		this.#layers_gui_div_name = divname;

		await this.#show_layers()

		this.#_temml();
	}

	async #get_model_config_hash () {
		var arr = [];
		$("#" + this.#layers_gui_div_name).find("input, checkbox, select").each(function (i, x) {
			if($(x).attr("type") == "checkbox") {
				arr.push($(x).is(":checked"));
			} else {
				arr.push($(x).val());
			}
		});

		var str = arr.join(";;;;;;;;;");

		var res = await this.#md5(str);

		return res;
	}

	#is_hidden_or_has_hidden_parent(element) {
		if ($(element).css("display") == "none") {
			return true;
		}

		var parents = $(element).parents();

		for (var i = 0; i < parents.length; i++) {
			if ($(parents[i]).css("display") == "none") {
				return true;
			}
		}

		return false;
	}

	#group_layers (layers) {
		var str = layers.join(";");

		var char_to_group = new Array(str.length);
		char_to_group.fill(null);

		var feature_extraction_base = "(?:(?:depthwise|separable)?conv.d(?:transpose)?;?)+;?(?:(?:batch|layer)Normalization;)*;?(?:[^;]+Pooling.d;?)*";

		var layer_names = Object.keys(this.#layer_options);

		var list_activation_layers = [];

		for (var i = 0; i < layer_names.length; i++) {
			var category = this.#layer_options[layer_names[i]]["category"];
			if(category == "Activation") {
				list_activation_layers.push(layer_names[i]);
			}
		}

		var batch_or_layer_normalization = "((?:(?:batch|layer)Normalization;?)+)";

		var descs = [
			{
				"re": "((?:upSampling2d;?)+)",
				"name": "Scaling up"
			},
			{
				"re": "((?:lstm;)+)",
				"name": "LSTM"
			},
			{
				"re": "((?:[^;]+Pooling[0-9]D;?)+;?)",
				"name": "<span class='TRANSLATEME_dimensionality_reduction'></span>"
			},
			{
				"re": "((?:" + list_activation_layers.join("|") + ")+)",
				"name": "<span class='TRANSLATEME_shy_activation_function'></span>"
			},
			{
				"re": "((?:dropout;?)+)",
				"name": "<span class='TRANSLATEME_shy_overfitting_prevention'></span>"
			},
			{
				"re": batch_or_layer_normalization,
				"name": "<span class='TRANSLATEME_rescale_and_recenter'></span>"
			},
			{
				"re": "(" + batch_or_layer_normalization + "*(?:" + feature_extraction_base + "))",
				"name": "<span class='TRANSLATEME_feature_extraction'></span>"
			},
			{
				"re": "(" + batch_or_layer_normalization + "*(?:(?:" + feature_extraction_base + ";?)*(?:dropout?;);?))",
				"name": "Feature ex&shy;trac&shy;tion &amp; Over&shy;fit&shy;ting pre&shy;vention"
			},
			{
				"re": "((?:dense;?)+;?(?:dropout)?(?:dense;?)*)",
				"name": "<span class='TRANSLATEME_classification'></span>"
			},
			{
				"re": "((?:flatten;?)+;?)",
				"name": "<span class='TRANSLATEME_flatten'></span>"
			},
			{
				"re": "((?:reshape;?)+;?)",
				"name": "<span class='TRANSLATEME_change_shape'></span>"
			},
			{
				"re": "((?:(?:gaussian[^;]|alphaDropout)+;?)+;?)",
				"name": "<span class='TRANSLATEME_simulate_real_data'></span>"
			},
			{
				"re": "(DebugLayer)+",
				"name": "Debugger"
			}
		];

		for (var desc_i = 0; desc_i < descs.length; desc_i++) {
			var this_re = RegExp(descs[desc_i]["re"], "ig");
			var current_match;
			while ((current_match = this_re.exec(str)) !== null) {
				for (var new_index = current_match["index"]; new_index < (current_match["index"] + current_match[1].length); new_index++) {
					char_to_group[new_index] = descs[desc_i]["name"];
				}
			}
		}

		var layer_to_char_start = [];

		var current_layer_nr = 0;
		for (var i = 0; i < str.length; i++) {
			if(str[i] == ";") {
				current_layer_nr++;
			} else if(str[i - 1] == ";" || i == 0) {
				layer_to_char_start[current_layer_nr] = i;
			}
		}

		var result = [];

		var last_layer_type = char_to_group[0];

		var current_type_layers = [];

		for (var i = 0; i < layer_to_char_start.length; i++) {
			var layer_type = char_to_group[layer_to_char_start[i]];

			if(last_layer_type != layer_type) {
				var this_item = {};
				this_item[last_layer_type] = current_type_layers;
				result.push(this_item);

				current_type_layers = [];
				last_layer_type = layer_type;
			}

			current_type_layers.push(i);
		}

		var this_item = {};
		this_item[last_layer_type] = current_type_layers;
		result.push(this_item);

		return result;
	}

	#get_default_option (layer_type, option_name) {
		this.assert(typeof(layer_type) == "string", "layer_type must be string, is " + typeof(layer_type));
		this.assert(typeof(option_name) == "string", "option_name must be string, is " + typeof(option_name));

		var match = layer_type.match(/(\d+)[dD]/);

		if(match) {
			if(typeof(this.#layer_options_defaults[option_name]) == "string" && this.#layer_options_defaults[option_name] == "[]") {
				var number_of_match_items = this.#parse_int(match[1]);
				var number = 1;
				if(option_name == "kernel_size") {
					var number = 3;
				}
				var results = [];
				for (var i = 0; i < number_of_match_items; i++) {
					results.push(number);
				}

				return results;
			}
		}

		return this.#layer_options_defaults[option_name];
	}

	#add_units_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Units", "units", "number", { "min": 1, "max": 128, "step": 1, "value": this.#get_default_option(type, "units") }, nr);
	}

	#add_kernel_regularizer_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Kernel-Regularizer", "kernel_regularizer", "select", this.#regularizer_select, nr, null, 0, 1);
	}

	#add_use_bias_option (type, nr) {
		return this.#get_tr_str_for_layer_table("<span class='TRANSLATEME_use_bias'></span>", "use_bias", "checkbox", { "status": "checked" }, nr);
	}

	#get_layer_type_array () {
		var r = [];

		for (var i = 0; i < this.#model.layers.length; i++) {
			r.push($($(".layer_type")[i]).val());
		}

		return r;
	}

	async #write_descriptions (force=0) {
		if(this.#is_hidden_or_has_hidden_parent($("#" + this.#layers_gui_div_name))) {
			$(".descriptions_of_layers").hide();
			return;
		}

		var groups = this.#group_layers(this.#get_layer_type_array());

		if(groups.length <= 0) {
			//log("groups.length <= 0");
			$(".descriptions_of_layers").remove();
			return;
		}

		$(".descriptions_of_layers").remove();

		var layer = $(".layer");

		if(!layer.length) {
			//log("!layer.length!");
			return;
		}

		var right_offset = this.#parse_int($(layer[0]).offset().left + $(layer[0]).width() + 26);

		var all_layer_markers = $(".layer_start_marker");
		this.assert(all_layer_markers.length >= 1);

		for (var i = 0; i < groups.length; i++) {
			var group = groups[i];
			var keyname = Object.keys(groups[i])[0];
			var layers = groups[i][keyname];
			var last_layer_nr = layers[layers.length - 1];

			var first_layer = $(layer[layers[0]]);
			this.assert(first_layer.length, "first_layer could not be determined");

			var last_layer = $(layer[Math.max(0, last_layer_nr - 1)]);
			this.assert(last_layer.length, "last_layer could not be determined");

			var first_layer_idx = Math.min(...group[keyname]);
			this.assert(typeof(first_layer_idx) === "number", "first_layer_idx is not a number");
			this.assert(!isNaN(first_layer_idx), "first_layer_idx is NaN");

			var first_layer_marker = $(all_layer_markers[first_layer_idx]);
			this.assert(first_layer_marker.length, "first_layer_marker could not be determined");

			var first_layer_start = this.#parse_int(first_layer_marker.offset()["top"] - 6.5);
			this.assert(first_layer_start, "first_layer_start could not be determined");

			var last_layer_end = this.#parse_int($($(".layer_end_marker")[last_layer_nr]).offset()["top"]);
			this.assert(typeof(last_layer_end) === "number", "last_layer_end is not a number");
			this.assert(last_layer_end >= 0, "last_layer_end is not a number");

			var first_layer_top = this.#parse_int(first_layer.position()["top"]);
			this.assert(typeof(first_layer_top) === "number", "first_layer_top is not a number");
			this.assert(first_layer_top >= 0, "first_layer_top is smaller or equal to 0");

			if(keyname != "null" && keyname && keyname != "undefined") {
				var _height = last_layer_end - first_layer_start - 13;
				var hidden = "";
				if(this.#is_hidden_or_has_hidden_parent($("#layers_container_left"))) {
					hidden = "display: none;";
				}

				var new_div_html = "";
				new_div_html = `<div class="descriptions_of_layers" style="position: absolute; top: ${first_layer_top}px; left: ${right_offset}px; height: ${_height}px; ${hidden}'">${keyname}</div>`;

				$(new_div_html).appendTo("#maindiv");
			}
		}

		$(".descriptions_of_layers").show();
	}

	async #update_layers_gui () {

	}

	#get_item_value(layer, classname) {
		this.assert(typeof (layer) == "number", "Layer is not an integer, but " + typeof (layer));
		this.assert(typeof (classname) == "string", "classname '" + classname + "' is not a string, but " + typeof (classname));

		var layer_settings = $(".layer_setting");
		var layer = $(layer_settings[layer]);

		if (typeof(classname) == "string") {
			var found = $(layer.find("." + classname)[0]);
			if (found.attr("type") == "checkbox") {
				return found.is(":checked");
			} else {
				var data = found.val();
				return data;
			}
		} else {
			for (var this_classname in classname) {
				var found = $($layer.find("." + this_classname)[0]);
				if (found.attr("type") == "checkbox") {
					return found.is(":checked");
				} else {
					var data = found.val();
					if (data) {
						return data;
					}
				}
			}
			return null;
		}
	}

	#get_python_name(_name) {
		if(typeof(_name) == "boolean") {
			if(_name) {
				return "True";
			}
			return "False";
		}

		if(Array.isArray(_name)) {
			return _name;
		}

		if (_name in this.#js_names_to_python_names) {
			return this.#js_names_to_python_names[_name];
		}
		return _name;
	}

	#get_tr_str_for_layer_table(desc, classname, type, data, nr, tr_class, hidden, expert_mode_only = 0) {
		this.assert(typeof(classname) == "string", "classname is not a string");
		this.assert(typeof(data) == "object", "data is not an object");
		this.assert(typeof(nr) == "number", "nr is not a number");
		this.assert(typeof(tr_class) == "string" ||tr_class === undefined || tr_class === null, "tr_class is not a string");

		this.assert(expert_mode_only === 0 || expert_mode_only === 1, "expert_mode_only for #get_tr_str_for_layer_table must be either 0 or 1, but is " + expert_mode_only);

		var new_uuid = this.#uuidv4();

		var str = "<tr";
		if(expert_mode_only) {
			if(tr_class) {
				tr_class = tr_class + " expert_mode_only";
			} else {
				tr_class = "expert_mode_only";
			}
		}
		if (tr_class) {
			str += " class='" + tr_class + "'";
		}
		if (hidden) {
			str += " style='display: none' ";
		}
		str += ">";

		var help = "";

		str += "<td>" + desc + help + ":</td>";
		str += "<td>";
		if (type == "select") {
			var onchange_text = `${this.#asanai_object_name}.updated_page(null, null, this);`;

			var types_init_or_reg = ["initializer", "regularizer"];

			for (var tk = 0; tk < this.#valid_initializer_types.length; tk++) {
				for (var tir = 0; tir < types_init_or_reg.length; tir++) {
					var new_name = this.#valid_initializer_types[tk] + "_" + types_init_or_reg[tir];
					if (classname == new_name) {
						var _get_layer_str = `${this.#asanai_object_name}.find_layer_number_by_element($(this))`;
						var _init_type = `"${this.#valid_initializer_types[tk]}"`;
						var _updated_page_str = `${this.#asanai_object_name}.updated_page(null, null, this)`;
						var _func_name = `insert_${types_init_or_reg[tir]}_options`;

						onchange_text = `${_func_name}(${_get_layer_str}, ${_init_type});${_updated_page_str}`;
					}
				}
			}

			if (classname == "activation") {
				//onchange_text = `insert_activation_options(${this.#asanai_object_name}.find_layer_number_by_element($(this)));${this.#asanai_object_name}.updated_page(null, null, this)`;
			}

			str += `<select id="select_${new_uuid}" class='input_field input_data ${classname}' _onchange='${onchange_text}'>`;
			for (const [key, value] of Object.entries(data)) {
				str += "<option value=\"" + key + "\">" + value + "</option>";
			}
			str += "</select>";
		} else if (type == "text") {
			var placeholder = "";

			if ("placeholder" in data) {
				placeholder = " placeholder='" + data["placeholder"] + "' ";
			}

			var pre_text = "";
			if ("text" in data) {
				var text = data["text"];
				if (typeof (data["text"]) == "function") {
					text = data["text"](nr);
				}

				pre_text = " value='" + text + "' ";
			}

			str += `<input id="text_field_${this.#uuidv4()}" class="input_field input_data ${classname}" ${pre_text} ${placeholder} type="text"  _onchange="${this.#asanai_object_name}.updated_page()" onkeyup="${this.#asanai_object_name}.updated_page(null, null, this)" />`;
		} else if (type == "number") {
			str += "<input class='input_field input_data " + classname + "' type='number' ";

			if ("min" in data) {
				str += " min=" + data["min"] + " ";
			}

			if ("max" in data) {
				str += " max=" + data["max"] + " ";
			}

			if ("step" in data) {
				str += " step=" + data["step"] + " ";
			}

			if ("value" in data) {
				str += " value=" + data["value"] + " ";
			}

			str += `id='get_tr_str_for_layer_table_${new_uuid}'  _onchange='${this.#asanai_object_name}.updated_page()' onkeyup="${this.#asanai_object_name}.updated_page(null, null, this);" />`;
		} else if (type == "checkbox") {
			str += `<input id='checkbox_${new_uuid}' type='checkbox' class='input_data ${classname}' _onchange='${this.#asanai_object_name}.updated_page(null, null, this);' `;
			if ("status" in data && data["status"] == "checked") {
				str += " checked='CHECKED' ";
			}
			str += " />";

		} else {
			alert("Invalid table type: " + type);
		}
		str += "</td>";

		return str;
	}

	#add_trainable_option (type, nr) {
		return this.#get_tr_str_for_layer_table("<span class='TRANSLATEME_trainable'></span>", "trainable", "checkbox", { "status": "checked" }, nr);
	}

	#get_tr_str_for_description(desc) {
		this.assert(typeof (desc) == "string", desc + " is not string but " + typeof (desc));
		return "<tr><td><span class='TRANSLATEME_description'></span>:</td><td><span class='typeset_me'>" + desc + "</span></td></tr>";
	}

	#get_option_for_layer_by_type(nr) {
		this.assert(typeof (nr) == "number", "#get_option_for_layer_by_type(" + nr + ") is not a number, but " + typeof (nr));

		var layer_type = $($(".layer_type")[nr]);

		var type = layer_type.val();

		if (!type) {
			layer_type.children().children().each(function () {
				if ($(this).val() == "dense") {
					$(this).prop("selected", true);
				}
			});
			type = layer_type.val();
			this.log("Cannot determine type of layer " + nr);
			return;
		}

		var str = "";

		var kernel_initializer_string = this.#get_tr_str_for_layer_table("<span class='TRANSLATEME_kernel_initializer'></span>", "kernel_initializer", "select", this.#initializers, nr);
		var bias_initializer_string = this.#get_tr_str_for_layer_table("<span class='TRANSLATEME_bias_initializer'></span", "bias_initializer", "select", this.#initializers, nr);
		var activation_string = this.#get_tr_str_for_layer_table("<span class='TRANSLATEME_activation_function'></span>", "activation", "select", this.#activations, nr);

		for (var [key, value] of Object.entries(this.#layer_options)) {
			if (key == type) {
				if (value["description"]) {
					str += this.#get_tr_str_for_description(value["description"]);
				} else {
					alert("No description given for " + key);
				}

				if (value["options"]) {
					var options = value["options"];
					for (var j = 0; j < options.length; j++) {
						var item = options[j];
						if (item == "activation") {
							str += activation_string;
						} else if (item == "kernel_initializer") {
							str += kernel_initializer_string;
						} else if (item == "bias_initializer") {
							str += bias_initializer_string;
						} else {
							var asanai_this = this;
							var _code = "str += asanai_this.#add_" + item + "_option(type, nr);";
							eval(_code);
						}
					}
				} else {
					alert("No options given for " + key);
				}
			}
		}

		this.assert(typeof(str) == "string", "str is not a string in #get_option_for_layer_by_type, but " + str + ", " + typeof(str));

		return str;
	}

	async set_option_for_layer_by_layer_nr(nr) {
		this.assert(typeof(nr) == "number", "initializer_layer_options_by_layer_nr(" + nr + ") is not a number but " + typeof(nr));

		var layer = $(".layer_options_internal")[nr];
		layer.innerHTML = this.#get_option_for_layer_by_type(nr);

		$($(".layer_options_internal")[nr]).find("select").trigger("change");

		var valid_subtypes = ["initializer", "regularizer"];
		for (var i = 0; i < this.#valid_initializer_types.length; i++) {
			var kn = this.#valid_initializer_types[i];

			for (var vs = 0; vs < valid_subtypes.length; vs++) {
				var t = valid_subtypes[vs];
				var name = kn + "_" + t;
				$(layer).find("." + name).trigger("change");
			}
		}

		await this.#write_descriptions();
	}

	async initializer_layer_options(thisitem) {
		if ($(thisitem).hasClass("swal2-select") || $(thisitem).attr("id") == "model_dataset") {
			return;
		}

		//assert(typeof(thisitem) == "object", "initializer_layer_options(" + thisitem + ") is not an object but " + typeof(thisitem));

		var nr = thisitem;
		if (typeof (nr) != "number") {
			nr = this.find_layer_number_by_element(thisitem);
		}

		this.assert(typeof (nr) == "number", "found nr is not an integer but " + typeof (nr));

		await this.set_option_for_layer_by_layer_nr(nr);

		var chosen_option = $($(".layer_setting")[nr]).find(".layer_type").val();
		$($(".layer_setting")[nr]).find("option").each(function (i, x) {
			if (chosen_option == $(x).val()) {
				$(x).attr("selected", "selected");
			} else {
				$(x).removeAttr("selected");
			}
		});

		await this.updated_page(null, 1);
	}

	async toggle_options(item) {
		this.assert(typeof (item) == "object", "toggle_options(" + item + ") is not an object but " + typeof (item));

		$(item).parent().parent().parent().next().toggle();
		await this.#write_descriptions(1);

		this.#_temml();
	}

	#option_for_layer(nr) {
		this.assert(typeof (nr) == "number", "#option_for_layer(" + nr + ") is not a number but " + typeof(number));

		var this_event = `${this.#asanai_object_name}.initializer_layer_options(this)`;

		var option_for_layer_id = `option_for_layer_${this.#uuidv4()}`;

		var str = "";
		str += "<tr>";
			str += "<td style='width: 140px'>";
				str += `<button style='cursor: context-menu' class='show_data layer_options_button' onclick='${this.#asanai_object_name}.toggle_options(this)'>&#9881;&nbsp;<span class='TRANSLATEME_settings'></span></button>`;
			str += "</td>";
			str += "<td>";
				str += `<select id="${option_for_layer_id}" onfocus='${this.#asanai_object_name}.disable_invalid_layers_event(event, this)' onchange='${this_event}' class='input_data layer_type'>`;
				var last_category = "";
				for (var key of this.#layer_names) {
					var this_category = this.#layer_options[key].category;
					if (last_category != this_category) {
						if (last_category != "") {
							str += "</optgroup>";
						}
						str += `<optgroup label="${this_category}">`;
						last_category = this_category;
					}
					str += "<option class='layer_type_selector_" + key + "' value='" + key + "'>" + this.#get_python_name(key) + "</option>";
				}
				str += "</optgroup>";
				str += "</select>";
			str += "</td>";
		str += "</tr>";
		str += "<tbody class='layer_options_internal' style='display: none'></tbody>";

		return str;
	}

	async #show_layers() {
		var number = this.#model.layers.length;

		this.assert(typeof (number) == "number", "show_layer(" + number + ") is not a number but " + typeof (number));

		var layers_container = $("#" + this.#layers_gui_div_name);

		if(!layers_container.length) {
			this.err(`#${this.#layers_gui_div_name} not found!`);
			return;
		}

		var layers_container_str = "";
		var layer_visualizations_tab_str = $("#layer_visualizations_tab").html();

		var remove = `<button class='add_remove_layer_button remove_layer' disabled='' onclick='${this.#asanai_object_name}.remove_layer(this)'>-</button>&thinsp;`;
		var add = `<button class='add_remove_layer_button add_layer' onclick='${this.#asanai_object_name}.add_layer(this)'>+</button>&nbsp;`;

		for (var i = 0; i < number; i++) {
			var this_layer_option = this.#option_for_layer(i);

			layers_container_str +=
				"<li class='ui-sortable-handle'><span class='layer_start_marker'></span><div class='container layer layer_setting glass_box'>" +
					"<div style='display:none' class='warning_container'><span style='color: yellow'>&#9888;</span><span class='warning_layer'></span></div>" +
						remove +
						add +
						"<span class='layer_nr_desc'></span>" +
						"<span class='layer_identifier'></span>" +
						"<table class='configtable'>" +
							this_layer_option +
						"</table>" +
					"</div>" +
					"<span class='layer_end_marker'></span>" +
				"</li>"
			;

			layer_visualizations_tab_str +=
				"<div class='layer_data'></div>" +
			"<br>";
			
		}

		layers_container[0].innerHTML = layers_container_str;

		for (var i = 0; i < number; i++) {
			await this.initializer_layer_options(i);
		}

		$("#layer_visualizations_tab").html(layer_visualizations_tab_str);

		this.#sortable_layers_container(layers_container);

		$(".train_neural_network_button").show();
	}

	#lowercase_first_letter (string) {
		if(typeof(string) != "string") {
			this.wrn(`[lowercase_first_letter] lowercase_first_letter(string = ${string}), typeof: ${typeof(string)}`);
			string = "" + string;
		}

		try {
			var res = string.charAt(0).toLowerCase() + string.slice(1);

			return res;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[lowercase_first_letter] " + e);

			return null;
		}
	}

	#calculate_default_target_shape (nr) {
		this.assert(typeof(nr) == "number", `#calculate_default_target_shape(nr = ${nr}), nr is not a number, but ${typeof(nr)}`);

		try {
			var input_shape = this.#model.layers[Math.max(0, nr - 1)].getOutputAt(0).shape;

			var output = [];

			for (var i = 0; i < input_shape.length; i++) {
				if(Number.isInteger(input_shape[i])) {
					output.push(input_shape[i]);
				}
			}

			return output;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[#calculate_default_target_shape] " + e);

			return null;
		}
	}

	#add_bias_regularizer_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Bias-Regularizer", "bias_regularizer", "select", this.#regularizer_select, nr, null, 0, 1);
	}

	#add_visualize_option(type, nr) {
		this.assert(typeof(type) == "string", "type is not a number");
		this.assert(typeof(nr) == "number", "nr is not a number");

		var style = "";

		var res = `<tr class='visualize_button' ${style}><td><span class='TRANSLATEME_visualize_this_layer'></span>?</td><td><button class='visualize_layer_button' onclick='${this.#asanai_object_name}.draw_maximally_activated_layer(${this.#asanai_object_name}.find_layer_number_by_element(this), "${type}")'><span class='TRANSLATEME_visualize_layer'></span></button></td></tr>`;

		return res;
	}

	#add_dtype_option (type, nr) {
		return this.#get_tr_str_for_layer_table("DType", "dtype", "select", this.#dtypes, nr, null, 1, 1);
	}

	async updated_page(no_graph_restart, disable_auto_enable_valid_layer_types, item, no_prediction) {
		if(!this.#finished_loading) {
			return;
		}
		var updated_page_uuid = this.#uuidv4();

		const functionName = "updated_page"; // Specify the function name

		try {
			this.#waiting_updated_page_uuids.push(updated_page_uuid);

			while (this.#waiting_updated_page_uuids.length && this.#waiting_updated_page_uuids[0] != updated_page_uuid) {
				await this.delay(10);
			}

			/*
			console.log("updated_page trace:");
			console.trace();
			*/
			var ret = await this.#updated_page_internal(no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction);

			var index = this.#waiting_updated_page_uuids.indexOf(updated_page_uuid);

			if (index !== -1) {
				this.#waiting_updated_page_uuids.splice(index, 1);
			} else {
				console.warn("Could not find index of " + updated_page_uuid);
			}
		} catch (e) {
			var original_e = e;
			var index = this.#waiting_updated_page_uuids.indexOf(updated_page_uuid);

			if (index !== -1) {
				this.#waiting_updated_page_uuids.splice(index, 1);
			} else {
				console.error("Could not find index of " + updated_page_uuid);
			}

			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("There are zeroes in the output shape") || ("" + e).includes("Negative dimension size caused")) {
				var last_good = get_last_good_input_shape_as_string();
				this.log("The input size was too small. Restoring input size to the last known good configuration: " + last_good);
				if(last_good && last_good != "[]" && last_good != this.get_input_shape_as_string()) {
					await set_input_shape(last_good, 1);
				}
			} else if(("" + e).includes("Cannot read properties of undefined (reading 'predict')")) {
				this.wrn("[updated_page] " + e);
			} else if(("" + e).includes("out of memory")) {
				await this.#write_error("" + e);
			} else if(("" + e).includes("Cannot read properties of undefined")) {
				this.wrn("[updated_page] " + e);
			} else if(("" + e).includes("model.layers[i]")) {
				this.dbg("[updated_page] #model.layers[i] (" + i + ") is undefined");
			} else if (("" + e).includes("model.layers is undefined")) {
				this.dbg("[updated_page] #model.layers is undefined");
			} else if (("" + e).includes("model is undefined")) {
				this.dbg("[updated_page] model is undefined");
			} else if (("" + e).includes("model.input is undefined")) {
				this.dbg("[updated_page] #model.input is undefined");
			} else if (("" + e).includes("Inputs to DepthwiseConv2D should have rank")) {
				this.dbg("[updated_page] " + e);
			} else if (("" + e).includes("targetShape is undefined")) {
				this.dbg("[updated_page] " + e);
			} else if (("" + e).includes("code is undefined")) {
				this.dbg("[updated_page] This error may happen when the whole DOM is deleted: " + e);
			} else if (("" + e).includes("fcnn is undefined")) {
				this.dbg("[updated_page] This error may happen when you did not include d3 or three.js: " + e);
			} else if (("" + e).includes("e is null")) {
				this.dbg("[updated_page] This error may happen when switching #models: " + e);
			} else {
				this.err("" + e);
				console.error("Stack:", original_e.stack);
				throw new Error("" + e);
			}

			return false;
		}

		if(!ret) {
			if(this.#finished_loading) {
				//wrn("updated_page failed");

				var last_good = get_last_good_input_shape_as_string();
				if(last_good && last_good != "[]" && last_good != this.get_input_shape_as_string()) {
					this.log("The input size was too small. Restoring input size to the last known good configuration: " + last_good);
					await set_input_shape(last_good, 1);
				}
			}
		}

		try {
			await this.#_temml();
		} catch (e) {
			this.wrn(e);
		}

		this.#disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();
	}

	#has_any_warning () {
		if($("#width").val() == "" || $("#height").val() == "") {
			//wrn("[#has_any_warning] Width or height is empty string, returning from updated_page");
			return true;
		}

		return false;
	}

	#rename_tmp_onchange() {
		$("*[_onchange]").each(function (i, x) {
			var elem = $(this);
			elem.attr("onchange", elem.attr("_onchange"));
			elem.removeAttr("_onchange");
		});
	}

	#show_or_hide_bias_initializer(number_of_layers) {
		var layer_settings = $(".layer_setting");
		for (var i = 0; i < number_of_layers; i++) {
			var this_layer = $(layer_settings[i]);
			var use_bias_setting = this_layer.find(".use_bias");
			if (use_bias_setting.length) {
				if ($(use_bias_setting[0]).is(":checked")) {
					this_layer.find(".bias_initializer").parent().parent().show();
				} else {
					this_layer.find(".bias_initializer").parent().parent().hide();
				}
			}
		}
	}

	async compile_model () {
		this.#compile_model();
	}

	async #compile_model (recursion_level=0) {
		this.wrn(`compile_model not yet fully implemented!`);
		return;


		if(recursion_level > 3) {
			this.err("recursion level for #compile_model too high");
			return;
		}

		this.assert(this.#get_number_of_layers() >= 1, "Need at least 1 layer.");

		var new_model_config_hash = await this.#get_model_config_hash();
		this.assert(typeof(new_model_config_hash) == "string", "new model config has is not a string");

		var current_status_hash = await this.#get_current_status_hash();
		var recreate_model = await this.#_get_recreate_model(current_status_hash, this.#model_config_hash, new_model_config_hash);

		if(!this.#model) {
			if(finished_loading) {
				this.wrn("model not given");
			}

			if(this.#global_model_data) {
				var model_data_tensors = this.#find_tensors_with_is_disposed_internal(this.#global_model_data);
				for (var i = 0; i < this.model_data_tensors.length; i++) {
					await this.dispose(model_data_tensors[i]);
				}
			}

			try {
				[this.#model, this.#global_model_data] = await this.create_model(model, await this.get_model_structure());
			} catch (e) {
				throw new Error(e);
			}
		}

		if(recreate_model) {
			this.#model_is_trained = false;
			await this.#_create_model();
			await this.#last_shape_layer_warning();
		}

		if(!this.#model) {
			this.wrn("[compile_model] No #model to compile!");
			return;
		}

		while (this.#create_model_queue.length || !this.#model) {
			await this.delay(10);
		}

		try {
			var gmd = this.#global_model_data;
			gmd = await this.#get_model_data();

			this.#model.compile(gmd);
			this.#model_config_hash = new_model_config_hash;
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			if(("" + e).includes("model is empty")) {
				this.err("" + e);
				/*
				set_model_layer_warning(0, "" + e);

				for (var i = 0; i < $("#layer_setting").length; i++) {
					set_layer_background(i, "red")
				}
				*/
			} else if (("" + e).includes("model is empty")) {
				this.err("[compile_model] " + e)
				return;
			} else if (("" + e).includes("e is null")) {
				this.err("[compile_model] " + e)
				await this.delay(1000);
				return await this.#compile_model(recursion_level + 1);
			} else if (("" + e).includes("model.compile is not a function")) {
				this.err("[compile_model] " + e);
				return;
			} else {
				if(e) {
					this.err("" + e);
				} else {
					await this.#except("ERROR2", "Unknown error");
				}

				return;
			}
		}

		/*
		for (var i = 0; i < $("#layer_setting").length; i++) {
			set_layer_background(i, "")
		}
		*/

		/*
		try {
			$("#outputShape").val(JSON.stringify(model.outputShape));
		} catch (e) {
			if(("" + e).includes("model is undefined")) {
				this.wrn("[compile_model] #model is undefined while #compile_model");
			} else {
				throw new Error(e);
			}
		}
		*/

		//write_model_summary_wait();
	}

	async #updated_page_internal (no_graph_restart, disable_auto_enable_valid_layer_types, no_prediction) {
		if(this.#has_any_warning()) {
			return false;
		}

		this.#rename_tmp_onchange();

		var number_of_layers = this.#model.layers.length;
		this.#show_or_hide_bias_initializer(number_of_layers);

		try {
			await this.#compile_model();
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.log(e);
			this.log("There was an error compiling the #model: " + e);
			throw new Error(e);
		}

		var redo_graph = await this.#update_python_code(1);

		if (this.#model && redo_graph && !no_graph_restart) {
			await this.restart_fcnn();
		}

		this.#prev_layer_data = [];

		try {
			await this.#identify_layers();
		} catch (e) {
			var stack = e.stack;
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("#identify_layers() failed with: " + e + ". Stack: ");
			console.log(stack);
		}

		this.#layer_structure_cache = null;

		this.#enable_start_training_custom_tensors();

		var wait_for_latex_model = Promise.resolve(1);

		wait_for_latex_model = await this.#write_model_to_latex_to_page();

		await this.#last_shape_layer_warning();

		//await hide_no_conv_stuff();

		var current_input_shape = this.get_input_shape();
		if (this.#camera) {
			this.stop_camera();
		}

		try {
			await this.#write_descriptions();
		} catch (e) {
			this.wrn(e);
		}

		this.#allow_training();

		if (!no_prediction) {
			await this.#redo_what_has_to_be_redone();
		}

		await wait_for_latex_model;
		//await wait_for_show_hide_load_weights;
		if(this.#atrament_data.sketcher && await this.#input_shape_is_image()) {
			try {
				await predict_handdrawn();
			} catch (e) {
				if(("" + e).includes("but got array with shape")) {
					var _err = "This may have happened when you change the model input size while prediction. In which case, it is a harmless error.";
					this.wrn("[#updated_page_internal] " + _err);
					this.log(_err);
				} else {
					throw new Error(e);
				}
			}
		}

		this.#allow_editable_labels();

		for (var i = 0; i < this.#model.layers.length; i++) {
			await this.#insert_initializer_options(i, "kernel");
			await this.#insert_initializer_options(i, "bias");

			//await this.#update_translations();
		}

		return true;
	}

	async #update_python_code(dont_reget_labels) {
		var redo_graph = 0;

		var input_shape = [this.#model_height, this.#model_width, this.#number_channels];

		var loss = this.#loss;
		var optimizer_type = this.#optimizer;
		var metric_type = this.#metric;
		var batchSize = this.#batch_size
		var data_origin = this.#data_origin;

		var epochs = this.#parse_int(this.#epochs);

		$("#pythoncontainer").show();

		var input_shape_is_image_val = await this.#input_shape_is_image();

		var x_shape = "";

		if(input_shape_is_image_val) {
			x_shape = "[height, width, 3]";
		}

		var layer_types = $(".layer_type");
		var layer_settings = $(".layer_setting");

		var expert_code = "";

		for (var i = 0; i < this.#model.layers.length; i++) {
			var type = $(layer_types[i]).val();

			var data = {};

			if (i == 0) {
				if (input_shape_is_image_val) {
					data["input_shape"] = x_shape;
				} else {
					data["input_shape"] = "get_shape('x.txt')";
				}
			}

			if (type in this.#layer_options) {
				for (var j = 0; j < this.#layer_options[type]["options"].length; j++) {
					var option_name = this.#layer_options[type]["options"][j];

					if (option_name == "pool_size") {
						var _pool_size_x = this.#get_item_value(i, "pool_size_x");
						var _pool_size_y = this.#get_item_value(i, "pool_size_y");

						if(this.#looks_like_number(_pool_size_x) && this.#looks_like_number(_pool_size_y)) {
							data[this.#get_python_name(option_name)] = [this.#parse_int(_pool_size_x), this.#parse_int(_pool_size_y)];
						}
					} else if (option_name == "strides") {
						var _strides_x = this.#get_item_value(i, "strides_x");
						var _strides_y = this.#get_item_value(i, "strides_y");

						if(this.#looks_like_number(_strides_x) && this.#looks_like_number(_strides_y)) {
							data[this.#get_python_name(option_name)] = [this.#parse_int(_strides_x), this.#parse_int(_strides_y)];
						}
					} else if (option_name == "kernel_size") {
						var kernel_size_x = this.#get_item_value(i, "kernel_size_x");
						var kernel_size_y = this.#get_item_value(i, "kernel_size_y");
						var kernel_size_z = this.#get_item_value(i, "kernel_size_z");

						if(kernel_size_x && kernel_size_y && kernel_size_z) {
							data[this.#get_python_name(option_name)] = [
								this.#parse_int(kernel_size_x),
								this.#parse_int(kernel_size_y),
								this.#parse_int(kernel_size_z)
							];
						} else if (kernel_size_x && kernel_size_y) {
							data[this.#get_python_name(option_name)] = [
								this.#parse_int(kernel_size_x),
								this.#parse_int(kernel_size_y)
							];
						} else if (kernel_size_x) {
							data[this.#get_python_name(option_name)] = [
								this.#parse_int(kernel_size_x)
							];
						} else {
							await this.#write_error(`Neither (kernel_size_x && kernel_size_y && kernel_size_z) nor (kernel_size_x && kernel_size_z) nor (kernel_size_x). Kernel-Data: ${JSON.stringify({kernel_size_x: kernel_size_x, kernel_size_y: kernel_size_y, kernel_size_z: kernel_size_z, })}`);
						}
					} else if (option_name == "size") {
						data[this.#get_python_name(option_name)] = eval("[" + this.#get_item_value(i, "size") + "]");
					} else if (option_name == "dilation_rate") {
						var dil_rate = this.#get_item_value(i, option_name);

						dil_rate = dil_rate.replace(/[^0-9,]/g, "");

						var code_str = "[" + dil_rate + "]";

						data[this.#get_python_name(option_name)] = eval("[" + code_str + "]");

					} else if (option_name == "target_shape") {
						data[this.#get_python_name(option_name)] = eval("[" + this.#get_item_value(i, "target_shape") + "]");
					} else if (option_name == "activation") {
						if(option_name) {
							data[this.#get_python_name(option_name)] = this.#get_python_name(this.#get_item_value(i, option_name));
						}
					} else {
						data[this.#get_python_name(option_name)] = this.#get_item_value(i, option_name);
					}
				}

				redo_graph++;
			}

			this.#valid_initializer_types.forEach((type) => {
				["regularizer", "initializer"].forEach((func) => {
					var item_name = type + "_" + func;
					if (Object.keys(data).includes(item_name)) {
						if (data[item_name] == "none") {
							delete data[item_name];
						}
					}
				});
			});

			var params = [];
			for (const [key, value] of Object.entries(data)) {
				if (key == "dtype" && i == 0 || key != "dtype") {
					if (typeof (value) != "undefined" && typeof(key) != "boolean") {
						params.push(this.#get_python_name(key) + "=" + this.#quote_python(this.#get_python_name(value)));
					}
				}
			}

			delete data["visualize"];

			if(this.#model && Object.keys(this.#model).includes("layers")) {
				/*
				var cdata = convert_to_python_string(data)
				if(cdata == "{}") {
					cdata = "";
				}
				*/
				//expert_code += `model.add(layers.${model.layers[i].getClassName()}(${cdata}))\n`;
				try {
					var classname = "";

					if(Object.keys(this.#model).includes("layers") && Object.keys(this.#model.layers).includes("" + i)) {
						classname = this.#model.layers[i].getClassName();
					}

					if(classname) {
						expert_code += this.#model_add_python_structure(classname, data);
					} else {
						expert_code += "# Problem getting the code for this layer";
					}
				} catch (e) {
					if(("" + e).includes("this.#model.layers[i] is undefined")) {
						this.wrn("[#update_python_code] this.#model.layers was undefined. This MAY be harmless.");
					} else {
						expert_code += "# ERROR while creating code: " + e;
						this.log("[#update_python_code] ERROR in python expert code: " + e);
						console.log("[#update_python_code] data:", data);
					}
				}
			}
		}

		if(expert_code) {
			var labels_str = "";
			if(this.#labels.length) {
				labels_str = "labels = ['" + this.#labels.join("', '") + "']\n";
			}

			var wh = "";

			var is = this.get_input_shape_with_batch_size(); is[0] = "None";

			expert_code =
				this.#python_boilerplate(input_shape_is_image_val, 0) +
				labels_str +

				"model = tf.keras.Sequential()\n\n" +

				"from keras import layers\n" +

				expert_code +

				`model.build(input_shape=[${is.join(", ")}])` +
				"\n\nmodel.summary()\n";
		}

		//var python_code = this.#create_python_code(input_shape_is_image_val);

		//$("#python").text(python_code).show();
		//$("#python_expert").text(expert_code).show();

		//await this.#highlight_code();

		return redo_graph;
	}

	#quote_python(item, nobrackets=0) {
		if (item === undefined) {
			return "";
		}

		if (typeof (item) == "object") {
			return JSON.stringify(item);
		} else {
			if (this.#is_numeric(item)) {
				return item;
			} else if (!nobrackets && /^\d+(,\d+)*$/.test(item)) {
				return "[" + item + "]";
			} else if (item == "True" || item == "False") {
				return item;
			} else if (!nobrackets && item.includes("get_shape")) {
				return item;
			} else if (!nobrackets && item.startsWith("[")) {
				return item;
			} else {
				return "\"" + item + "\"";
			}
		}

		return item;
	}

	#is_numeric(str) {
		if (typeof str != "string") return false;
		if (str == "") return false;
		return !isNaN(str) && !isNaN(this.#parse_float(str));
	}

	#model_add_python_structure (layer_type, data) {
		this.assert(layer_type, "layer_type is not defined");
		this.assert(data, "data is not defined");

		if(Object.keys(data).includes("dropout_rate")) {
			data["rate"] = data["dropout_rate"];
			delete data["dropout_rate"]
		}

		var str = "";
		if(layer_type == "Conv2D") {
			return `model.add(layers.Conv2D(
	${data.filters},
	(${data.kernel_size}),
${this.#python_data_to_string(data, ["filters", "kernel_size"])}
))\n`;
		} else if(layer_type == "Dense") {
			return `model.add(layers.Dense(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "UpSampling2D") {
			str += `model.add(layers.UpSampling2D(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "SeparableConv1D") {
			str += `model.add(layers.SeparableConv1D(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "BatchNormalization") {
			str += `model.add(layers.BatchNormalization(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "ThresholdedReLU") {
			str += `model.add(layers.ThresholdedReLU(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "Softmax") {
			str += `model.add(layers.Softmax(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "ReLU") {
			str += `model.add(layers.ReLU(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "Conv2DTranspose") {
			str += `model.add(layers.Conv2DTranspose(
	${data.filters},
	(${data.kernel_size}),
${this.#python_data_to_string(data, ["kernel_size", "filters"])}
))\n`;
		} else if (layer_type == "AlphaDropout") {
			str += `model.add(layers.AlphaDropout(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "Dropout") {
			str += `model.add(layers.Dropout(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "GaussianDropout") {
			str += `model.add(layers.GaussianDropout(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "GaussianNoise") {
			str += `model.add(layers.GaussianNoise(stddev=${data.stddev}, seed=${this.#or_none(data.seed)}))\n`;
		} else if (layer_type.startsWith("GlobalAveragePooling")) {
			str += `model.add(layers.${layer_type}(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type.startsWith("GlobalMaxPooling")) {
			str += `model.add(layers.${layer_type}(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "LayerNormalization") {
			str += `model.add(layers.LayerNormalization(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "Reshape") {
			str += `model.add(layers.Reshape(
	target_shape=[${data.target_shape}]
))\n`;
		} else if (layer_type == "MaxPooling3D") {
			str += `model.add(layers.MaxPooling3D(
	(${data.pool_size[0]}, ${data.pool_size[1]}, ${data.pool_size[2]}),
${this.#python_data_to_string(data, ["pool_size"])}
))\n`;
		} else if (layer_type == "MaxPooling2D") {
			str += `model.add(layers.MaxPooling2D(
${this.#python_data_to_string(data, ["pool_size"])}
))\n`;
		} else if (layer_type == "MaxPooling1D") {
			str += `model.add(layers.${layer_type}(
	(${data.pool_size[0]}),
${this.#python_data_to_string(data, ["pool_size"])}
))\n`;
		} else if (layer_type == "AveragePooling1D") {
			str += `model.add(layers.AveragePooling1D(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "SeparableConv2D") {
			str += `model.add(layers.SeparableConv2D(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "AveragePooling2D") {
			str += `model.add(layers.AveragePooling2D(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "AveragePooling3D") {
			str += `model.add(layers.AveragePooling3D(
${this.#python_data_to_string(data)}
))\n`;

		} else if (layer_type == "LeakyReLU") {
			str += `model.add(layers.LeakyReLU(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "ELU") {
			str += `model.add(layers.ELU(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "DepthwiseConv1D") {
			str += `model.add(layers.DepthwiseConv1D(
${this.#python_data_to_string(data)}
))\n`;
		} else if (layer_type == "DepthwiseConv2D") {
			str += `model.add(layers.DepthwiseConv2D(
	(${data.kernel_size}),
${this.#python_data_to_string(data, ['kernel_size'])}
))\n`;
		} else if(layer_type == "Flatten") {
			return "model.add(layers.Flatten())\n";
		} else if(layer_type == "DebugLayer") {
			return "# Debug layer are custom to asanAI and are not available in TensorFlow\n";
		} else {
			return "# NOT YET IMPLEMENTED: " + layer_type + "\n";
		}
		return str;
	}

	#python_data_to_string (_data, _except=[]) {
		this.assert(typeof(_data) == "object", "_data is not an object for python_data_to_string");
		this.assert(typeof(_except) == "object", "_except is not an object for python_data_to_string");

		var strings = [];
		var string = "";

		var keys = Object.keys(_data);

		_except.push("input_shape");

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];

			if(!_except.includes(key)) {
				if(key == "strides" || key == "dilation_rate" || key == "pool_size") {
					this.assert(typeof(_data[key]) == "object", "_data[key] for " + key + " is not an object!");
					strings.push(`\t${key}=(${_data[key].join(", ")})`);
				} else if(key == "use_bias" || key == "trainable") {
					var true_or_false = 0;
					if(_data[key] == "True" || _data[key] == "true" || _data[key] == "1" || _data[key] == 1) {
						true_or_false = 1;
					}
					strings.push(`\t${key}=${true_or_false ? "True" : "False"}`);
				} else if(key == "size") {
					strings.push(`\tsize=${this.#or_none(data.size, "(", ")")}`);
				} else {
					if(typeof(_data[key]) == "string") {
						strings.push(`\t${key}=${this.#or_none(_data[key])}`);
					} else {
						strings.push(`\t${key}=${this.#or_none(_data[key])}`);
					}
				}
			}
		}

		string = strings.join(",\n");

		return string;
	}

	#or_none (str, prepend = "\"", append = "\"") {
		if(str) {
			if(("" + str).match(/^[+-]?\d+(?:\.\d+)$/)) {
				return this.#parse_float(str);
			} else if(("" + str).match(/^[+-]?\d+$/)) {
				return this.#parse_int(str);
			}
			return prepend + this.#get_python_name(str) + append;
		}
		return "None";
	}

	get_input_shape_with_batch_size () {
		var shape = this.get_input_shape();
		shape.unshift(this.#parse_int(this.#batch_size));
		var res = shape;
		return res;
	}

	get_input_shape () {
		if(!this.#model) {
			this.err(`this.#model`);
			return;
		}

		return this.#model.input.shape.filter(n => n);
	}

	#python_boilerplate (input_shape_is_image_val, _expert_mode=0) {
		var python_code = "";

		python_code += "# This generated code is licensed under WTFPL. You can do whatever you want with it, without any restrictions.\n";
		python_code += "# python3 -m venv asanaienv\n";
		python_code += "# source asanaienv/bin/activate\n";
		python_code += "# pip3 install tensorflow tensorflowjs protobuf==3.20.0 ";

		if (input_shape_is_image_val) {
			python_code += " scikit-image opencv-python ";
		}

		python_code += "\n";
		python_code += "import sys\n";

		if(_expert_mode) {
			python_code += "import os\n";
			python_code += "if not os.path.exists('keras_model') and os.path.exists('model.json'):\n";
			python_code += "    os.system('tensorflowjs_converter --input_format=tfjs_layers_model --output_format=keras_saved_model model.json keras_model')\n";
			python_code += "# Save this file as python-script and run it like this:\n";
			python_code += "if not os.path.exists('keras_model'):\n"
			python_code += "    print('keras_model cannot be found')\n"
			python_code += "    sys.exit(1)\n"
		} else {
			if (input_shape_is_image_val) {
				python_code += "# python3 nn.py file_1.jpg file_2.jpg file_3.jpg\n";
			} else {
				python_code += "# python3 nn.py\n";
			}
		}

		python_code += "import keras\n";
		python_code += "import tensorflow as tf\n";

		return python_code;
	}

	#create_python_code (input_shape_is_image_val) {
		var python_code = this.#python_boilerplate(input_shape_is_image_val, 1);

		python_code += "model = tf.keras.models.load_model(\n";
		python_code += "   'keras_model',\n";
		python_code += "   custom_objects=None,\n";
		python_code += "   compile=True\n";
		python_code += ")\n\n";
		python_code += "model.summary()\n";

		if (input_shape_is_image_val) {
			python_code += "from tensorflow.keras.preprocessing.image import ImageDataGenerator\n";
			python_code += "from PIL import Image\n";
			python_code += "import numpy as np\n";
			python_code += "from skimage import transform\n";

			python_code += "labels = ['" + this.#labels.join("', '") + "']\n";
			python_code += "height = " + height + "\n";
			python_code += "width = " + width + "\n";
			python_code += "divideby = " + $("#divide_by").val() + "\n";

			python_code += "def load(filename):\n";
			python_code += "    np_image = Image.open(filename)\n";
			python_code += "    np_image = np.array(np_image).astype('float32')/divideby\n";
			python_code += "    np_image = transform.resize(np_image, (height, width, 3))\n";
			python_code += "    np_image = np.expand_dims(np_image, axis=0)\n";
			python_code += "    return np_image\n";

			python_code += "def load_frame(filename):\n";
			python_code += "    np_image = cv2.cvtColor(filename, cv2.COLOR_BGR2RGB)\n";
			python_code += "    np_image = np.array(np_image).astype('float32')/divideby\n";
			python_code += "    np_image = transform.resize(np_image, (height, width, 3))\n";
			python_code += "    np_image = np.expand_dims(np_image, axis=0)\n";
			python_code += "    return np_image\n";

			python_code += "for a in range(1, len(sys.argv)):\n";
			python_code += "    image = load(sys.argv[a])\n";
			python_code += "    print(sys.argv[a] + ':')\n";
			python_code += "    prediction = model.predict(image)\n";
			python_code += "    for i in range(0, len(prediction)):\n";
			python_code += "        for j in range(0, len(prediction[i])):\n";
			python_code += "            print(labels[j] + ': ' + str(prediction[i][j]))\n";
		} else {
			python_code += "import re\n";
			python_code += "from pprint import pprint\n";
			python_code += "import numpy as np\n";
			python_code += "def get_shape (filename):\n";
			python_code += "    with open(filename) as f:\n";
			python_code += "        first_line = f.readline()\n";
			python_code += "        match = re.search(r'shape: \\((.*)\\)', first_line)\n";
			python_code += "        return eval('[' + match[1] + ']')\n";
			python_code += "x = np.loadtxt('x.txt').reshape(get_shape('x.txt'))\n";
			python_code += "pprint(model.predict(x))\n";
		}

		if(input_shape_is_image_val) {
			python_code += `
if len(sys.argv) == 1:
    import cv2

    cap = cv2.VideoCapture(0)

    while True:
	# Capture frame-by-frame
	ret, frame = cap.read()

	if not ret:
	    import sys
	    print("Could not load frame from webcam. Is the webcam currently in use?")
	    sys.exit(1)

	# Preprocess the frame
	image = load_frame(frame)

	# Make predictions
	predictions = model.predict(image)

	highest_index = np.argmax(predictions[0])

	# Get the class with highest probability

	# Add label to the frame
	for i in range(0, len(labels)):
	    prediction = labels[i]
	    text = str(prediction) + " (" + str(predictions[0][i]) + ")"
	    x = 10
	    y = (i + 1) * 30
	    color = (255, 0, 0)
	    if i == highest_index:
		color = (0, 255, 0)
	    cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

	# Display the resulting frame
	cv2.imshow('frame', frame)
	if cv2.waitKey(1) & 0xFF == ord('q'):
	    break

    # When everything done, release the capture
    cap.release()
    cv2.destroyAllWindows()
`;
		}

		return python_code;
	}

	async #highlight_code () {
		if(typeof(Prism) == "undefined") {
			this.wrn(`Prism not found! Cannot do syntax highlighting!`);
			return;
		}


		Prism.highlightAll();
	}

	async #identify_layers () {
		var number_of_layers = $("div.container.layer").length;

		//console.trace();
		this.#has_zero_output_shape = false;

		var failed = 0;
		for (var i = 0; i < number_of_layers; i++) {
			$($(".layer_nr_desc")[i]).html(i + ":&nbsp;");
			var new_str = this.#get_layer_identification(i);

			if(new_str != "") {
				new_str = new_str + ",&nbsp;";
			}

			var output_shape_string = "";
			try {
				if(this.#model && this.#model.layers && this.#model.layers.length >= i) {
					try {
						this.#model.layers[i].input.shape;
					} catch(e) {
						this.err("Model has multi-node inputs. It should not have!!! Continuing anyway, but please, debug this!!!");
					}

					var shape = JSON.stringify(this.#model.layers[i].getOutputAt(0).shape);
					if(/((\[|,)\s*)\s*0\s*((\]|,)\s*)/.test(shape) || /\[\s*(0,?\s*?)+\s*\]/.test(shape)) {
						output_shape_string = "<span style='background-color: red'>Output:&nbsp;" + shape + "</span>";
						output_shape_string = output_shape_string.replace("null,", "");
						this.#has_zero_output_shape = true;
					} else {
						output_shape_string = "Output:&nbsp;" + shape;
						output_shape_string = output_shape_string.replace("null,", "");
					}
				} else {
					this.dbg(`#identify_layers: i = ${i} is not in this.#model.layers. This may happen when the model is recompiled during this step and if so, is probably harmless.`);
				}

				if(this.#has_zero_output_shape) {
					var basemsg = "ERROR: There are zeroes in the output shape. ";
					var msg = basemsg + "The input shape will be resettet the the last known working configuration.";

					this.#disable_train();

					throw new Error(msg);

					return;
				} else {
					this.#enable_train();
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				if(("" + e).includes("model is null")) {
					this.err("" + e);
				} else {
					throw new Error(e);
				}

				return;
			}

			var activation_function_string = "";
			try {
				if(this.#model && this.#model.layers && i in this.#model.layers) {
					var this_layer = $($(".layer")[i]);
					var act = $(this_layer.find(".activation")).val();
					if("" + act != "undefined") {
						activation_function_string = ", " + act;
					}
				}
			} catch (e) {
				throw new Error(e);
			}

			if(this.#layer_is_red(i)) {
				failed++;
				this.#write_layer_identification(i, "<span class='layer_identifier_activation'></span>");
			} else {
				this.#write_layer_identification(i + failed, new_str + output_shape_string + "<span class='layer_identifier_activation'>" + activation_function_string + "</span>");
			}
		}

		if(!this.#has_zero_output_shape) {
			this.#shown_has_zero_data = false;
		}

	}

	#enable_train () {
		$(".train_neural_network_button").prop("disabled", false);
	}

	#disable_train () {
		$(".train_neural_network_button").prop("disabled", true);
	}

	#layer_is_red (layer_nr) {
		this.assert(typeof(layer_nr) == "number", "layer_nr is not a number but " + layer_nr + "(" + typeof(layer_nr) + ")");
		var color = $($("div.container.layer")[layer_nr]).css("background-color")

		if(color == "rgb(255, 0, 0)") {
			return true;
		}

		return false;
	}

	#write_layer_identification (nr, text) {
		if(text.length) {
			$($(".layer_identifier")[nr]).html(text);
		} else {
			$($(".layer_identifier")[nr]).html("");
		}

	}

	get_data_for_layer (type, i, first_layer) {
		this.assert(typeof(type) == "string", type + " is not a string but " + typeof(type));
		this.assert(typeof(i) == "number", i + " is not a number but " + typeof(i));
		this.assert(typeof(first_layer) == "boolean", first_layer + " is not a boolean but " + typeof(first_layer));

		var data = {
			"name": type + "_" + (i + 1)
		};

		if(i == 0 || first_layer) {
			data["inputShape"] = this.get_input_shape();
		}

		for (var j = 0; j < this.#layer_options[type]["options"].length; j++) {
			var option_name = this.#layer_options[type]["options"][j];
			this.assert(typeof(option_name) == "string", option_name + " is not string but " + typeof(option_name));

			if(["pool_size", "kernel_size", "strides"].includes(option_name)) {
				if(type.endsWith("1d")) {
					data[this.#get_js_name(option_name)] = [this.#parse_int(this.#get_item_value(i, option_name + "_x"))];
				} else if(type.endsWith("2d")) {
					data[this.#get_js_name(option_name)] = [this.#parse_int(this.#get_item_value(i, option_name + "_x")), this.#parse_int(this.#get_item_value(i, option_name + "_y"))];
				} else if(type.endsWith("3d")) {
					data[this.#get_js_name(option_name)] = [this.#parse_int(this.#get_item_value(i, option_name + "_x")), this.#parse_int(this.#get_item_value(i, option_name + "_y")), this.#parse_int(this.#get_item_value(i, option_name + "_z"))];
				} else if(type.endsWith("2dTranspose")) {
					data[this.#get_js_name(option_name)] = [this.#parse_int(this.#get_item_value(i, option_name + "_x")), this.#parse_int(this.#get_item_value(i, option_name + "_y"))];
				} else {
					alert("Unknown layer type: " + type);
				}
			} else if(["trainable", "use_bias"].includes(option_name) ) {
				try {
					data[this.#get_js_name(option_name)] = this.#get_item_value(i, option_name);
				} catch (e) {
					if(Object.keys(e).includes("message")) {
						e = e.message;
					}

					if(("" + e).includes("identifier starts immediately after numeric literal")) {
						this.err("" + e);
					} else {
						throw new Error(e);
					}
				}

			} else if(["size", "dilation_rate"].includes(option_name)) {
				var dil_rate = this.#get_item_value(i, option_name);

				dil_rate = dil_rate.replace(/[^0-9,]/g, "");

				var code_str = "[" + dil_rate + "]";

				data[this.#get_js_name(option_name)] = eval(code_str);

			} else if(option_name == "rate") {
				data["rate"] = this.#parse_float(this.#get_item_value(i, "dropout"));

			} else if(["epsilon", "momentum", "dropout_rate"].includes(option_name)) {
				data[this.#get_js_name(option_name)] = this.#parse_float(this.#get_item_value(i, option_name));

			} else if(option_name == "activation" && $($($($(".layer_setting")[i]).find("." + option_name)[0])).val() == "None") {
				// Do nothing if activation = None
				data["activation"] = null;

			} else if (this.#valid_initializer_types.includes(this.#get_key_name_camel_case(this.get_weight_type_name_from_option_name(option_name))) && option_name.includes("nitializer")) {
				var weight_type = this.get_weight_type_name_from_option_name(option_name);

				var initializer_name = this.#get_item_value(i, weight_type + "_initializer");
				if(initializer_name) {
					var initializer_config = this.get_layer_initializer_config(i, weight_type);
					var initializer_config_string = JSON.stringify(initializer_config);
					data[this.#get_key_name_camel_case(weight_type) + "Initializer"] = {"name": initializer_name, "config": initializer_config};
				}
			} else if (this.#valid_initializer_types.includes(this.#get_key_name_camel_case(this.get_weight_type_name_from_option_name(option_name))) && option_name.includes("egularizer")) {
				var weight_type = this.get_weight_type_name_from_option_name(option_name);
				var regularizer_name = this.#get_item_value(i, weight_type + "_regularizer");
				if(regularizer_name) {
					var regularizer_config = this.#get_layer_regularizer_config(i, weight_type);
					var regularizer_config_string = JSON.stringify(regularizer_config);
					data[this.#get_key_name_camel_case(weight_type) + "Regularizer"] = {"name": regularizer_name, "config": regularizer_config};
				}

			} else {
				var elem = $($($(".layer_setting")[i]).find("." + option_name)[0]);
				var value = $(elem).val();

				if($(elem).is(":checkbox")) {
					data[this.#get_js_name(option_name)] = value == "on" ? true : false;
				} else {
					if(value == "") {
						if(!option_name.includes("constraint")) {
							this.wrn("[get_data_for_layer] Something may be wrong here! Value for '" + option_name.toString() + "' is ''");
						}
					} else {
						data[this.#get_js_name(option_name)] = this.#is_numeric(value) ? this.#parse_float(value) : value;
					}
				}
			}
		}

		delete data["visualize"];

		return data;
	}

	async get_model_structure () {
		var first_layer = true; // seperate from i because first layer may be input layer (which is not a "real" layer)
		var structure = [];

		var num_of_layers = this.#model.layers.length;

		this.assert(num_of_layers >= 1, "number of layers must be at least 1 or more");

		for (var i = 0; i < num_of_layers; i++) {
			var layer_type = $($($(".layer_setting")[i]).find(".layer_type")[0]);
			var type = $(layer_type).val();

			if(typeof(type) !== "undefined" && type) {
				var data = this.get_data_for_layer(type, i, first_layer);

				try {
					var layer_info = {
						"type": type,
						"data": data
					};
					structure.push(layer_info);

					first_layer = false;
				} catch (e) {
					this.wrn("[get_model_structure] Failed to add layer type ", type, ": ", e);
					header("DATA:");
					this.log(data);
					$($(".warning_container")[i]).show();
					$($(".warning_layer")[i]).html(e);

				}

				this.dbg("tf.layers." + type + "(", data, ")");
			} else {
				if(this.#finished_loading) {
					this.wrn(`[get_model_structure] Empty for layer ${i}`)
				}
			}
		}

		await this.#write_descriptions();

		this.#layer_structure_cache = JSON.stringify(structure);

		return structure;
	}

	#enable_start_training_custom_tensors() {
		if (!this.#data_origin == "tensordata") {
			return;
		}

		this.#enable_train();

		if (this.#x_file && this.#y_file) {
			var last_layer_warning_container = $($(".warning_container")[this.#model.layers.length]);
			if (eval($("#outputShape").val()).join(",") == get_full_shape_without_batch(this.#y_file).join(",")) {
				this.#special_reason_disable_training = false;
				last_layer_warning_container.html("").hide();
			} else {
				this.#special_reason_disable_training = true;
				last_layer_warning_container.html(
					"The last layer's output shape does not conform with the provided Y-data's shape. " +
					"Try changing the number of neurons, so that the output becomes [null" +
					get_full_shape_without_batch(this.#y_file).join(",") + "]"
				);

				last_layer_warning_container.show();
				disable_train();
			}
		}
	}

	async #last_shape_layer_warning() {
		if (this.#data_origin == "image") {
			if (!model) {
				this.log("last_layer_shape_warning is waiting for the this.#model...");
				while (!model) {
					await this.delay(200);
				}
			}
			if (model.outputShape.length == 2) {
				is_classification = true;
				delete_custom_drawing_layer();
				$("#last_layer_shape_warning").html("");
			} else {
				if (model.outputShape.length != 4) {
					var n = $(".own_image_label").length;
					$("#last_layer_shape_warning").html("<h3>The last layer's output shape's length is neither 2 (for classification) nor 4 (for segmentation). Please add a flatten-layer somewhere before the output layer (which has to be Dense) to allow classification into " + n + " categories. Training will not be possible otherwise.</h3>");
				} else {
					$("#last_layer_shape_warning").html("");
					var all_current_custom_images = $(".own_image_span");
					for (var i = 0; i < all_current_custom_images.length; i++) {
						var canvasses = $(all_current_custom_images[i]).find("img,canvas");

						for (var j = 0; j < canvasses.length; j++) {
							var this_canvas_id = canvasses[j].id;
							if(!this_canvas_id.endsWith("_layer")) {
								var base_id = btoa(await this.#md5(this.get_element_xpath(canvasses[j]))).replaceAll("=", "");
								var new_canvas_id = base_id + "_layer";
								if($(new_canvas_id).length == 0) {
									this.log("Drawing layer for custom image " + this_canvas_id + ", new_canvas_id: " + new_canvas_id);
									add_canvas_layer(canvasses[j], 0.5, base_id);
								}
							}
						}
					}
				}
			}
		} else {
			$("#last_layer_shape_warning").html("");
		}
	}

	#allow_training() {
		if (this.#_allow_training()) {
			this.#enable_train();
		} else {
			this.#disable_train();
		}
	}

	#_allow_training() {
		if(this.#has_missing_values) {
			return false;
		}

		if(this.#has_zero_output_shape) {
			return false;
		}

		var data_origin = this.#data_origin;

		if (data_origin == "default") {
			return true;
		}

		if (data_origin == "image") {
			var number_of_training_images = $(".own_images").children().length;
			if (number_of_training_images) {
				return true;
			} else {
				return false;
			}
		} else if (data_origin == "csv") {
			return this.#csv_allow_training;
		} else if (data_origin == "tensordata") {
			if (special_reason_disable_training) {
				return false;
			} else {
				if (x_file && y_file) {
					return true;
				} else {
					return false;
				}
			}
		}

	}

	#allow_editable_labels () {
		$(".label_element").each((i, x) => {
			var label_index = this.#parse_int($(x).parent().parent().find(".label_element").index(x)) % this.#labels.length;

			if(!this.#labels.length) {
				//wrn("labels is an array, but is empty.");
				return;
			}

			try {
				var tmp_label = this.#labels[label_index];
				if(tmp_label === undefined) {
					this.wrn("[allow_editable_labels] tmp_label undefined");
					return;
				}

				if(label_index === undefined) {
					var tmp_label = $(x).text();
					$(x).html(`<input id="${this.#uuidv4()}" class='label_input_element' type='text' value='${tmp_label}' onchange='${this.#asanai_object_name}.update_label_by_nr(this, ${label_index})' />`);
					return;
				}

				tmp_label = tmp_label.replaceAll(/'/g, "");
				if(tmp_label) {
					if($(x).children().length && $(x).children()[0].nodeName == "INPUT") {
						$(x).find("input").val(tmp_label);
					} else {
						$(x).html(`<input id="${this.#uuidv4()}" class='label_input_element' type='text' value='${tmp_label}' onchange='${this.#asanai_object_name}.update_label_by_nr(this, ${label_index})' />`);
					}
				} else {
					tmp_label = $(x).text();
					$(x).html(`<input id="${this.#uuidv4()}" class='label_input_element' type='text' value='${tmp_label}' onchange='${this.#asanai_object_name}.update_label_by_nr(this, ${label_index})' />`);
				}
			} catch (e) {
				if(("" + e).includes("tmp_label.replaceAll is not a function")) {
					this.wrn("[allow_editable_labels] This may be the case if you have data from a CSV. If this is the case, this warning can most likely be ignored.");
				} else {
					this.err(e);
				}
			}
		});
	}

	async #insert_initializer_options (layer_nr, initializer_type) {
		this.assert(this.#valid_initializer_types.includes(initializer_type), "insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
		this.assert(typeof (layer_nr) == "number", "layer_nr must be of the type of number but is: " + typeof (layer_nr));

		var max_layer = this.#model.layers.length;

		if(!(layer_nr >= 0 && layer_nr <= max_layer)) {
			this.dbg(`Invalid layer number: max_layer: ${max_layer}, layer_nr: ${layer_nr}`);
			return;
		}

		var existing_init_elements = $($(".layer_options_internal")[layer_nr]).find("." + initializer_type + "_initializer_tr");

		var initializer = $($(".layer_options_internal")[layer_nr]).find("." + initializer_type + "_initializer");

		var initializer_name = initializer.val();

		if(existing_init_elements.length) {
			var number_of_removed_items = 0;

			var options = this.#initializer_options[initializer_name]["options"];

			var prev_classes = [];

			for (var i = 0; i < existing_init_elements.length; i++) {
				var remove = true;

				try {
					var this_initializer_class_type = this.#findInitializerElement($($(existing_init_elements[i])[0]).find("input")[0].classList);

					var this_initializer_type = this_initializer_class_type.replace(/.*_initializer_/, "");

					if(options.includes(this_initializer_type) && prev_classes.includes(this_initializer_type)) {
						remove = false;
					} else {
						prev_classes.push(this_initializer_type);

					}
				} catch (e) {

				}

				if(remove) {
					$(existing_init_elements[i]).remove();
					number_of_removed_items++;
				}
			}


			if(number_of_removed_items == 0) {
				return;
			}
		}


		if(initializer_name) {
			var options = this.#initializer_options[initializer_name]["options"];

			for (var i = 0; i < options.length; i++) {
				this.#insert_initializer_option_trs(layer_nr, initializer_type, options[i]);
			}
		}
	}

	#findInitializerElement(arr) {
		for (let i = 0; i < arr.length; i++) {
			if (typeof arr[i] === 'string' && arr[i].includes('_initializer_')) {
				return arr[i];
			}
		}
		return null; // Return null if no matching element is found
	}

	#insert_initializer_option_trs(layer_nr, initializer_type, option_type) {
		this.assert(this.#valid_initializer_types.includes(initializer_type), "#insert_initializer_option_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)");
		this.assert(["seed", "mean", "stddev", "value", "mode", "distribution", "minval", "maxval", "scale", ...this.#valid_initializer_types].includes(option_type), "invalid option type " + option_type);
		this.assert(typeof (layer_nr) == "number", "Layer number's type must be number, is: " + typeof (layer_nr));

		var asanai_this = this;

		var function_name = `asanai_this.#add_${initializer_type}_initializer_${option_type}_option`;

		var eval_string = `$(${function_name}($($(".layer_type")[${layer_nr}]).val(), ${layer_nr})).
			insertAfter($($(".layer_setting")[${layer_nr}]).
				find(".${initializer_type}_initializer").
				parent().
				parent()
			)
		`;

		//console.log(eval_string);

		eval(eval_string);

	}

	#add_kernel_initializer_seed_option (type, nr) {
		this.assert(typeof(type) == "string", "type is not a string #add_kernel_initializer_seed_option, but " + typeof(type) + ", " + type);
		this.assert(typeof(nr) == "number", "nr is not a number for #add_kernel_initializer_seed_option, but " + typeof(type) + ", " + type);
		return this.#get_tr_str_for_layer_table('Seed', 'kernel_initializer_seed', 'number', { 'value': 1 }, nr, 'kernel_initializer_tr');
	}

	#add_bias_initializer_seed_option (type, nr) {
		this.assert(typeof(type) == "string", "type is not a string add_bias_initializer_seed_option, but " + typeof(type) + ", " + type);
		this.assert(typeof(nr) == "number", "nr is not a number for add_bias_initializer_seed_option, but " + typeof(type) + ", " + type);
		return this.#get_tr_str_for_layer_table('Seed', 'bias_initializer_seed', 'number', { 'value': 1 }, nr, 'bias_initializer_tr');
	}

	#disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode () {
		try {
			if(this.#model && !(this.#model.isTraining || this.#started_training)) {
				this.#enable_every_layer();
			}

			if(this.#mode == "beginner") {
				var last_element_nr = $(".layer_setting").length - 1;
				var last_layer_setting = $($(".layer_setting")[last_element_nr]);

				$($(".configtable")[$(".configtable").length - 1]).find("input,select,button").prop("disabled", true);

				last_layer_setting.find("button").prop("disabled", true);
				last_layer_setting.find(".show_data").prop("disabled", false);
				last_layer_setting.find(".visualize_layer_button").prop("disabled", false);
				last_layer_setting.find(".remove_layer").prop("disabled", true);
				last_layer_setting.find(".add_layer").prop("disabled", false);

				this.#disable_flatten_layer();

				//l("Disabling last layer in beginner mode");
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode] " + e);
		}

	}

	#enable_every_layer () {
		$(".configtable").find("input,select,button").prop("disabled", false);
		$(".layer_setting").find("button").prop("disabled", false);
	}

	#disable_flatten_layer () {
		if(!this.#model) {
			if(this.#finished_loading) {
				this.wrn("[#disable_flatten_layer] No model found");
			}
			return;
		}

		if(!Object.keys(this.#model).includes("layers") || !this.#model.layers.length) {
			if(this.#finished_loading) {
				this.wrn("[#disable_flatten_layer] No layers found");
			}
			return;
		}

		try {
			var flatten_layer = null;
			for (var i = 0; i < this.#model.layers.length; i++) {
				if(!flatten_layer && this.#model.layers[i].name.startsWith("flatten")) {
					flatten_layer = i;
				}
			}

			if(flatten_layer !== null) {
				$($(".layer_setting")[flatten_layer]).find(".remove_layer").prop("disabled", true);
			}
		} catch (e) {
			throw new Error(e);
		}

	}

	#sortable_layers_container(layers_container) {
		this.assert(typeof (layers_container) == "object", "layers_container is not an object but " + typeof (layers_container));

		var _error_div = $("#error");

		layers_container.sortable({
			cursor: "move",
			handle: "div",
			helper: "clone",
			forcePlaceholderSize: true,
			placeholder: "placeholder",
			start: function (e, ui) {
				ui.placeholder.height(ui.item.height());
				ui.placeholder.css("visibility", "visible");
				$(".descriptions_of_layers").hide();
			},
			update: async function (e, ui) {
				try {
					await this.#compile_model();
					_error_div.html("");
					_error_div.parent().hide();
				} catch (e) {
					if (this.#mode == "beginner") {
						$("#" + this.#layers_gui_div_name).sortable("cancel");
						alert("Dropping this layer there causes the this.#model.compile command to fail. Reverting this drop:\n" + e);
						try {
							await this.#compile_model();
						} catch (e) {
							this.log(e);
						}
						_error_div.html("");
						_error_div.parent().hide();
					} else {
						_error_div.html(e);
						_error_div.parent().show();
					}
				}

				$(".descriptions_of_layers").show();
				await this.updated_page();
			},
			axis: "y",
			revert: true
		});

		layers_container.droppable({
			tolerance: "pointer"
		});

	}

	async remove_layer(item) {
		this.assert(typeof (item) == "object", "item is not an object but " + typeof (item));

		var number_of_layers = this.#model.layers.length;

		if (old_value > 1) {
			$($(item).parent()[0]).parent().remove();

			this.#layer_structure_cache = null;

			await this.updated_page();
			disable_all_non_selected_layer_types();

			if (this.#get_number_of_layers() == 1) {
				$(".remove_layer").prop("disabled", true).hide();
			} else {
				$(".remove_layer").prop("disabled", false).show();
			}
			await save_current_status();
		} else {
			Swal.fire({
				icon: "error",
				title: "Oops [2]...",
				text: "You cannot remove the last remaining layer of your this.#model.",
			});
		}

		await this.#write_descriptions();
		//rename_labels();
		await predict_handdrawn();

		this.#disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

		this.log("Removed layer");
	}

	async add_layer(item) {
		this.assert(typeof (item) == "object", "item is not an object but " + typeof (item));

		this.#layer_structure_cache = null;

		var real_nr = null;

		var item_xpath = this.get_element_xpath(item);

		var add_layer_buttons = $(".add_layer");
		for (var nr = 0; nr < add_layer_buttons.length; nr++) {
			var elem = add_layer_buttons[nr];
			if (item_xpath == this.get_element_xpath(elem)) {
				real_nr = nr;
			}
		}

		this.assert(real_nr !== null, "real_nr is null!");

		var nr_of_layer = (this.#get_number_of_layers() - 1);

		var item_parent_parent = $(item).parent().parent();

		var plus_or_minus_one = 1;

		try {
			if(real_nr == nr_of_layer) { // insert before last layer
				item_parent_parent.clone().insertBefore(item_parent_parent);
				plus_or_minus_one = 0;
			} else {
				item_parent_parent.clone().insertAfter(item_parent_parent);
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err("[add_layer] " + e);
		}

		var previous_layer_type = $($($($(".layer_setting")[real_nr])).find(".layer_type")[0]).val();
		var new_layer_type = previous_layer_type;
		if (new_layer_type == "flatten") {
			new_layer_type = "dense";
		}
		$($($($(".layer_setting")[real_nr + plus_or_minus_one])).find(".layer_type")[0]).val(new_layer_type).trigger("change");

		await this.updated_page();

		await this.#write_descriptions();

		$(".remove_layer").prop("disabled", false);
		$(".remove_layer").show();

		$($(".remove_layer")[real_nr + plus_or_minus_one]).removeAttr("disabled")

		//await rename_labels();
		//await predict_handdrawn();

		this.#disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();

		this.log("Added layer");
	}


	#swap_image_src_language () {
		// Get all image elements on the page
		const images = document.getElementsByTagName("img");

		// Loop through each image element
		for (var i = 0; i < images.length; i++) {
			const img = images[i];
			const currentSrc = img.getAttribute("src");

			if (this.#lang === "en" && currentSrc.startsWith("lang/__de__")) {
				// Replace 'de' with 'en'
				const newSrc = currentSrc.replace(/__de__/, "__en__");
				img.setAttribute("src", newSrc);
			} else if (this.#lang === "de" && currentSrc.startsWith("lang/__en__")) {
				// Replace 'en' with 'de'
				const newSrc = currentSrc.replace(/__en__/, "__de__");
				img.setAttribute("src", newSrc);
			} else if (this.#lang === "en" && currentSrc.startsWith("presentation/de/")) {
				// Replace 'de' with 'en'
				const newSrc = currentSrc.replace(/\/de\//, "/en/");
				img.setAttribute("src", newSrc);
			} else if (this.#lang === "de" && currentSrc.startsWith("presentation/en/")) {
				// Replace 'en' with 'de'
				const newSrc = currentSrc.replace(/\/en\//, "/de/");
				img.setAttribute("src", newSrc);
			}
		}
	}

	#set_cookie(name, value, days = 365) {
		var expires = "";
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = "; expires=" + date.toUTCString();
		}

		// Set SameSite and secure attributes
		var cookieOptions = "; SameSite=None; secure";

		document.cookie = name + "=" + (value || "") + expires + "; path=/" + cookieOptions;
	}

	async set_lang(la) {
		if(typeof(la) == "string") {
			if(Object.keys(this.#language).includes(la)) {
				this.#lang = la;
				this.#set_cookie("lang", la, 30); // Save the language in a cookie for 30 days
				await this.#update_translations();

				this.#swap_image_src_language();
			} else {
				throw new Error(`Language "${la}" could not be found!`);
			}
		} else {
			throw new Error(`set_lang: parameter must be string, but is ${typeof(la)}`);
		}
	}

	get_lang_cookie () {
		const cookies = document.cookie.split(";");
		for (var i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.startsWith(this.#lang_cookie_name + "=")) {
				return cookie.substring(this.#lang_cookie_name.length + 1);
			}
		}
		return "en";
	}

	#set_lang_cookie(value, days) {
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate() + days);
		const cookieValue = encodeURIComponent(value) + "; expires=" + expirationDate.toUTCString() + "; path=/";
		document.cookie = this.#lang_cookie_name + "=" + cookieValue;
	}

	async #update_translations(force=0) {
		var elements = document.querySelectorAll("[class^=\"TRANSLATEME_\"]");
		elements.forEach((element) => {
			const translationKey = element.classList[0].substring(12);
			const translation = this.#language[this.#lang][translationKey];
			if (translation) {
				if($(element).attr("data-lang") != this.#lang || force) {
					element.innerHTML = translation;

					$(element).attr("data-lang", this.#lang);
				}
			} else {
				console.trace();
				console.error("Could not translate " + translationKey + " to " + this.#lang);
			}

		});
	}

	async #update_lang(la) {
		this.#lang = la;
		await this.#update_translations();
		this.#set_lang_cookie(this.#lang, 99999);
	}

	trm (name) {
		if(Object.keys(this.#language[this.#lang]).includes(name)) {
			return `<span class='TRANSLATEME_${name}'></span>`;
		}

		alert(`${name} NOT FOUND`);

		return `${name} NOT FOUND`;
	}

	_get_new_translations () {
		var url = "translations.php?print=1";

		function parse(data) {
			try {
				this.#language = JSON.parse(data);

				this.#update_translations(1); // await not possible
			} catch (e) {
				this.#write_error(e); // await not possible
			}
		}

		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'html',
			success: parse
		});
	}

	find_layer_number_by_element(element) {
		function isChildElement(child, _parent) {
			let currentElement = child;

			while (currentElement !== null) {
				if (currentElement === _parent) {
					return true;
				}
				currentElement = currentElement.parentElement;
			}

			return false;
		}

		var element_xpath = this.get_element_xpath(element);

		this.assert(typeof(element_xpath) == "string", `find_layer_number_by_element: xpath from element is not type string but ${typeof(element_xpath)}`);

		var layer_setting = $(".layer_setting");

		for (var i = 0; i < layer_setting.length; i++) {
			var _ls = layer_setting[i];

			if(isChildElement(element, _ls)) {
				return i;
			}
		}

		this.err(`find_layer_number_by_element could not find xpath from element!`);

		return;

		/*
		var item_parent = element;

		while (!$(item_parent).hasClass("layer_setting")) {
			item_parent = $(item_parent).parent();
			if (this.get_element_xpath($("body")[0]) == this.get_element_xpath(item_parent[0])) {
				this.#write_error("Infinite recursion"); // cannot be async
				return;
			}
		}

		item_parent = $(item_parent).parent();

		var item_parent_xpath = this.get_element_xpath(item_parent[0]);
		var nr = null;

		$("#" + this.#layers_gui_div_name).children().each(function (counter, element) {
			if (this.get_element_xpath(element) == item_parent_xpath) {
				nr = counter;
			}
		});

		return nr;
		*/
	}

	async disable_invalid_layers_event(e, thisitem) {
		this.assert(typeof (e) == "object", "disable_all_invalid_layers(e -> " + e + " is not an object but " + typeof (e));
		this.assert(typeof (thisitem) == "object", "disable_all_invalid_layers(e, thisitem -> " + thisitem + " is not an [object HTMLSelectElement] but " + typeof (thisitem));

		e.preventDefault();
		var layer_nr = null;

		layer_nr = this.find_layer_number_by_element(thisitem);

		await this.#enable_valid_layer_types(layer_nr);
	}

	async #enable_valid_layer_types(layer_nr) {
		if(this.#started_training && !this.#is_repairing_output_shape) {
			this.info("#enable_valid_layer_types disabled because is in training");
			return;
		}

		this.assert(typeof (layer_nr) == "number", "#enable_valid_layer_types(" + layer_nr + ") is not a number but " + typeof (layer_nr));

		if(this.#is_repairing_output_shape) {
			this.#enable_all_layer_types();
			return;
		}

		var valid_layer_types = await this.#get_valid_layer_types(layer_nr);

		var options = $($($(".layer_type")[layer_nr]).children().children());

		for (var i = 0; i < options.length; i++) {
			if (!$(options[i]).is(":selected")) {
				$(options[i]).prop("disabled", true);
			}

			if (valid_layer_types.includes($(options[i]).prop("value"))) {
				$(options[i]).prop("disabled", false);
			}
		}
	}

	#enable_all_layer_types () {
		if(!this.#model || !Object.keys(this.#model).includes("layers") || !this.#model.layers.length) {
			this.err("model not found, or does not include layers or layers are empty");
			return;
		}

		for (var layer_nr = 0; layer_nr < this.#model.layers.length; layer_nr++) {
			var options = $($($(".layer_type")[layer_nr]).children().children());

			for (var i = 0; i < options.length; i++) {
				if (!$(options[i]).is(":selected")) {
					$(options[i]).prop("disabled", true);
				}

				$(options[i]).prop("disabled", false);
			}
		}
	}

	#layer_type_always_works (layer_type) {
		var res = !!(["dense", "reshape", "dropout", "GaussianNoise", "gaussianDropout", "DebugLayer"].includes(layer_type) || ["Activation", "Noise"].includes(this.#layer_options[layer_type].category));

		return res;
	}

	async #get_valid_layer_types (layer_nr) {
		this.assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));

		var valid_layer_types = [];

		$("body").css("cursor", "wait");

		var checked_layers = false;

		for (var i = 0; i < this.#layer_names.length; i++) {
			var layer_type = this.#layer_names[i];
			if(this.#mode == "expert") {
				valid_layer_types.push(layer_type);
			} else {
				if(this.#layer_type_always_works(layer_type)) {
					valid_layer_types.push(layer_type);
				} else {
					var percent = (((i + 1) / this.#layer_names.length) * 100).toFixed(0);
					var pb_string = "Checking " + layer_type + " (" + percent + "%)";
					this.log(pb_string);
					if(this.#heuristic_layer_possibility_check(layer_nr, layer_type)) {
						//log("Testing " + layer_type);
						var compiled_fake_model = await this.#compile_fake_model(layer_nr, layer_type);
						if(compiled_fake_model) {
							valid_layer_types.push(layer_type);
						}
					}
					checked_layers = true;
				}
				await this.#write_descriptions();
			}
		}
		await this.#write_descriptions();

		if(checked_layers) {
			this.log("Checked possible layer types");
		}

		$("body").css("cursor", this.#get_cursor_or_none("default"));

		this.#allowed_layer_cache[layer_nr] = valid_layer_types;

		return valid_layer_types;
	}

	async update_label_by_nr (t, nr) {
		var name = $(t).val();

		var t_xpath = this.get_element_xpath(t);

		this.#labels[nr] = name;

		$(".label_element").each((i, x) => {
			if(1 || this.get_element_xpath(x) != t_xpath) {
				var label_index = this.#parse_int($(x).parent().parent().find(".label_element").index(x)) % this.#labels.length;

				if(label_index == nr) {
					if($(x).children().length && $(x).children()[0].nodeName == "INPUT") {
						$(x).find("input").val(name);
					} else {
						$(x).html(`<input class='label_input_element' type='text' value='${name}' onchange='${this.#asanai_object_name}.update_label_by_nr(${label_index}, $(this).val())' />`);
					}
				}
			}
		});

		$($(".own_image_label")[nr]).val(name);

		await this.#update_python_code(1);
	}

	#_heuristic_layer_possibility_check(layer_type, layer_input_shape) {
		if(["conv1d", "conv2d", "conv2dTranspose", "upSampling2d", "conv3d", "depthwiseConv2d", "separableConv2d", "averagePooling1d", "averagePooling2d", "averagePooling3d", "globalMaxPooling1d", "globalMaxPooling2d", "maxPooling1d", "maxPooling2d", "maxPooling3d", "globalAveragePooling1d"].includes(layer_type)) {
			if(["conv1d", "averagePooling1d", "globalMaxPooling1d", "maxPooling1d", "globalAveragePooling1d"].includes(layer_type)) {
				if(layer_input_shape.length == 2) {
					return true;
				}
				return false;
			} else if(["conv2d", "conv2dTranspose", "upSampling2d", "depthwiseConv2d", "separableConv2d", "averagePooling2d", "globalMaxPooling2d", "maxPooling2d"].includes(layer_type)) {
				if(layer_input_shape.length == 3) {
					return true;
				}
				return false;
			} else if(["conv3d", "averagePooling3d", "maxPooling3d", "globalAveragePooling2d", "zeroPadding2d"].includes(layer_type)) {
				if(layer_input_shape.length == 4) {
					return true;
				}
				return false;
			}
		} else if(["globalAveragePooling2d", "zeroPadding2d"].includes(layer_type)) {
			if(["globalAveragePooling2d", "zeroPadding2d"].includes(layer_type)) {
				if(layer_input_shape.length == 3) {
					return true;
				}
				return false;
			}

		} else if(["gru"].includes(layer_type)) {
			if(layer_type == "gru" && layer_input_shape.length < 2) {
				return false;
			}
		} else if(["ZeroPadding2D"].includes(layer_type)) {
			if(layer_type == "gru" && layer_input_shape.length != 4) {
				return false;
			}
		}

		if(this.#mode == "beginner" && ["reshape"].includes(layer_type)) {
			return false;
		}

		return true;
	}

	#heuristic_layer_possibility_check (layer_nr, layer_type) {
		this.assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
		this.assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

		var layer_input_shape = this.#calculate_default_target_shape(layer_nr);

		if(layer_type == "flatten") {
			if(layer_input_shape.length > 1) {
				return true;
			} else {
				return false;
			}
		}

		var res = this.#_heuristic_layer_possibility_check(layer_type, layer_input_shape);

		return res;
	}

	#is_touch_device () {
		var res = (("ontouchstart" in window) ||
			(navigator.maxTouchPoints > 0) ||
			(navigator.msMaxTouchPoints > 0));

		if(!res) {
			res = !!window.matchMedia("(pointer: coarse)").matches;
		}
		return res;
	}

	#is_tablet () {
		const userAgent = navigator.userAgent.toLowerCase();
		const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);

		return isTablet;
	}

	#get_cursor_or_none (cursorname) {
		try {
			if(this.#is_touch_device() && this.#is_tablet()) {
				return "none";
			}
		} catch (e) {
			if(("" + e).includes("#is_touch_device is not defined")) {
				return cursorname;
			}
		}

		return cursorname;
	}

	async get_fake_data_for_layertype (layer_nr, layer_type) {
		this.assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
		this.assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));
		this.assert(Object.keys(this.#layer_options).includes(layer_type), "Unknown layer type " + layer_type);

		await this.#write_descriptions();

		var data = {};

		var options = this.#layer_options[layer_type]["options"];

		if(layer_nr == 0) {
			data["inputShape"] = this.get_input_shape();
		}

		for (var i = 0; i < options.length; i++) {
			var this_option = options[i];

			var js_option_name = undefined;
			if (this_option in this.#python_names_to_js_names) {
				js_option_name = this.#python_names_to_js_names[this_option];
			} else if (this_option.startsWith("strides")) {
				js_option_name = "strides";
			} else if (this_option.startsWith("kernel_size")) {
				js_option_name = "kernelSize";
			} else if (this_option == "dropout") {
				js_option_name = "rate";
			} else if (this_option.startsWith("pool_size")) {
				js_option_name = "poolSize";
			} else if (this_option == "dropout_rate") {
				js_option_name = "dropoutRate";
			} else if(this_option == "visualize") {
				// left emtpy on purpose
			}

			if(js_option_name) {
				var default_value = this.#get_default_option(layer_type, this.#js_names_to_python_names[js_option_name]);

				if(js_option_name === undefined) {
					this.wrn("Cannot map " + this_option + " to js_option_name");
				} else {
					if(js_option_name == "dilationRate") {
						data[js_option_name] = eval(default_value);
					} else if (typeof(default_value) == "function") {
						data[js_option_name] = default_value(i);
					} else {
						data[js_option_name] = default_value;
					}
				}

				data = this.#remove_empty(data);
			}
		}

		return data;
	}

	async #create_fake_model_structure (layer_nr, layer_type) {
		this.assert(typeof(layer_nr) == "number", layer_nr + " is not an number but " + typeof(layer_nr));
		this.assert(typeof(layer_type) == "string", layer_type + " is not an string but " + typeof(layer_type));

		var fake_model_structure = await this.get_model_structure();

		fake_model_structure[layer_nr]["type"] = layer_type;
		fake_model_structure[layer_nr]["data"] = await this.get_fake_data_for_layertype(layer_nr, layer_type);

		return fake_model_structure;
	}

	async #compile_fake_model(layer_nr, layer_type) {
		this.assert(typeof(layer_nr) == "number", layer_nr + " is not a number but " + typeof(layer_nr));
		this.assert(typeof(layer_type) == "string", layer_type + " is not a string but " + typeof(layer_type));

		var fake_model_structure;

		try {
			fake_model_structure = await this.#create_fake_model_structure(layer_nr, layer_type);
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.wrn(e);
			return false;
		}

		var ret = false;

		try {
			var fake_model;

			try {
				var tmp_model_data;
				[fake_model, tmp_model_data] = await this.create_model(null, fake_model_structure, 0, layer_nr);

				ret = this.tidy(() => {
					try {
						fake_model.compile(tmp_model_data);

						return true;
					} catch (e) {
						return false;
					}
				});

				await this.dispose(tmp_model_data);
			} catch(e) {
				this.err(e);

				ret = false;
			}

			if(!Object.keys(fake_model).includes("output") || !Object.keys(fake_model.output).includes("shape")) {
				return false;
			}

			if(this.#model.output.shape.map(item => item === null ? "null" : item).join(",") != fake_model.output.shape.map(item => item === null ? "null" : item).join(",")) {
				ret = false;
			}

			await this.dispose(fake_model);

		} catch (e) {
			this.wrn(e);
			ret = false;
		}

		return ret;
	}

	#remove_empty(obj) {
		var res = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));

		return res;
	}

	#get_js_name(_name) {
		if(typeof(_name) == "boolean") {
			if(_name) {
				return "true";
			}
			return "false";
		}

		if(Array.isArray(_name)) {
			return _name;
		}

		if (_name in this.#python_names_to_js_names) {
			return this.#python_names_to_js_names[_name];
		}
		return _name;
	}

	get_weight_type_name_from_option_name (on) {
		if(typeof(on) != "string") {
			this.wrn(`[get_weight_type_name_from_option_name] get_weight_type_name_from_option_name(on = ${on}), typeof(on) = ${typeof(on)}`);
			return;
		}

		if(on.match(/_/)) {
			for (var i = 0; i < this.#valid_initializer_types.length; i++) {
				var v = this.#valid_initializer_types[i];
				var re = new RegExp("^" + v + "(?:_.*)?$");
				if(on.match(re)) {
					return v;
				}
			}
		} else {
			return on;
		}

		return on;
	}

	get_layer_initializer_config(layer_nr, initializer_type) {
		this.assert(
			this.#valid_initializer_types.includes(initializer_type),
			"insert_initializer_trs(layer_nr, " + initializer_type + ") is not a valid initializer_type (2nd option)"
		);

		this.assert(typeof (layer_nr) == "number", "get_layer_initializer_config(" + layer_nr + "), layer_nr is not an integer but " + typeof (layer_nr));

		var starts_with_string = initializer_type + "_initializer_";

		var this_initializer_options = $($(".layer_setting")[layer_nr]).find("." + initializer_type + "_initializer_tr").find(".input_data");

		var option_hash = {};

		for (var i = 0; i < this_initializer_options.length; i++) {
			var this_option = this_initializer_options[i];
			var classList = this_option.className.split(/\s+/);

			for (var j = 0; j < classList.length; j++) {
				if (classList[j].startsWith(starts_with_string)) {
					var option_name = classList[j];
					option_name = option_name.replace(starts_with_string, "");
					var value = this.#get_item_value(layer_nr, classList[j]);

					if (this.#looks_like_number(value)) {
						value = this.#parse_float(value);
					}

					if (value !== "") {
						option_hash[option_name] = this.#is_numeric(value) ? this.#parse_float(value) : value;
					}
				}
			}
		}

		return option_hash;
	}

	#get_key_name_camel_case(keyname) {
		this.assert(typeof(keyname) == "string", `keyname "${keyname}" is not a string, but ${typeof(keyname)}`);

		var letters = keyname.split("");
		var results = [];

		var next_is_camel_case = false;
		for (var i = 0; i < letters.length; i++) {
			if(letters[i] == "_") {
				next_is_camel_case = true;
			} else {
				if(next_is_camel_case) {
					results.push(letters[i].toUpperCase());
					next_is_camel_case = false;
				} else {
					results.push(letters[i]);
				}
			}
		}

		return results.join("");
	}

	#get_layer_regularizer_config(layer_nr, regularizer_type) {
		this.assert(this.#valid_initializer_types.includes(regularizer_type), "insert_regularizer_trs(layer_nr, " + regularizer_type + ") is not a valid regularizer_type (2nd option)");
		this.assert(typeof (layer_nr) == "number", "#get_layer_regularizer_config(" + layer_nr + "), layer_nr is not an integer but " + typeof (layer_nr));

		var starts_with_string = regularizer_type + "_regularizer_";

		var this_regularizer_options = $($(".layer_setting")[layer_nr]).find("." + regularizer_type + "_regularizer_tr").find(".input_data");

		var option_hash = {};

		for (var i = 0; i < this_regularizer_options.length; i++) {
			var this_option = this_regularizer_options[i];
			var classList = this_option.className.split(/\s+/);

			for (var j = 0; j < classList.length; j++) {
				if (classList[j].startsWith(starts_with_string)) {
					var option_name = classList[j];
					option_name = option_name.replace(starts_with_string, "");
					var value = this.#get_item_value(layer_nr, classList[j]);

					if (this.#looks_like_number(value)) {
						value = this.#parse_float(value);
					}

					if (value != "") {
						option_hash[option_name] = value;
					}
				}
			}
		}

		return option_hash;
	}

	async create_model (old_model, fake_model_structure, force, i=-1) {
		if(this.#has_missing_values) {
			this.log("Not creating model because some values are missing (create model)");
			if(old_model) {
				return old_model;
			}

			this.err("No model found, but has missing values");

			return [old_model, null];
		}

		if(!force && this.#disable_show_python_and_create_model) {
			return [old_model, null];
		}

		$(".warning_container").hide();

		var model_structure = fake_model_structure;
		if(model_structure === undefined) {
			model_structure = await this.get_model_structure();
		}

		this.assert(typeof(model_structure) == "object", "model_structure is not an object");

		var model_uuid = "";

		if(fake_model_structure) {
			model_uuid = "FAKE_MODEL";
		} else {
			model_uuid = this.#uuidv4();
		}

		var new_model;
		try {
			new_model = await this.#_add_layers_to_model(model_structure, fake_model_structure, i, model_uuid);

			await this.#dispose_old_model_tensors(model_uuid);
		} catch (e) {
			if(("" + e).includes("Negative dimension size caused by adding layer")) {
				this.wrn(`[create_model] Trying to add the layer ${i} failed, probably because the input size is too small or there are too many stacked layers.`);
			} else if(("" + e).includes("Input shape contains 0")) {
				this.wrn("[create_model] " + e);
			} else if(("" + e).includes("is not fully defined")) {
				this.wrn("[create_model] " + e);
				return;
			} else if(("" + e).includes("Input 0 is incompatible with layer")) {
				this.wrn("[create_model] Model could not be created because of problems with the input layer.");
				return;
			} else {
				throw new Error("[create_model] " + e);
			}

			return;
		}

		$(".warning_container").html("").hide();

		if(this.#model && this.#model.layers && this.#model.layers.length) {
			if(i in this.#model.layers) {
				try {
					var ok = 1;
					try {
						this.#model.layers[i].input.shape;
						ok = 0;
					} catch (er) { // ignore delibaretly, when it fails, its ok
						this.wrn("" + er);
					}

					if(!ok) {
						//throw new Error(`this.#model.layers[${i}] is a multibound head`);
					}
				} catch(e) {
					this.err(e);
					this.wrn("Model has multi-node inputs. It should not have!!! Continuing anyway, but please, debug this!!!");
				}
			}
		}

		this.#enable_train();

		if(!fake_model_structure) {
			this.dbg("[create_model] " + this.#tr("model_compiled_successfully"));
		}

		if(old_model) {
			var old_model_has_layers = 1;
			try { var x = old_model.layers; } catch (e) { old_model_has_layers = 0; }

			try {
				if(old_model_has_layers && old_model.layers && old_model.layers.length) {
					for (var k = 0; k < old_model.layers.length; k++) {
						for (var j = 0; j < old_model.layers[k].weights.length; j++) {
							await this.dispose(old_model.layers[k].weights[j].val);
						}
					}
				} else {
					if(this.#finished_loading) {
						this.info("Old layers had no layers defined");
					}
				}
			} catch (e) {
				throw new Error(e);
			}

			await this.dispose(old_model);
		}

		var model_data = await this.#get_model_data();

		return [new_model, model_data];
	}

	async #get_layers_container_md5() {
		await this.delay(1);
		var layers_container_str = "";
		$("#" + this.#layers_gui_div_name).find("select,input,checkbox").each(function (i, x) {
			x = $(x);
			layers_container_str += x.attr("class") + "=" + x.val() + ";;;";
		});

		var res = await this.#md5(layers_container_str);

		return res;
	}

	async #_add_layers_to_model (model_structure, fake_model_structure, i, model_uuid) {
		var new_model = this.tf_sequential(model_uuid);
		for (var i = 0; i < model_structure.length; i++) {
			var type = model_structure[i]["type"];
			var data = model_structure[i]["data"];

			data = this.#_check_data(data, type);

			this.#_set_layer_gui(data, fake_model_structure, i);

			try {
				if(!await this.#_add_layer_to_model(type, data, fake_model_structure, i, new_model, model_uuid)) {
					if(!fake_model_structure) {
						this.err(`[#_add_layers_to_model] Failed to add layer type ${type}`);
					} else {
						this.dbg(`[#_add_layers_to_model] Failed to add layer type ${type} (but ok because fake_model)`);
					}
				}
			} catch (e) {
				var msg = "" + e;
				msg = msg.replace(/^(Error:\s*)+/, "Error: ");
				$($(".warning_container")[i]).html(msg).show();
				await this.#write_descriptions();
				throw new Error(e);
			}
		}

		return new_model;
	}

	async #_add_layer_to_model (type, data, fake_model_structure, i, new_model, model_uuid) {
		try {
			if(layer_options[type]["custom"]) {
				if(i == 0) {
					data["inputShape"] = this.get_input_shape();
				} else {
					delete data["inputShape"];
				}
				var model_add_code = `new_model.add(new ${type}(${JSON.stringify(data)}))`;
				eval(model_add_code);
			} else {
				//console.log("adding ", tf.layers[type], ", data: ", data);
				var new_layer = tf.layers[type](data);

				new_model.add(new_layer);

				var added_layer = new_model.layers[new_model.layers.length - 1];

				if(added_layer["bias"]) {
					this.#_custom_tensors["" + added_layer.bias.id] = ["UUID:" + model_uuid, added_layer.bias, "[bias in #_add_layer_to_model]"];
					this.#_clean_custom_tensors();
				}

				if(added_layer["kernel"]) {
					this.#_custom_tensors["" + added_layer.kernel.id] = ["UUID:" + model_uuid, added_layer.kernel, "[kernel in #_add_layer_to_model]"];
					this.#_clean_custom_tensors();
				}

				if(new_model && new_model.layers) {
					var new_output_shape = new_model.layers[new_model.layers.length - 1].getOutputAt(0).shape;
					if(new_output_shape) {
						for (j in new_output_shape) {
							if(new_output_shape[j] === 0) {
								if(new_output_shape.shape) {
									this.log("New output-shape:", new_output_shape.shape);
								}
								throw new Error("Input shape contains 0 at layer " + j);
							}
						}

						try {
							var new_output_shape = new_model.layers[new_model.layers.length - 1].getOutputAt(1);
							throw new Error(`Layer ${i} has more than one output head!`);
						} catch (e) {
							if(("" + e).includes("Has Multi-Output")) {
								throw new Error(e);
							}
						}
					}
				}
			}
			set_layer_background(i, "");
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			/*
			this.err("!!!!!!!!!!!!!!!!");
			this.err("" + e);
			*/

			if(!fake_model_structure && !("" + e).includes("nodeIndex is not a number")) { // "nodeIndex is not a number" means the model has only one output node, which is good
				if(
					("" + e).includes("Negative dimension size caused by adding layer") ||
					("" + e).includes("Has Multi-Output") ||
					("" + e).includes("Input shape contains 0") ||
					("" + e).includes("is incompatible with layer") ||
					("" + e).includes("targetShape is undefined") ||
					("" + e).includes("is not fully defined") ||
					("" + e).includes("The dilationRate argument must be an integer") ||
					("" + e).includes("The first layer in a Sequential model must get an `inputShape` or `batchInputShape` argument")
				) {
					set_layer_background(i, "red");
					set_model_layer_warning(i, "" + e);
				} else {
					set_model_layer_warning(i, "" + e);
					this.err("ERROR: " + e);
					console.log("ORIGINAL e: ", e);
					this.log(type);
					this.log(data);
					throw new Error(e);
				}

				await this.dispose(new_model);
			}

			return false;
		}

		return new_model;
	}

	#_clean_custom_tensors () {
		var keys = Object.keys(this.#_custom_tensors);

		if(!keys.length) {
			return;
		}
		var disposed_keys = [];

		for (var i in keys) {
			var key = keys[i];

			try {
				if(!Object.keys(this.#_custom_tensors).includes(key) || this.#_custom_tensors[key][1].isDisposedInternal || this.#_custom_tensors[key][1].isDisposed) {
					disposed_keys.push(key);
				}
			} catch (e) {
				if(("" + e).includes("this.#_custom_tensors[key] is undefined")) {
					//
				} else {
					this.wrn("[_clean_custom_tensors] " + e);
				}
			}
		}

		for (var i in disposed_keys) {
			delete this.#_custom_tensors[disposed_keys[i]];
		}
	}

	#_check_data (data, type) {
		if(!data) {
			this.err("Data is undefined");
			return;
		}

		var has_keys = Object.keys(data);

		try {
			if(has_keys.includes("dropout_rate") && type == "dropout") {
				var tmp = data["dropout_rate"];
				delete data["dropout_rate"];
				data["rate"] = tmp;
				has_keys = Object.keys(data);
			}
		} catch (e) {
			this.err(e);
		}

		try {
			if(typeof(data) == "object" && ["lstm", "gru", "simpleRNN"].includes(type) && has_keys.includes("rate")) {
				var tmp = data["rate"];
				delete data["rate"];
				data["dropout"] = tmp;
				has_keys = Object.keys(data);
			}
		} catch (e) {
			this.err(e);
		}

		try {
			if(typeof(data) == "object" && "targetShape" in data && ["string", "number"].includes(typeof(data["targetShape"]))) {
				data["targetShape"] = eval("[" + data["targetShape"] + "]");
			}
		} catch (e) {
			this.err(e);
		}

		try {
			if(typeof(data) == "object" && "size" in data && typeof(data["size"]) == "string") {
				data["size"] = eval("[" + data["size"] + "]");
			}
		} catch (e) {
			this.err(e);
		}

		try {
			if(typeof(data) == "object" && "dilationRate" in data && data["dilationRate"].length == 0) {
				data["dilationRate"] = null;
			}
		} catch (e) {
			this.err(e);
		}

		try {
			if(typeof(data) == "object" && "units" in data && typeof(data["units"]) == "undefined") {
				if(finished_loading) {
					this.wrn("[#_check_data] units was not defined. Using 2 as default");
				}
				data["units"] = 2;
			}
		} catch (e) {
			this.err(e);
		}

		try {

			["strides", "kernelSize"].forEach(function (correction_name) {
				if(typeof(data) == "object" && correction_name in data && (isNaN(data[correction_name][0]) || typeof(data[correction_name][0]) == "undefined")) {
					data[correction_name] = [];
					for (var k = 0; k < data[correction_name].length; k++) {
						data[correction_name][k] = 1;
					}
				}
			});
		} catch (e) {
			this.err(e);
		}

		try {
			data = this.#check_initializers(data, has_keys);

			if(type == "rnn") {
				// never worked...
				var lstm_cells = [];
				for (var index = 0; index < data["units"]; index++) {
					lstm_cells.push(tf.layers.RNNCell({units: data["units"]}));
				}
				data["cell"] = lstm_cells;
				this.log(data);
			}
		} catch (e) {
			this.err(e);
		}

		try {
			data = this.#remove_empty(data);
		} catch (e) {
			this.err(e);
		}

		return data;
	}

	#check_initializers (data, has_keys) {
		this.#valid_initializer_types.forEach((init_or_regularizer_type) => {
			["Regularizer", "Initializer"].forEach((regularizer_or_init) => {
				var keyname = this.#get_key_name_camel_case(init_or_regularizer_type + regularizer_or_init);
				if(regularizer_or_init == "Initializer") {
					if(has_keys.includes(keyname)) {
						var original_name = data[keyname]["name"];
						if(typeof(original_name) == "string") {
							var options_stringified = JSON.stringify(data[keyname]["config"]);
							if(original_name) {
								try {
									data[keyname] = eval(`tf.initializers.${original_name}(${options_stringified})`);
								} catch (e) {
									this.err(e);
									console.trace();
								}
							} else {
								data[keyname] = null;
							}
						//} else {
						//	log("original_name (A):", original_name);
						}
					}
				} else if(regularizer_or_init == "Regularizer") {
					if(has_keys.includes(keyname)) {
						var original_name = data[keyname]["name"];
						this.assert(typeof(original_name) == "string", "original_name is not string (B)");
						var options_stringified = JSON.stringify(data[keyname]["config"]);
						if(typeof(original_name) == "string") {
							if(original_name && original_name != "none") {
								try {
									data[keyname] = eval(`tf.regularizers.${original_name}(${options_stringified})`);
								} catch (e) {
									this.err(e);
									console.trace();
								}
							} else {
								data[keyname] = null;
							}
						//} else {
						//	log("original_name (B):", original_name);
						}
					}
				} else {
					this.log("Invalid regularizer_or_init: " + regularizer_or_init);
				}
			});
		});

		return data;
	}

	#_set_layer_gui (data, fake_model_structure, i) {
		this.assert(typeof(data) == "object", "data is not an object");
		this.assert(typeof(i) == "number", "i is not a number");

		var data_keys = Object.keys(data);
		for (var k = 0; k < data_keys.length; k++) {
			var this_key = data_keys[k];
			var layer_setting = $($(".layer_setting")[i]);
			var current_setting = layer_setting.find("." + this.#js_names_to_python_names[this_key]);
			if(!fake_model_structure && !this.#is_valid_parameter(this_key, data[this_key], i)) {
				this.log(`INVALID PARAMETER FOR LAYER ${i}: ` + this_key + ": ", data[this_key], " (" + typeof(data[this_key]) + ")");
				current_setting.css("background-color", "red");
			} else {
				current_setting.css("background-color", "");
			}
		}

	}

	#is_valid_parameter (keyname, value, layer) {
		this.assert(typeof(keyname) == "string", "keyname " + keyname + " is not a string but " + typeof(keyname));
		this.assert(["string", "number", "boolean", "object"].includes(typeof(value)), value + " is not a string/number/boolean but " + typeof(value));
		this.assert(typeof(layer) == "number", layer + " is not a number but " + typeof(layer));

		if(
			(["units", "filters"].includes(keyname) && typeof(value) == "number") ||
			(["kernelRegularizer", "biasRegularizer", "activityRegularizer", "kernelInitializer", "biasInitializer", "gammaInitializer", "gammaRegularizer", "betaInitializer"].includes(keyname) && (typeof(value) == "object") || ["zeros", "ones"].includes(value)) ||
			(["unitForgetBias", "center", "scale", "unroll", "trainable", "useBias", "stateful", "returnSequences", "returnState", "goBackwards"].includes(keyname) && typeof(value) == "boolean") ||
			(["name", "betaConstraint", "gammaConstraint"].includes(keyname) && typeof(value) == "string") ||
			(["recurrentInitializer", "depthwiseInitializer", "pointwiseInitializer", "movingMeanInitializer", "movingVarianceInitializer", "betaInitializer", "gammaInitializer"].includes(keyname) && ["constant", "glorotNormal", "glorotUniform", "heNormal", "heUniform", "identity", "leCunNormal", "leCunUniform", "ones", "orthogonal", "randomNormal", "randomUniform", "truncatedNormal", "varianceScaling", "zeros", "string", "l1", "l2", "l1l2"].includes(value)) ||
			(keyname == "dtype" && ["float32", "int32", "bool", "complex64", "string"].includes(value)) ||
			(keyname == "padding" && ["valid", "same", "causal"].includes(value)) ||
			(["activation", "recurrentActivation"].includes(keyname) && ["LeakyReLU", "elu", "hardSigmoid", "linear", "relu", "relu6",  "selu", "sigmoid", "softmax", "softplus", "softsign", "tanh", "swish", "mish"].includes(value)) ||
			(["kernelSize", "poolSize", "strides", "dilationRate", "size"].includes(keyname) && (is_number_array(value) || typeof(value) == "number")) ||
			(keyname == "implementation" && [1, 2].includes(value)) ||
			(keyname == "biasConstraint" && ["maxNorm", "minNorm"].includes(value)) ||
			(keyname == "interpolation" && ["nearest", "bilinear"].includes(value)) ||
			(keyname == "inputShape" && layer == 0 && (typeof(value) == "object" || is_number_array(value))) ||
			(keyname == "targetShape" && is_number_array(value)) ||
			(["alpha", "stddev", "depthMultiplier"].includes(keyname) && typeof(value) == "number") ||
			(keyname == "axis" && typeof(value) == "number" && this.#parse_int(value) == value) ||
			(["recurrentDropout", "dropout", "rate", "dropout_rate"].includes(keyname) && typeof(value) == "number" && value >= 0 && value <= 1) ||
			(["epsilon"].includes(keyname) && typeof(value) == "number" && value >= 0) ||
			(["theta"].includes(keyname) && typeof(value) == "number") ||
			(["maxValue", "momentum"].includes(keyname) && typeof(value) == "number") ||
			(["seed"].includes(keyname) && typeof(value) == "number") ||
			(["cell"].includes(keyname) && typeof(value).includes("object"))
		) {
			return true;
		}

		//log("keyname: ", keyname, "value: ", value, "layer:", layer);

		return false;
	}

	async #dispose_old_model_tensors (model_uuid) {
		var disposable = [];

		Object.keys(this.#_custom_tensors).forEach((i, e) => {
			if(
				(this.#_custom_tensors[i][2].match(/(?:kernel|bias) in _add_layer_to_model/) ||
				this.#_custom_tensors[i][2].match(/model in tf_sequential/)) &&
				!this.#_custom_tensors[i][2].match(/FAKE/)
			) {
				if(this.#_custom_tensors[i][0].match(/UUID:/) && !this.#_custom_tensors[i][0].includes(model_uuid)) {
					disposable.push(this.#_custom_tensors[i][1]);
				}
			}
		});

		for (var i in disposable) {
			if(i != "last") {
				await this.dispose(disposable[i]);
			}
		}

		this.#_clean_custom_tensors();
	}

	set_validation_split(val_split) {
		if(typeof(val_split) == "number") {
			if (0 <= val_split <= 1) {
				this.#validation_split = val_split;
				console.debug(`set_validation_split: succesfully set new validation split ${val_split}`)
			} else {
				console.error(`set_validation_split: val_split must be a number between 0 and 1, is ${val_split}`)
			}
		} else {
			console.error(`set_validation_split: val_split must be a number, is ${typeof(val_split)}`)
		}
	}

	async #get_model_data (optimizer_name_only) {
		if(this.#global_model_data) {
			var model_data_tensors = this.#find_tensors_with_is_disposed_internal(this.#global_model_data);
			for (var i = 0; i < model_data_tensors.length; i++) {
				await this.dispose(model_data_tensors[i]);
			}
		}

		var loss = this.#loss;
		var optimizer_type = this.#optimizer;
		var metric_type = this.#metric;

		if(Object.values(this.#metric_shortnames).includes(metric_type)) {
			metric_type = this.#get_key_by_value(this.#metric_shortnames, metric_type);
		}

		var epochs = this.#epochs;
		var batchSize = this.#batch_size
		var validationSplit = this.#validation_split;
		var divide_by = this.#divide_by;

		if(this.#looks_like_number(epochs)) {
			epochs = this.#parse_int(epochs);
		} else {
			this.#finished_loading && this.wrn("#epochs doesnt look like a number");
		}

		if(this.#looks_like_number(batchSize)) {
			batchSize = this.#parse_int(batchSize);
		} else {
			this.#finished_loading && this.wrn("#batchSize doesnt look like a number");
		}

		if(this.#looks_like_number(validationSplit)) {
			validationSplit = this.#parse_int(validationSplit);
		} else {
			this.#finished_loading && this.wrn("#validation_split doesnt look like a number");
		}

		if(this.#looks_like_number(divide_by)) {
			divide_by = this.#parse_float(divide_by);
		} else {
			this.#finished_loading && this.wrn("#divide_by doesnt look like a number");
		}

		this.#global_model_data = {
			loss: loss,
			optimizer_name: optimizer_type,
			optimizer: optimizer_type,
			metrics: metric_type,
			metric: metric_type,
			epochs: epochs,
			batchSize: batchSize,
			validationSplit: validationSplit,
			divide_by: divide_by,
			labels: this.#labels
		};

		if(!this.#is_hidden_or_has_hidden_parent($("#height"))) {
			this.#global_model_data["width"] = this.#model_width;
			this.#global_model_data["height"] = this.#model_height;
		}

		var optimizer_data_names = this.#model_data_structure[optimizer_type];

		if(!$("#" + this.#optimizer_table_div_name)) {
			this.#write_optimizer_table_to_page();
		}

		for (var i = 0; i < optimizer_data_names.length; i++) {
			var optimizer_data_id = optimizer_data_names[i] + "_" + optimizer_type;
			var optimizer_data = $("#" + optimizer_data_id).val();
			this.#global_model_data[optimizer_data_names[i]] = this.#parse_float(optimizer_data);
		}

		var optimizer_constructors = {
			"adadelta": "adadelta(this.#global_model_data['learningRate'], this.#global_model_data['rho'], this.#global_model_data['epsilon'])",
			"adagrad": "adagrad(this.#global_model_data['learningRate'], this.#global_model_data['initialAccumulatorValue'])",
			"adam": "adam(this.#global_model_data['learningRate'], this.#global_model_data['beta1'], this.#global_model_data['beta2'], this.#global_model_data['epsilon'])",
			"adamax": "adamax(this.#global_model_data['learningRate'], this.#global_model_data['beta1'], this.#global_model_data['beta2'], this.#global_model_data['epsilon'], this.#global_model_data['decay'])",
			"rmsprop": "rmsprop(this.#global_model_data['learningRate'], this.#global_model_data['decay'], this.#global_model_data['momentum'], this.#global_model_data['epsilon'], this.#global_model_data['centered'])",
			"sgd": "sgd(this.#global_model_data['learningRate'])"
		};

		if(!optimizer_name_only) {
			this.#global_model_data["optimizer"] = this.tidy(() => { return eval("tf.train." + optimizer_constructors[this.#global_model_data["optimizer"]]); });
		}

		return this.#global_model_data;
	}

	#find_tensors_with_is_disposed_internal(obj, tensorList = []) {
		if (typeof obj === "object") {
			if (obj.isDisposedInternal !== undefined) {
				tensorList.push(obj);
			}
			for (const key in obj) {
				this.#find_tensors_with_is_disposed_internal(obj[key], tensorList);
			}
		}

		return tensorList;
	}

	#get_key_by_value(object, value) {
		var res = Object.keys(object).find(key => object[key] === value);

		return res;
	}

	#write_optimizer_table_to_page () {
		if(!this.#optimizer_table_div_name) {
			this.err(`No optimizer_table_div_name set! Cannot continue.`);
			return;
		}

		if(!$("#" + this.#optimizer_table_div_name).length) {
			this.err(`#${this.#optimizer_table_div_name} cannot be found. Cannot continue.`);
			return;
		}

		var html = `<div id="optimizer_table_div">
			<table>
				<tr>
					<td><span class="TRANSLATEME_optimizer"></span></td>
					<td>
						<select id="optimizer" onchange='${this.#asanai_object_name}.change_optimizer()' style="width: 100px">
							<option value="adam">adam</option>
							<option value="adadelta">adadelta</option>
							<option value="adagrad">adagrad</option>
							<option value="adamax">adamax</option>
							<option value="rmsprop">rmsprop</option>
							<option value="sgd">sgd</option>
						</select>
					</td>
				</tr>
			</table>

			<br>

			<div id="optimizer_table">
				<div class="optimizer_metadata" style="display: none;" id="sgd_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_sgd"></td>
						</tr>
					</table>
				</div>

				<div class="optimizer_metadata" style="display: none;" id="adagrad_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_adagrad"></td>
						<tr>
						</tr>
							<td>Initial accumulator value</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.1" id="initialAccumulatorValue_adagrad"></td>
						</tr>
					</table>
				</div>

				<div class="optimizer_metadata" style="display: none;" id="adam_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="${this.#learning_rate}" id="learningRate_adam"></td>

							<td>&beta;<sub>1</sub></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.9" id="beta1_adam"></td>
						</tr>

						<tr>
							<td>&beta;<sub>2</sub></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.999" id="beta2_adam"></td>

							<td>&epsilon;</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adam"></td>
						</tr>
					</table>
				</div>

				<div class="optimizer_metadata" style="display: none;" id="adadelta_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.001" id="learningRate_adadelta"></td>

							<td>&rho;</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.95" id="rho_adadelta"></td>
						</tr>

						<tr>

							<td>&epsilon;</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adadelta"></td>
							<td></td>
							<td></td>
						</tr>
					</table>
				</div>

				<div class="optimizer_metadata" style="display: none;" id="adamax_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.002" id="learningRate_adamax"></td>

							<td>&beta;<sub>1</sub></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.9" id="beta1_adamax"></td>

							<td>&epsilon;</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adamax"></td>
						</tr>
						<tr>

							<td>&beta;<sub>2</sub></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.999" id="beta2_adamax"></td>

							<td>Decay</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0" id="decay_adamax"></td>
							<td></td>
							<td></td>
						</tr>
					</table>
				</div>

				<div class="optimizer_metadata" style="display: none;" id="rmsprop_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.00000000001" value="0.01" id="learningRate_rmsprop"></td>

							<td>Decay</td>
							<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.000001" value="0.9" id="decay_rmsprop"></td>
						</tr>
						<tr>
							<td>Momentum</td>
							<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0" id="momentum_rmsprop"></td>

							<td>&epsilon;</td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_rmsprop"></td>
						</tr>
					</table>
				</div>

				<div class="optimizer_metadata" style="display: none;" id="momentum_metadata">
					<table>
						<tr>
							<td><span class='TRANSLATEME_learning_rate' /></td>
							<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_momentum"></td>

							<td>Momentum</td>
							<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0.9" id="momentum_momentum"></td>
						</tr>
					</table>
				</div>
			</div>
		</div>`;

		$("#" + this.#optimizer_table_div_name).html(html);

		this.change_optimizer();
	}

	async change_optimizer() {
		var type = $("#optimizer").val();
		$(".optimizer_metadata").hide();

		$("#" + type + "_metadata").show();

		await this.updated_page();
	}

	#add_rate_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Dropout rate (0 to 1)", "dropout", "number", { "min": 0, "max": 1, "step": 0.1, "value": this.#get_default_option(type, "dropout") }, nr);
	}

	#add_seed_option (type, nr) {
		var style = "";

		var current_input_shape = this.get_input_shape();
		if (current_input_shape.length != 3) {
			style = ` style="display: none" `;
		}

		var res = "<tr class='seed_value' " + style + "><td>Seed</td><td><input onchange='updated_page()' type='number' name='seed' class='seed dropout_seed' value='1' /></td></tr>";

		return res;
	}

	#add_stddev_option (type, nr) {
		var style = "";

		var current_input_shape = this.get_input_shape();
		if (current_input_shape.length != 3) {
			style = ` style="display: none" `;
		}

		var res = "<tr class='seed_value' " + style + "><td>Seed</td><td><input onchange='updated_page()' type='number' name='seed' class='seed dropout_seed' value='1' /></td></tr>";

		return res;
	}

	#add_theta_option (type, nr) {
		return this.#get_tr_str_for_layer_table("&theta;", "theta", "number", { "step": 1, "value": -1 }, nr);
	}

	#add_axis_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Axis", "axis", "number", { "min": -1, "max": 1000, "step": 1, "value": this.#get_default_option(type, "axis") }, nr);
	}

	#add_max_value_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Max-Value", "max_value", "number", { "step": 1, "value": this.#get_default_option(type, "max_value") }, nr);
	}

	#add_alpha_option (type, nr) {
		return this.#get_tr_str_for_layer_table("&alpha;", "alpha", "number", { "max": 100, "step": 0.01, "value": this.#get_default_option(type, "alpha") }, nr);
	}

	#add_dropout_rate_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Dropout rate (0 to 1)", "dropout_rate", "number", { "min": 0, "max": 1, "step": 0.05, "value": this.#get_default_option(type, "dropout_rate") }, nr);
	}

	#add_target_shape_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Target-Shape", "target_shape", "text", { "text": this.#calculate_default_target_shape(nr), "placeholder": "Array-Shape" }, nr);
	}

	set_mode (mode_name) {
		if(["beginner", "expert"].includes(mode_name)) {
			this.#mode = mode_name;
		} else {
			throw new Error(`set_mode must be either 'beginner' or 'expert', you chose '${mode_name}', which is invalid.`);
		}
	}

	#add_center_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Center?", "center", "checkbox", { "status": "checked" }, nr);
	}

	#add_scale_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Scale?", "scale", "checkbox", { "status": "checked" }, nr);
	}

	#add_padding_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Padding", "padding", "select", { "valid": "valid", "same": "same" }, nr);
	}

	#add_filters_option (type, nr) {
		return this.#get_tr_str_for_layer_table("<span class='TRANSLATEME_filters'></span>", "filters", "number", { "min": 1, "max": 256, "step": 1, "value": this.#get_default_option(type, "filters") }, nr);
	}

	#get_dimensionality_from_layer_name(layer_type) {
		var match = layer_type.match(/(\d+)[dD]/);

		if (match) {
			return this.#parse_int(match[1]);
		}

		return null;
	}

	#add_kernel_size_option(type, nr) {
		var str = "";
		var dimensionality = this.#get_dimensionality_from_layer_name(type);

		this.assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

		var letter_code = "x".charCodeAt();
		for (var i = 0; i < dimensionality; i++) {
			var letter = String.fromCharCode(letter_code);
			str += this.#get_tr_str_for_layer_table(
				"<span class='TRANSLATEME_kernel_size'></span> " + letter,
				"kernel_size_" + letter, "number",
				{ "min": 1, "max": 4096, "step": 1, "value": this.#get_default_option(type, "kernel_size")[i] },
				nr
			);
			letter_code++;
		}

		return str;
	}

	#add_depth_multiplier_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Depth multiplier", "depth_multiplier", "number", { "min": 0, "step": 1, "value": this.#get_default_option(type, "depth_multiplier") }, nr);
	}

	#add_size_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Size", "size", "text", { "text": "3,3", "placeholder": "2 comma-seperated numbers" }, nr);
	}

	#add_epsilon_option (type, nr) {
		return this.#get_tr_str_for_layer_table("&epsilon; multiplier", "epsilon", "number", { "min": -1, "max": 1, "step": 0.0001, "value": this.#get_default_option(type, "epsilon") }, nr);
	}

	#add_beta_initializer_option (type, nr) {
		return this.#get_tr_str_for_layer_table("&beta; Initializer", "beta_initializer", "select", this.#initializers, nr);
	}

	#add_gamma_initializer_option (type, nr) {
		this.assert(typeof(type) == "string", "type is not a string add_gamma_initializer_option, but " + typeof(type) + ", " + type);
		this.assert(typeof(nr) == "number", "nr is not a number for add_gamma_initializer_option, but " + typeof(type) + ", " + type);

		return this.#get_tr_str_for_layer_table('gamma Initializer', 'gamma_initializer', 'select', this.#initializers, nr, 'gamma_initializer_tr');
	}

	#add_strides_option (type, nr) {
		var str = "";
		var dimensionality = this.#get_dimensionality_from_layer_name(type);

		this.assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

		var letter_code = "x".charCodeAt();
		for (var i = 0; i < dimensionality; i++) {
			var letter = String.fromCharCode(letter_code);
			str += this.#get_tr_str_for_layer_table("Strides " + letter, "strides_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": this.#get_default_option(type, "strides")[i] }, nr);
			letter_code++;
		}

		return str;
	}

	#add_pool_size_option (type, nr) {
		this.assert(typeof(type) == "string", "type is not a number");
		this.assert(typeof(nr) == "number", "nr is not a number");

		var str = "";

		var dimensionality = this.#get_dimensionality_from_layer_name(type);

		this.assert(typeof(dimensionality) == "number", `get_dimensionality_from_layer_name does not return a number for type '${type}'`);

		var letter_code = "x".charCodeAt();
		for (var i = 0; i < dimensionality; i++) {
			var letter = String.fromCharCode(letter_code);
			str += this.#get_tr_str_for_layer_table("Pool-Size " + letter, "pool_size_" + letter, "number", { "min": 1, "max": 4096, "step": 1, "value": this.#get_default_option(type, "pool_size")[i] }, nr);
			letter_code++;
		}

		return str;
	}

	#add_interpolation_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Interpolation", "interpolation", "select", this.#interpolation, nr);
	}

	#add_dilation_rate_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Dilation-Rate", "dilation_rate", "text", { "text": "", "placeholder": "1-3 numbers" }, nr);
	}

	#add_depthwise_initializer_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Depthwise Initializer", "depthwise_initializer", "select", this.#initializers, nr);
	}

	#add_kernel_constraint_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Kernel Constraint", "kernel_constraint", "select", this.#constraints, nr);
	}

	#add_depthwise_constraint_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Depthwise Constraint", "depthwise_constraint", "select", this.#constraints, nr);
	}

	#add_pointwise_initializer_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Pointwise Initializer", "pointwise_initializer", "select", this.#initializers, nr);
	}

	#add_bias_constraint_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Bias Constraint", "bias_constraint", "select", this.#constraints, nr);
	}

	#add_pointwise_constraint_option (type, nr) {
		return this.#get_tr_str_for_layer_table("Pointwise Constraint", "pointwise_constraint", "select", this.#constraints, nr);
	}

	async draw_maximally_activated_layer (layer, type = "", is_recursive = 0) {

		if(type == "") {
			type = this.get_model().layers[layer].getClassName().toLowerCase();
		}

		if(this.#currently_generating_images) {
			this.log("Cannot predict 2 layers at the same time. Waiting until done...");

			while (this.#currently_generating_images) {
				await this.delay(500);
			}

		}

		var canvasses = [];

		this.#currently_generating_images = true;

		var neurons = this.#_get_neurons_last_layer(layer, type);

		if(typeof(neurons) == "boolean" && !neurons)  {
			this.#currently_generating_images = false;
			this.err("Cannot determine number of neurons in last layer");
			return;
		}

		var types_in_order = "";
		if(this.#get_number_of_layers() - 1 == layer && this.#labels && this.#labels.length) {
			types_in_order = " (" + this.#labels.join(", ") + ")";
		}

		var times = [];

		$("#stop_generating_images_button").show();

		for (var i = 0; i < neurons; i++) {
			$("#generate_images_msg_wrapper").hide();
			$("#generate_images_msg").html("");

			var start = Date.now();

			var currentURL = window.location.href;
			var urlParams = new URLSearchParams(window.location.search);

			var tries_left = 3;

			var base_msg = `${this.#tr("generating_image_for_neuron")} ${i + 1} ${this.#tr("of")} ${neurons}`;

			try {
				this.log(base_msg);
				canvasses.push(await this.draw_maximally_activated_neuron(layer, neurons - i - 1));
			} catch (e) {
				this.#currently_generating_images = false;

				if(("" + e).includes("already disposed")) {
					if(!is_recursive) {
						while (tries_left) {
							await this.delay(200);
							try {
								this.log(`${base_msg} ${this.#tr("failed_try_again")}...`);
								canvasses.push(await draw_maximally_activated_layer(layer, type, 1));
							} catch (e) {
								if(("" + e).includes("already disposed")) {
									this.err("" + e);
								} else {
									throw new Error(e);
								}
							}
							tries_left--;
						}

						if(tries_left) {

						}
					} else {
						this.log("Already disposed in draw_maximally_activated_layer in a recursive step. Ignore this probably.");
					}
				} else {
					throw new Error(e);
				}
			}

			var end = Date.now();

			var time = ((end - start) / 1000) + 1;

			times.push(time);
		}

		$("#stop_generating_images_button").hide();
		$("#generate_images_msg_wrapper").hide();
		$("#generate_images_msg").html("");

		var type_h2 = "h2";
		var ruler = "";
		var br = "";

		$("#maximally_activated_content").prepend(`<${type_h2} class='h2_maximally_activated_layer_contents'>${ruler}<input style='width: 100%' value='Layer ${layer + types_in_order}' /></${type_h2}>${br}`);

		this.log(this.#tr("done_generating_images"));

		this.#currently_generating_images = false;

		return canvasses;
	}

	#_get_neurons_last_layer (layer, type) {
		var neurons = 1;

		if(!Object.keys(this.#model).includes("layers")) {
			this.wrn("Cannot get #model.layers");
			return false;
		}

		if(!Object.keys(this.#model.layers).includes("" + layer)) {
			this.wrn(`Cannot get #model.layers[${layer}]`);
			return false;
		}

		if(type == "conv2d") {
			neurons = this.#model.layers[layer].filters;
		} else if (type == "dense") {
			neurons = this.#model.layers[layer].units;
		} else if (type == "flatten") {
			neurons = 1;
		} else {
			this.dbg("Unknown layer " + layer);
			return false;
		}

		return neurons;
	}

	#get_number_of_layers () {
		return this.#model.layers.length;
	}

	async draw_maximally_activated_neuron (layer, neuron, autoappend=true) {
		var current_input_shape = this.get_input_shape();

		var canvasses = [];

		try {
			var start_image = undefined;
			var iterations = this.#parse_int(this.#max_activation_iterations);
			if(!iterations) {
				this.log(`Iterations was set to ${iterations} in the GUI, using 30 instead`);
				iterations = 30;
			}

			var full_data = await this.#input_gradient_ascent(layer, neuron, iterations, start_image);

			if(full_data["worked"]) {
				if(Object.keys(full_data).includes("data")) {
					var _tensor = this.tensor(full_data["data"]);
					var t_str = this.#_tensor_print_to_string(_tensor);
					this.log("Maximally activated tensors:", t_str);
					if(autoappend) {
						$("#maximally_activated_content").prepend(`<input style='width: 100%' value='Maximally activated tensors for Layer ${layer}, Neuron ${neuron}:' /><pre>${t_str}</pre>`);
					}
					await this.dispose(_tensor);
				} else if (Object.keys(full_data).includes("image")) {
					var data = full_data["image"][0];
					var to_class = this.#maximally_activated_neuron_class;

					if(!$("." + to_class).length) {
						this.err(`.${this.#maximally_activated_neuron_class} not found. Returning...`);
						return;
					}

					var canvas = this.#get_canvas_in_class(layer, to_class, !autoappend, 1);
					var _uuid = canvas.id;

					canvasses.push(canvas);

					var data_hash = {
						layer: layer,
						neuron: neuron,
						model_hash: await this.#get_model_config_hash()
					};

					this.#scaleNestedArray(data);
					var res = this.#draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash, "layer_image");

					if(res) {
						if(!$("#maximally_activated_content").length) {
							this.err(`#maximally_activated_content not found. Returning...`);
							return;
						}

						if(autoappend) {
							$("#maximally_activated_content").prepend(canvas);
						}
					} else {
						//this.log("Res: ", res);
					}
				}
			}
		} catch (e) {
			await this.#write_error(e);
			return false;
		}

		return canvasses;
	}

	async #input_gradient_ascent(layer_idx, neuron, iterations, start_image, recursion = 0) {
		var worked = 0;
		var full_data = {};

		var asanai_this = this;

		try {
			var generated_data = asanai_this.tidy(() => {
				// Create an auxiliary model of which input is the same as the original
				// model but the output is the output of the convolutional layer of
				// interest.
				const layer_output = asanai_this.#model.getLayer(null, layer_idx).getOutputAt(0);

				const aux_model = this.tf_model({inputs: asanai_this.#model.inputs, outputs: layer_output});

				// This function calculates the value of the convolutional layer's
				// output at the designated filter index.
				const lossFunction = (input) => aux_model.apply(input, {training: true}).gather([neuron], -1);

				// This returned function (`grad_function`) calculates the gradient of the
				// convolutional filter's output with respect to the input image.
				const grad_function = this.grad(lossFunction);

				// Form a random image as the starting point of the gradient ascent.

				var new_input_shape = asanai_this.get_input_shape_with_batch_size();
				new_input_shape.shift();
				var data = asanai_this.#randomUniform([1, ...new_input_shape], 0, 1);
				if(typeof(start_image) != "undefined") {
					data = start_image;
				}

				for (var i = 0; i < iterations; i++) {
					const scaledGrads = asanai_this.tidy(() => {
						try {
							const grads = grad_function(data);

							const _is = asanai_this.sqrt(asanai_this.tf_mean(asanai_this.tf_square(grads)));

							const norm = asanai_this.tf_add(_is, asanai_this.#tf_constant_shape(tf.backend().epsilon(), _is));
							// Important trick: scale the gradient with the magnitude (norm)
							// of the gradient.
							return asanai_this.tf_div(grads, norm);
						} catch (e) {
							if(Object.keys(e).includes("message")) {
								e = e.message;
							}

							this.err("Inside scaledGrads creation error:" + e);
						}
					});

					data = this.tf_add(data, scaledGrads);
					worked = 1;
				}

				return data;
			});
		} catch (e) {
			if(("" + e).includes("is already disposed")) {
				await this.#compile_model();
				if(recursion > 20) {
					await delay(recursion * 1000);
					return await input_gradient_ascent(layer_idx, neuron, iterations, start_image, recursion + 1);
				} else {
					throw new Error("Too many retries for input_gradient_ascent");
				}
			} else {
				throw new Error("Error 12: " + e);
			}
		}

		if(this.#model.input.shape.length == 4 && this.#model.input.shape[3] == 3) {
			var asanai_this = this;
			try {
				full_data["image"] = this.tidy(() => {
					var dp = asanai_this.#deprocess_image(generated_data);

					if(!dp) {
						this.err("deprocess image returned empty");
						full_data["worked"] = 0;
					}

					return asanai_this.array_sync(dp);
				});
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				console.log("generated_data: ", generated_data);

				this.err("" + e);

				full_data["worked"] = 0;
			}
		} else {
			full_data["data"] = this.array_sync(generated_data);
		}

		await this.dispose(generated_data);

		full_data["worked"] = worked;

		return full_data;
	}

	#write_error (...args) {
		console.warn("write_error is not yet fully implemented! It will get redirected to the console.error function only by now!");
		console.error(...args);
	}

	async #_get_recreate_model(current_status_hash, model_config_hash, new_model_config_hash) {
		var recreate_model = false;

		if(model_config_hash != new_model_config_hash) {
			recreate_model = true;
		}

		if(this.#model_is_trained) {
			if(model_config_hash == new_model_config_hash) {
				recreate_model = false;
			} else {
				recreate_model = true;
				if(recreate_model) {
					this.#model_is_trained = false;
				}
			}
		}

		return recreate_model;
	}

	async #get_current_status_hash(use_weights=1) {
		var html_code = "";

		var allitems = [];
		allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("input"));
		allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("checkbox"));
		allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("select"));
		allitems = Array.prototype.concat.apply(allitems, document.getElementsByTagName("textarea"));

		allitems.forEach(function (x) {
			var item = $(x);
			html_code += ";;;;;;;" + x.id + ";;;;" + x.className + "=" + x.value + ";;;;" + x.checked;
		});

		if(use_weights) {
			html_code += this.#get_weights_as_string();
		}

		var new_status_hash = await this.#md5(html_code);

		return new_status_hash;
	}

	#get_weights_as_string (m) {
		if(!m) {
			m = this.#model;
		}

		if(!m) {
			if(finished_loading) {
				this.wrn("Could not get #model...");
			}
			return false;
		}

		if(!Object.keys(m).includes("_callHook")) {
			this.wrn("given model is not a model");
			return false;
		}

		if(!typeof(m.getWeights) == "function") {
			this.wrn("getWeights is not defined");
			return false;
		}

		var res;

		if(m) {
			var asanai_this = this;

			this.tidy(() => {
				try {
					var weights = m.getWeights();

					var weights_array = [];

					for (var i = 0; i < weights.length; i++) {
						if(!weights[i].isDisposed) {
							weights_array[i] = asanai_this.array_sync(weights[i]);
						} else {
							this.wrn(`weights[${i}] is disposed`);
						}
					}

					res = JSON.stringify(weights_array);
				} catch (e) {
					if(("" + e).includes("already disposed")) {
						if(finished_loading) {
							//wrn("Maybe the model was recompiled or changed while predicting. This MAY be the cause of a problem, but it may also not be.");
						}
					} else if(("" + e).includes("e is undefined")) {
						this.wrn("e is undefined in get_weights_as_string. This has happened to me when rebuilding the model after it was set to null. If this happened here, it is most probably harmless");
					} else if(("" + e).includes("getWeights is not a function")) {
						this.wrn("getWeights is not a function. The model may have been undefined while attempting this.");
					} else {
						this.err(e);
						console.trace();
					}
				}
			});
		} else {
			res = false;
		}

		return res;
	}

	async #_create_model () {
		var _create_model_uuid = this.#uuidv4();

		while (this.#create_model_queue.length) {
			await delay(50);
		}

		this.#create_model_queue.push(_create_model_uuid);

		if(this.#has_missing_values) {
			this.log(this.#tr("not_creating_model_because_values_are_missing"));
			return this.#model;
		}

		try {
			if(this.#global_model_data) {
				var model_data_tensors = this.#find_tensors_with_is_disposed_internal(this.#global_model_data);
				for (var i = 0; i < model_data_tensors.length; i++) {
					await this.dispose(model_data_tensors[i]);
				}
			}

			if(this.#model && Object.keys(this.#model).includes("layers") && this.#model.layers.length) {
				for (var i = 0; i < this.#model.layers.length; i++) {
					await this.dispose(this.#model.layers[i].bias);
					await this.dispose(this.#model.layers[i].kernel);
				}

				await this.dispose(this.#model);
			}
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.err(e);
		}

		try {
			[this.#model, this.#global_model_data] = await this.create_model(this.#model);

			/*
			if(can_be_shown_in_latex()) {
				$("#math_mode_settings").show();
			} else {
				$("#math_mode_settings").hide();
			}
			*/
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			this.#create_model_queue = this.#create_model_queue.filter(function(e) { return e !== _create_model_uuid })

			if(("" + e).includes("undefined has no properties")) {
				this.wrn("[create_model] Trying to work on undefined #model. This may be the case when this function is called, but the model is currently being rebuilt.");
				return;
			} else if(("" + e).includes("Input 0 is incompatible with layer")) {
				throw new Error("[create_model] " + e);
			} else if(("" + e).includes("BaseConv expects config.kernelSize to be number")) {
				throw new Error("[create_model] " + e);
			} else if(("" + e).includes("targetShape is undefined")) {
				this.wrn("[create_model] " + e);
			} else if(("" + e).includes("ReferenceError")) {
				this.wrn("[create_model] " + e);
			} else if(("" + e).includes("The channel dimension of the input should be defined")) {
				this.wrn("[create_model] " + e);
			} else if(("" + e).includes("model is undefined")) {
				this.wrn("[create_model] Currently, the model is undefined. This may be fatal, but may also not be");
			} else if(("" + e).includes("model.layers[i] is undefined")) {
				this.wrn("[create_model] " + e);
			} else if(("" + e).includes("Inputs to DepthwiseConv2D should have rank") || ("" + e).includes("Inputs to SeparableConv2D should have rank")) {
				this.wrn("[create_model] " + e);
			} else if(("" + e).includes("Cannot read properties of undefined (reading 'layers')")) {
				this.wrn("[create_model] " + e);
				return;
			} else if(("" + e).includes("Cannot read properties of undefined")) {
				this.wrn("[create_model] " + e);
				return;
			} else if(("" + e).includes("identifier starts immediately after numeric literal")) {
				this.wrn("[create_model] " + e);
				return;
			} else if(
				("" + e).includes("Convolution layer expected config.filters to be a 'number' > 0 but got undefined") ||
				("" + e).includes("The kernelSize argument must be an integer or tuple of 2 integers") ||
				("" + e).includes("The strides argument must be an integer or tuple of 2 integers") ||
				("" + e).includes("Expected units to be a positive integer, but got undefined") ||
				("" + e).includes("have a defined dimension but the layer received an input with shape")
			) {
				this.wrn("[create_model] " + e);
				return;
			} else {
				await this.#except("ERROR1", "" + e);
				if(mode == "beginner") {
					Swal.fire({
						icon: "error",
						title: "Oops [4]...",
						text: "" + e
					});
				} else {
					l("ERROR: " + e);
				}
			}
		}

		this.#create_model_queue = this.#create_model_queue.filter(function(e) { return e !== _create_model_uuid })

		/*
		if(!disable_layer_debuggers && model) {
			add_layer_debuggers();
		}
		*/

		//add_optimizer_debugger();
	}

	async #except (errname, e) {
		$(".overlay").remove();

		await this.#write_descriptions();
		//await enable_everything();

		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		this.wrn(errname + ": " + e);
		console.trace();

		await this.#write_error(e);
		throw new Error(e);
	}

	get_input_shape_as_string () {
		var is = [];
		try {
			if(this.#model) {
				try {
					var is_full = this.#model.input.shape;

					if(is_full) {
						for (var i = 0; i < is_full.length; i++) {
							if(i != 0) {
								is.push(is_full[i]);
							}
						}
					}
				} catch (e) {
					if(("" + e).includes("model.input is undefined") || ("" + e).includes("model.input.shape is undefined")) {
						is = this.get_input_shape();
					} else {
						throw new Error(e);
					}
				}
			} else {
				is = this.get_input_shape();
			}

			if(is.length) {
				return "[" + is.join(", ") + "]";
			} else {
				return "[]";
			}
		} catch (e) {
			wrn("[get_input_shape_as_string] " + e);
			return "[]";
		}
	}

	#tf_constant_shape (val, x) {
		return tf.ones(x.shape).mul(val);
	}

	#deprocess_image(x) {
		this.assert(Object.keys("isDisposedInternal"), "x for deprocess image is not a tensor but " + typeof(x));

		var asanai_this = this;

		var res = this.tidy(() => {
			try {
				const {mean, variance} = asanai_this.tf_moments(x);
				x = asanai_this.tf_sub(x, mean);
				// Add a small positive number (EPSILON) to the denominator to prevent
				// division-by-zero.
				x = asanai_this.tf_add(asanai_this.tf_div(x, asanai_this.sqrt(variance), asanai_this.#tf_constant_shape(tf.backend().epsilon(), x)), x);
				// Clip to [0, 1].
				x = asanai_this.tf_add(x, asanai_this.#tf_constant_shape(0.5, x));
				x = asanai_this.#clipByValue(x, 0, 1);
				x = asanai_this.tf_mul(x, asanai_this.#tf_constant_shape(255, x));
				return asanai_this.#clipByValue(x, 0, 255).asType("int32");
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				asanai_this.err("" + e);

				return null;
			}
		});

		return res;
	}

	get_epochs () {
		return this.#epochs;
	}

	set_epochs (new_nr) {
		if(this.#looks_like_number(new_nr) && ("" + this.#parse_int(new_nr)) == ("" + new_nr)) {
			if(this.#epochs == new_nr) {
				this.wrn(`epochs: stayed the same. Not changing.`);
			} else {
				this.#epochs = this.#parse_int(new_nr);
			}

			return new_nr;
		} else {
			throw new Error(`set_epochs: ${new_nr} (type: ${typeof(new_nr)}) does not look like a valid number. Must be an integer!`);
		}
	}

	get_max_activation_iterations () {
		return this.#max_activation_iterations;
	}

	set_max_activation_iterations (new_nr) {
		if(this.#looks_like_number(new_nr) && ("" + this.#parse_int(new_nr)) == ("" + new_nr)) {
			if(this.#max_activation_iterations == new_nr) {
				this.wrn(`max_activation_iterations stayed the same. Not changing.`);
			} else {
				this.#max_activation_iterations = this.#parse_int(new_nr);
			}

			return new_nr;
		} else {
			throw new Error(`set_max_activation_iterations: ${new_nr} (type: ${typeof(new_nr)}) does not look like a valid number. Must be an integer!`);
		}
	}

	get_model_is_trained () {
		return this.#model_is_trained;
	}

	get_model_config_hash () {
		return this.#model_config_hash;
	}

	get_loss () {
		return this.#loss;
	}

	set_metric (new_loss) {
		var valid_metrices = [
			"meanAbsoluteError",
			"meanSquaredError",
			"rmse",
			"categoricalCrossentropy",
			"binaryCrossentropy",
			"meanSquaredLogarithmicError",
			"poisson",
			"squaredHinge",
			"logcosh",
			"meanAbsolutePercentageError",
		];

		if(valid_metrices.includes(new_metric)) {
			this.#metric = new_metric;

			return this.#metric;
		} else {
			throw new Error(`set_metric: ${new_metric} (type: ${typeof(new_metric)}) is not a valid metric. Valid metrices are: ${valid_metrices.join(", ")}.`);
		}
	}

	set_loss (new_loss) {
		var valid_losses = [
			"meanAbsoluteError",
			"meanSquaredError",
			"rmse",
			"categoricalCrossentropy",
			"binaryCrossentropy",
			"meanSquaredLogarithmicError",
			"poisson",
			"squaredHinge",
			"logcosh",
			"meanAbsolutePercentageError",
		];

		if(valid_losses.includes(new_loss)) {
			this.#loss = new_loss;

			return this.#loss;
		} else {
			throw new Error(`set_loss: ${new_loss} (type: ${typeof(new_loss)}) is not a valid loss. Valid losses are: ${valid_losses.join(", ")}.`);
		}
	}

	get_lang () {
		return this.#lang;
	}

	#tr(key) {
		if(!Object.keys(this.#language).includes(this.#lang)) {
			throw new Error(`${this.#lang} cannot be found in this.#language! Valid keys are ${Object.keys(this.#language).join(", ")}`);
		}

		if(Object.keys(this.#language[this.#lang]).includes(key)) {
			return this.#language[this.#lang][key];
		}

		throw new Error(`Translation key "${key}" cannot be found!`);
	}

	#_tensor_print_to_string (_tensor) {
		try {
			var logBackup = console.log;
			var logMessages = [];

			console.log = function () {
				logMessages.push.apply(logMessages, arguments);
			};

			_tensor.print(1);

			console.log = logBackup;

			return logMessages.join("\n");
		} catch (e) {
			if(("" + e).includes("Error: Tensor is disposed")) {
				wrn("[#_tensor_print_to_string] tensor to be printed was already disposed");
			} else {
				err("[#_tensor_print_to_string] #_tensor_print_to_string failed:", e);

			}
			return "<span class='error_msg'>Error getting tensor as string</span>";
		}
	}

	set_light_mode () {
		this.#is_dark_mode = false;

		return this.#is_dark_mode;
	}

	set_dark_mode () {
		this.#is_dark_mode = true;

		return this.#is_dark_mode;
	}
}
