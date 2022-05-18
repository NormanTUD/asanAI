#!/bin/bash

declare -a FILES=(
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js.map"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.js"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.js.map"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-vis/dist/tfjs-vis.umd.min.js.map"
	"https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-vis"
)

for i in "${FILES[@]}"; do
	echo $i
	FILENAME=$(echo $i | sed -e 's#.*/##' | sed -e 's/$/.js/' | sed -e 's/\.js\.js/\.js/')
	echo $FILENAME
done
