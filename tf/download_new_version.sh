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
)

for i in "${FILES[@]}"; do
	rm $i
	FILENAME=$(echo $i | sed -e 's#.*/##' | sed -e 's/$/.js/' | sed -e 's/\.js\.js/\.js/')
	wget $i -O $FILENAME
done
