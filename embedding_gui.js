"use strict";

/**
 * GUI integration for Embedding and Attention layers.
 * This file registers the layers in layer_options and provides
 * the necessary helper functions.
 */

// === Register in layer_options ===

layer_options["AsanEmbedding"] = {
    "description": `<span class="TRANSLATEME_embedding_description">Embedding Layer: Maps integer indices to dense vectors. Set inputDim (vocabulary size) and outputDim (embedding dimension). All embedding weights are fully inspectable.</span>`,
    "options": [
        "input_dim",
        "output_dim",
        "trainable"
    ],
    "category": "Embedding",
    "custom": 1
};

layer_options["SimpleAttention"] = {
    "description": `<span class="TRANSLATEME_attention_description">Self-Attention Layer: Computes Query, Key, Value matrices and applies scaled dot-product attention. All Q/K/V weight matrices are fully readable. Set 'units' for the attention dimension.</span>`,
    "options": [
        "units",
        "trainable"
    ],
    "category": "Embedding",
    "custom": 1
};

layer_options["Unembedding"] = {
    "description": `<span class="TRANSLATEME_unembedding_description">Unembedding Layer: Projects the last token's hidden state back to vocabulary size via a learned weight matrix + softmax. This is the inverse of the embedding layer, used as the final output layer for next-word prediction models.</span>`,
    "options": [
        "vocabSize",
        "trainable"
    ],
    "category": "Embedding",
    "custom": 1
};



// === Register layer_options_defaults for new options ===

if (typeof layer_options_defaults !== "undefined") {
    layer_options_defaults["input_dim"] = 100;
    layer_options_defaults["output_dim"] = 32;
    layer_options_defaults["vocabSize"] = 100;
}

// === Register in js_names_to_python_names ===

if (typeof js_names_to_python_names !== "undefined") {
    js_names_to_python_names["inputDim"] = "input_dim";
    js_names_to_python_names["outputDim"] = "output_dim";
    js_names_to_python_names["vocabSize"] = "vocab_size";
    js_names_to_python_names["AsanEmbedding"] = "AsanEmbedding";
    js_names_to_python_names["SimpleAttention"] = "SimpleAttention";
    js_names_to_python_names["Unembedding"] = "Unembedding";
}

if (typeof python_names_to_js_names !== "undefined") {
    python_names_to_js_names["input_dim"] = "inputDim";
    python_names_to_js_names["output_dim"] = "outputDim";
    python_names_to_js_names["vocab_size"] = "vocabSize";
}

// === Update layer_names array ===

if (typeof layer_names !== "undefined") {
    if (!layer_names.includes("AsanEmbedding")) {
        layer_names.push("AsanEmbedding");
    }
    if (!layer_names.includes("SimpleAttention")) {
        layer_names.push("SimpleAttention");
    }
    if (!layer_names.includes("Unembedding")) {
        layer_names.push("Unembedding");
    }
}

// === valid_layer_options registration ===

if (typeof valid_layer_options !== "undefined") {
    valid_layer_options["AsanEmbedding"] = ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputDim", "inputLength", "inputShape", "maskZero", "name", "outputDim", "trainable", "weights"];
    valid_layer_options["SimpleAttention"] = ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "units", "weights"];
    valid_layer_options["Unembedding"] = ["args", "batchInputShape", "batchSize", "dtype", "inputDType", "inputShape", "name", "trainable", "vocabSize", "weights"];
}

// === Embedding data inspection utility ===

/**
 * Get the full embedding matrix as a 2D array.
 * @param {number} layerIndex - index of the embedding layer in model.layers
 * @returns {Array|null} 2D array [inputDim x outputDim] or null
 */
function getEmbeddingMatrix(layerIndex) {
    if (!model || !model.layers || !model.layers[layerIndex]) {
        wrn("[getEmbeddingMatrix] Invalid layer index or no model");
        return null;
    }

    var layer = model.layers[layerIndex];
    var weights = layer.getWeights();
    if (!weights || weights.length === 0) {
        wrn("[getEmbeddingMatrix] No weights in layer", layerIndex);
        return null;
    }

    return tf.tidy(() => {
        return weights[0].arraySync();
    });
}

/**
 * Get the embedding vector for a specific token index.
 * @param {number} layerIndex - index of the embedding layer
 * @param {number} tokenIndex - the token/word index
 * @returns {Array|null} 1D array of length outputDim
 */
function getEmbeddingForToken(layerIndex, tokenIndex) {
    var matrix = getEmbeddingMatrix(layerIndex);
    if (!matrix) return null;
    if (tokenIndex < 0 || tokenIndex >= matrix.length) {
        wrn("[getEmbeddingForToken] tokenIndex out of range");
        return null;
    }
    return matrix[tokenIndex];
}

/**
 * Get attention weights (Q, K, V matrices) from a SimpleAttention layer.
 * @param {number} layerIndex - index of the attention layer
 * @returns {Object|null} { Wq: 2D, Wk: 2D, Wv: 2D }
 */
function getAttentionWeights(layerIndex) {
    if (!model || !model.layers || !model.layers[layerIndex]) {
        wrn("[getAttentionWeights] Invalid layer index or no model");
        return null;
    }

    var layer = model.layers[layerIndex];
    var weights = layer.getWeights();
    if (!weights || weights.length < 3) {
        wrn("[getAttentionWeights] Not enough weights in layer", layerIndex);
        return null;
    }

    return tf.tidy(() => {
        return {
            Wq: weights[0].arraySync(),
            Wk: weights[1].arraySync(),
            Wv: weights[2].arraySync()
        };
    });
}

$(function() {
    // Add "embedding" option to #data_origin select if not present
    if ($("#data_origin").length && $("#data_origin option[value='embedding']").length === 0) {
        $("#data_origin").append('<option value="embedding">Embedding/Sequence</option>');
    }

    // Only add tab label if not already present
    if ($("#own_embedding_tab_label").length === 0) {
        var $csv_li = $("#own_csv_tab_label").closest("li");
        if ($csv_li.length) {
            var $new_tab = $('<li class="ui-tab" style="display:none"><a id="own_embedding_tab_label" href="#own_embedding_tab"><span class="TRANSLATEME_own_embedding_data">Embedding/Sequence</span></a></li>');
            $csv_li.after($new_tab);
        }
    }

    // Initially hide the embedding tab
    $("#own_embedding_tab").hide();
});
