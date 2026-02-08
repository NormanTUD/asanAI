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

		// Enhanced Test: Transformer Internal Callback Debugging
		const debugModel = new TransformerModel({ vocabSize: 10, dModel: 4, nHeads: 2, nLayers: 1 });
		let callbackTriggered = false;

		debugModel.addCallback((type, data) => {
			callbackTriggered = true;
			console.debug(`[Callback Triggered] Type: ${type}`);
			console.debug("Data Payload:", data);
			console.trace("Callback Stack Trace"); // Shows exactly how we got here
		});

		try {
			const input = [1, 2, 3];
			debugModel.forward(input);

			if (!callbackTriggered) {
				console.error("FAIL: Internal callback was not triggered.");
				// If it fails, check if AttentionHead.forward actually returns the expected object
			} else {
				console.log("SUCCESS: Callback captured successfully.");
			}
		} catch (e) {
			console.error("Error during forward pass:", e);
		}

	} catch (e) {
		console.error("CRITICAL TEST FAILURE:", e);
	}

	// Test 6: BPE Merging Logic
	const bpeTest = new BPETokenizer();
	const trainData = "aaabdaaabac";
	// After 1 iteration, 'aa' (most frequent) should be merged into token 256
	bpeTest.train(trainData, 1);
	const encodedBPE = bpeTest.encode("aa");
	const bpePassed = encodedBPE[0] === 256;
	console.debug("Test 6 (BPE Merge):", bpePassed ? "PASSED" : "FAILED", "| Token:", encodedBPE[0]);
	if (bpePassed) testsPassed++;

	// Test 7: Linear Layer Weight Update
	const linUpdate = new LinearLayer(2, 2);
	const customW = [[1, 0], [0, 1]];
	const customB = [0, 0];
	linUpdate.setWeights(customW, customB);
	const linOutUpdate = linUpdate.forward([5, 10]);
	const updateTest = linOutUpdate[0] === 5 && linOutUpdate[1] === 10;
	console.debug("Test 7 (Linear SetWeights):", updateTest ? "PASSED" : "FAILED", "| Output:", linOutUpdate);
	if (updateTest) testsPassed++;

	// Test 8: Multi-Head Attention Consistency
	const mhaConfig = { nHeads: 2, dModel: 4 };
	const mha = new MultiHeadsAttention(mhaConfig);
	const mhaInput = [[1, 0, 0, 1], [0, 1, 1, 0]]; // 2x4
	const mhaOut = mha.forward(mhaInput);
	const mhaTest = mhaOut.length === 2 && mhaOut[0].length === 4;
	console.debug("Test 8 (MHA Shape):", mhaTest ? "PASSED" : "FAILED", "| Shape:", `[${mhaOut.length}, ${mhaOut[0].length}]`);
	if (mhaTest) testsPassed++;

	// Test 9: Residual Connection (AddAndNorm)
	const modelRes = new TransformerModel({ vocabSize: 10, dModel: 4, nHeads: 2, nLayers: 1 });
	const resInput = [[1, 1, 1, 1]];
	const resAdd = [[2, 2, 2, 2]];
	const resOut = modelRes.addAndNorm(resInput, resAdd);
	const resTest = resOut[0][0] === 3;
	console.debug("Test 9 (Residual Add):", resTest ? "PASSED" : "FAILED", "| Result:", resOut[0]);
	if (resTest) testsPassed++;

	// Test 10: GeLU Activation
	const geluVal = Activations.gelu(1);
	const geluTest = geluVal > 0.8 && geluVal < 0.9; // GeLU(1) ≈ 0.8413
	console.debug("Test 10 (GeLU Value):", geluTest ? "PASSED" : "FAILED", "| Value:", geluVal.toFixed(4));
	if (geluTest) testsPassed++;

	console.debug(`--- TEST SUITE COMPLETE: ${testsPassed}/10 PASSED ---`);
}
