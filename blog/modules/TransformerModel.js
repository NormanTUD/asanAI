class TransformerModel {
    constructor(config) {
        this.config = config; // { dModel, nHeads, nLayers, vocabSize }
        this.attentionHeads = Array.from({ length: config.nHeads }, () => 
            new AttentionHead(config.dModel, config.dModel / config.nHeads)
        );
        this.outputProjection = new LinearLayer(config.dModel, config.vocabSize, "Out");
    }

    forward(tokens) {
        // 1. Multi-Head Attention
        const headOutputs = this.attentionHeads.map(head => head.forward(tokens).output);
        
        // 2. Concatenation (simple merge for this example)
        const concatenated = tokens.map((_, i) => {
            return headOutputs.flatMap(h => h[i]);
        });

        // 3. Output Logits
        return concatenated.map(vec => this.outputProjection.forward(vec));
    }

    toLatex(abstract = true) {
        return abstract ? `P = \\text{Softmax}(Z_{concat} W_O)` : `\\text{Full Model Integration}`;
    }
}
