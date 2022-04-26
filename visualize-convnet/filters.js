/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * Algorithms for analyzing and visualizing the convolutional filters
 * internal to a convnet.
 *
 * 1. Retrieving internal activations of a convnet.
 *    See function `writeInternalActivationAndGetOutput()`.
 * 2. Calculate maximally-activating input image for convnet filters, using
 *    gradient ascent in input space.
 *    See function `inputGradientAscent()`.
 **/

/**
 * Write internal activation of conv layers to file; Get model output.
 *
 * @param {tf.Model} model The model of interest.
 * @param {string[]} layerNames Names of layers of interest.
 * @param {tf.Tensor4d} inputImage The input image represented as a 4D tensor
 *   of shape [1, height, width, 3].
 * @param {number} numFilters Number of filters to run for each convolutional
 *   layer. If it exceeds the number of filters of a convolutional layer, it
 *   will be cut off.
 * @param {string} outputDir Path to the directory to which the image files
 *   representing the activation will be saved.
 * @return modelOutput: final output of the model as a tf.Tensor.
 *         layerName2FilePaths: an object mapping layer name to the paths to the
 *           image files saved for the layer's activation.
 *         layerName2FilePaths: an object mapping layer name to the height
 *           and width of the layer's filter outputs.
 */






/**
 * Write an image tensor to a image file.
 *
 * @param {tf.Tensor} imageTensor The image tensor to write to file.
 *   Assumed to be an int32-type tensor with value in the range 0-255.
 * @param {string} filePath Destination file path.
 */
async function writeImageTensorToFile(imageTensor, filePath) {
	const imageH = imageTensor.shape[1];
	const imageW = imageTensor.shape[2];
	const imageData = imageTensor.dataSync();

	const bufferLen = imageH * imageW * 4;
	const buffer = new Uint8Array(bufferLen);
	let index = 0;
	for (let i = 0; i < imageH; ++i) {
		for (let j = 0; j < imageW; ++j) {
			const inIndex = 3 * (i * imageW + j);
			buffer.set([Math.floor(imageData[inIndex])], index++);
			buffer.set([Math.floor(imageData[inIndex + 1])], index++);
			buffer.set([Math.floor(imageData[inIndex + 2])], index++);
			buffer.set([255], index++);
		}
	}

	return new Promise((resolve, reject) => {
		return Buffer(buffer);
	});
}

// 64 x 3 RGB colormap.
// This is used to convert a 1-channel (grayscale) image into a color
// (RGB) one. The color map is based on the output of the "parula" colormap
// command in MATLAB.
const RGB_COLORMAP = [
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

/**
 * Convert an input monocolor image to color by applying a color map.
 * 
 * @param {tf.Tensor4d} x Input monocolor image, assumed to be of shape
 *   `[1, height, width, 1]`.
 * @returns Color image, of shape `[1, height, width, 3]`.
 */
function applyColorMap(x) {
	tf.util.assert(
		x.rank === 4, `Expected rank-4 tensor input, got rank ${x.rank}`);
	tf.util.assert(
		x.shape[0] === 1,
		`Expected exactly one example, but got ${x.shape[0]} examples`);
	tf.util.assert(
		x.shape[3] === 1,
		`Expected exactly one channel, but got ${x.shape[3]} channels`);

	return tf.tidy(() => {
		// Get normalized x.
		const EPSILON = 1e-5;
		const xRange = x.max().sub(x.min());
		const xNorm = x.sub(x.min()).div(xRange.add(EPSILON));
		const xNormData = xNorm.dataSync();

		const h = x.shape[1];
		const w = x.shape[2];
		const buffer = tf.buffer([1, h, w, 3]);

		const colorMapSize = RGB_COLORMAP.length / 3;
		for (let i = 0; i < h; ++i) {
			for (let j = 0; j < w; ++j) {
				const pixelValue = xNormData[i * w + j];
				const row = Math.floor(pixelValue * colorMapSize);
				buffer.set(RGB_COLORMAP[3 * row], 0, i, j, 0);
				buffer.set(RGB_COLORMAP[3 * row + 1], 0, i, j, 1);
				buffer.set(RGB_COLORMAP[3 * row + 2], 0, i, j, 2);
			}
		}
		return buffer.toTensor();
	});
}


























async function writeInternalActivationAndGetOutput(
	model, layerNames, inputImage, numFilters, outputDir) {
	const layerName2FilePaths = {};
	const layerName2ImageDims = {};
	const layerOutputs =
		layerNames.map(layerName => model.getLayer(layerName).output);

	// Construct a model that returns all the desired internal activations,
	// in addition to the final output of the original model.
	const compositeModel = tf.model(
		{inputs: model.input, outputs: layerOutputs.concat(model.outputs[0])});

	// `outputs` is an array of `tf.Tensor`s consisting of the internal-activation
	// values and the final output value.
	const outputs = compositeModel.predict(inputImage);

	for (let i = 0; i < outputs.length - 1; ++i) {
		const layerName = layerNames[i];
		// Split the activation of the convolutional layer by filter.
		const activationTensors =
			tf.split(outputs[i], outputs[i].shape[outputs[i].shape.length - 1], -1);
		const actualNumFilters = numFilters <= activationTensors.length ?
			numFilters :
			activationTensors.length;
		const filePaths = [];
		let imageTensorShape;
		for (let j = 0; j < actualNumFilters; ++j) {
			// Format activation tensors and write them to disk.
			const imageTensor = tf.tidy(
				() => deprocessImage(tf.tile(activationTensors[j], [1, 1, 1, 3])));
			const outputFilePath = path.join(outputDir, `${layerName}_${j + 1}.png`);
			filePaths.push(outputFilePath);
			await writeImageTensorToFile(imageTensor, outputFilePath);
			imageTensorShape = imageTensor.shape;
		}
		layerName2FilePaths[layerName] = filePaths;
		layerName2ImageDims[layerName] = imageTensorShape.slice(1, 3);
		tf.dispose(activationTensors);
	}
	tf.dispose(outputs.slice(0, outputs.length - 1));
	return {
		modelOutput: outputs[outputs.length - 1],
		layerName2FilePaths,
		layerName2ImageDims
	};
}


/**
 * Generate the maximally-activating input image for a conv2d layer filter.
 *
 * Uses gradient ascent in input space.
 *
 * @param {tf.Model} model The model that the convolutional layer of interest
 *   belongs to.
 * @param {string} layerName Name of the convolutional layer.
 * @param {number} filterIndex Index to the filter of interest. Must be
 *   < number of filters of the conv2d layer.
 * @param {number} iterations Number of gradient-ascent iterations.
 * @return {tf.Tensor} The maximally-activating input image as a tensor.
 */
function inputGradientAscent(model, layerName, filterIndex, iterations = 40) {
	return tf.tidy(() => {
		const imageH = model.inputs[0].shape[1];
		const imageW = model.inputs[0].shape[2];
		const imageDepth = model.inputs[0].shape[3];

		// Create an auxiliary model of which input is the same as the original
		// model but the output is the output of the convolutional layer of
		// interest.
		const layerOutput = model.getLayer(layerName).output;
		const auxModel = tf.model({inputs: model.inputs, outputs: layerOutput});

		// This function calculates the value of the convolutional layer's
		// output at the designated filter index.
		const lossFunction = (input) =>
			auxModel.apply(input, {training: true}).gather([filterIndex], 3);

		// This returned function (`gradFunction`) calculates the gradient of the
		// convolutional filter's output with respect to the input image.
		const gradFunction = tf.grad(lossFunction);

		// Form a random image as the starting point of the gradient ascent.
		let image = tf.randomUniform([1, imageH, imageW, imageDepth], 0, 1)
			.mul(20)
			.add(128);

		for (let i = 0; i < iterations; ++i) {
			const scaledGrads = tf.tidy(() => {
				const grads = gradFunction(image);
				const norm =
					tf.sqrt(tf.mean(tf.square(grads))).add(tf.backend().epsilon());
				// Important trick: scale the gradient with the magnitude (norm)
				// of the gradient.
				return grads.div(norm);
			});
			// Perform one step of gradient ascent: Update the image along the
			// direction of the gradient.
			image = tf.clipByValue(image.add(scaledGrads), 0, 255);
		}
		return deprocessImage(image);
	});
}

/** Center and scale input image so the pixel values fall into [0, 255]. */
function deprocessImage(x) {
	return tf.tidy(() => {
		const {mean, variance} = tf.moments(x);
		x = x.sub(mean);
		// Add a small positive number (EPSILON) to the denominator to prevent
		// division-by-zero.
		x = x.div(tf.sqrt(variance).add(tf.backend().epsilon()));
		// Clip to [0, 1].
		x = x.add(0.5);
		x = tf.clipByValue(x, 0, 1);
		x = x.mul(255);
		return tf.clipByValue(x, 0, 255).asType('int32');
	});
}
