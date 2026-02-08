function run_attention_tests() {
	console.debug("--- STARTING TRANSFORMER TEST SUITE ---");
	let testsPassed = 0;

	try {
		// Test 1: Activation
		const reluTest = Activations.relu(-5) === 0 && Activations.relu(5) === 5;
		console.debug("Test 1 (ReLU):", reluTest ? "PASSED" : "FAILED", "| Value:", Activations.relu(-5));
		if(reluTest) testsPassed++;

		// Test 2: Linear Layer Shape
		const lin = new LinearLayer(4, 2);
		const linOut = lin.forward([1, 0, 1, 0]);
		const linTest = linOut.length === 2;
		console.debug("Test 2 (Linear Shape):", linTest ? "PASSED" : "FAILED", "| Output:", linOut);
		if(linTest) testsPassed++;

		// Test 3: Attention Softmax Sum
		const head = new AttentionHead(4, 2);
		const sampleInput = [[1,0,0,1], [0,1,1,0]];
		const attResult = head.forward(sampleInput);
		const sumRow = attResult.scores[0].reduce((a, b) => a + b, 0);
		const attTest = Math.abs(sumRow - 1.0) < 0.0001;
		console.debug("Test 3 (Attention Softmax Sums to 1):", attTest ? "PASSED" : "FAILED", "| Sum:", sumRow);
		if(attTest) testsPassed++;

		// Test 4: Full Model Forward
		const model = new TransformerModel({ dModel: 4, nHeads: 2, nLayers: 1, vocabSize: 10 });
		const tokenIds = [1, 3, 5]; 
		const modelOut = model.forward(tokenIds);

		const modelTest = modelOut.length === 3 && modelOut[0].length === 10;
		console.debug("Test 4 (Model Output Shape):", modelTest ? "PASSED" : "FAILED", "| Shape:", `[${modelOut.length}, ${modelOut[0].length}]`);
		if(modelTest) testsPassed++;

		// Test 5: LaTeX Generation
		const latex = lin.toLatex(true);
		console.debug("Test 5 (LaTeX Abstract):", latex.includes("W") ? "PASSED" : "FAILED", "| String:", latex);
		if(latex) testsPassed++;

		const bpe = new BPETokenizer();
		const trainText = "low low low low low lowest lowest newer newer";
		bpe.train(trainText, 10);
		const encoded = bpe.encode("low");
		console.assert(encoded.length > 0, "BPE Encoding failed");

		// Tests.js - Update the Callback section
		let callbackTriggered = false;
		model.addCallback((data) => {
			// Check if this is an attention-related callback
			if (data.scores) {
				callbackTriggered = true;
				console.debug(`Callback Layer ${data.layer} Attention:`, {
					attnShape: `${data.scores.length}x${data.scores[0].length}`
				});
			}

			// Check if this is a layer-end callback
			if (data.activations) {
				console.debug(`Callback Layer ${data.layer} Activations:`, {
					actSum: data.activations[0].reduce((a, b) => a + b, 0)
				});
			}
		});

		const sampleSeq = Array.from({length: 5}, () => Array(8).fill(0.1));
		model.forward(sampleSeq);
		console.assert(callbackTriggered, "Internal callback was not triggered");

	} catch (e) {
		console.error("CRITICAL TEST FAILURE:", e);
	}

	console.debug(`--- TEST SUITE COMPLETE: ${testsPassed}/5 PASSED ---`);
}
