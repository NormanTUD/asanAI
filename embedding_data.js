"use strict";

/**
 * embedding_data.js
 * Handles parsing, tokenization, and data preparation for embedding-based models.
 * Works with own_embedding.php GUI tab.
 */

// === State ===
var embedding_parsed_x = null;
var embedding_parsed_y = null;
var embedding_vocab = {};       // word -> id
var embedding_vocab_inv = {};   // id -> word
var embedding_vocab_counter = 1; // 0 reserved for padding

/**
 * Toggle between token ID mode and text mode.
 */
function toggle_embedding_input_mode() {
    var mode = $("#embedding_input_mode").val();
    if (mode === "text") {
        $("#embedding_token_mode_text").show();
        $("#embedding_token_mode_ids").hide();
    } else {
        $("#embedding_token_mode_text").hide();
        $("#embedding_token_mode_ids").show();
    }
}

/**
 * Simple whitespace tokenizer. Builds vocab on the fly.
 * @param {string} text
 * @returns {Array<number>} token IDs
 */
function simple_tokenize(text) {
    var separator = $("#embedding_token_separator").val() || " ";
    var tokens = text.trim().split(separator).filter(t => t.length > 0);
    var ids = [];

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i].toLowerCase();
        if (!(token in embedding_vocab)) {
            embedding_vocab[token] = embedding_vocab_counter;
            embedding_vocab_inv[embedding_vocab_counter] = token;
            embedding_vocab_counter++;
        }
        ids.push(embedding_vocab[token]);
    }

    return ids;
}

/**
 * Pad or truncate a sequence to a fixed length.
 * @param {Array<number>} seq
 * @param {number} maxLen
 * @param {number} padValue
 * @returns {Array<number>}
 */
function pad_sequence(seq, maxLen, padValue) {
    padValue = padValue || 0;
    if (seq.length >= maxLen) {
        return seq.slice(0, maxLen);
    }
    var padded = seq.slice();
    while (padded.length < maxLen) {
        padded.push(padValue);
    }
    return padded;
}

/**
 * Parse embedding data from the GUI textareas.
 * Populates embedding_parsed_x and embedding_parsed_y.
 */
function parse_embedding_data() {
    $("#embedding_parse_errors").html("");
    embedding_parsed_x = null;
    embedding_parsed_y = null;

    var input_mode = $("#embedding_input_mode").val();
    var seq_length = parseInt($("#embedding_seq_length").val()) || 10;
    var x_data = [];
    var y_data = [];

    try {
        if (input_mode === "text") {
            // Reset vocab for fresh parse
            embedding_vocab = {};
            embedding_vocab_inv = {};
            embedding_vocab_counter = 1;

            var text_lines = $("#embedding_text_input").val().trim().split("\n").filter(l => l.trim().length > 0);
            var label_lines = $("#embedding_text_labels").val().trim().split("\n").filter(l => l.trim().length > 0);

            if (text_lines.length === 0) {
                $("#embedding_parse_errors").html("No text input provided.");
                return;
            }

            if (label_lines.length > 0 && label_lines.length !== text_lines.length) {
                $("#embedding_parse_errors").html("Number of labels (" + label_lines.length + ") does not match number of text samples (" + text_lines.length + ").");
                return;
            }

            for (var i = 0; i < text_lines.length; i++) {
                var token_ids = simple_tokenize(text_lines[i]);
                x_data.push(pad_sequence(token_ids, seq_length));
            }

            // Build y_data from labels
            if (label_lines.length > 0) {
                var unique_labels = [];
                for (var j = 0; j < label_lines.length; j++) {
                    var lbl = label_lines[j].trim();
                    if (!unique_labels.includes(lbl)) {
                        unique_labels.push(lbl);
                    }
                }
                for (var k = 0; k < label_lines.length; k++) {
                    y_data.push(unique_labels.indexOf(label_lines[k].trim()));
                }

                // Set labels in GUI
                if (typeof set_labels === "function") {
                    set_labels(unique_labels);
                }
            }

            // Auto-adjust vocab size
            if ($("#embedding_auto_adjust_input_dim").is(":checked")) {
                $("#embedding_vocab_size").val(embedding_vocab_counter);
            }

        } else {
            // Token ID mode
            var token_lines = $("#embedding_token_input").val().trim().split("\n").filter(l => l.trim().length > 0);
            var y_lines = $("#embedding_y_input").val().trim().split("\n").filter(l => l.trim().length > 0);

            if (token_lines.length === 0) {
                $("#embedding_parse_errors").html("No token input provided.");
                return;
            }

            var separator = $("#embedding_token_separator").val() || " ";

            for (var ti = 0; ti < token_lines.length; ti++) {
                var parts = token_lines[ti].trim().split(separator).filter(p => p.length > 0);
                var int_parts = [];
                for (var pi = 0; pi < parts.length; pi++) {
                    var val = parseInt(parts[pi]);
                    if (isNaN(val)) {
                        $("#embedding_parse_errors").html("Non-integer value '" + parts[pi] + "' in line " + (ti + 1));
                        return;
                    }
                    int_parts.push(val);
                }
                x_data.push(pad_sequence(int_parts, seq_length));
            }

            // Parse Y
            for (var yi = 0; yi < y_lines.length; yi++) {
                var yval = parseFloat(y_lines[yi].trim());
                if (isNaN(yval)) {
                    $("#embedding_parse_errors").html("Non-numeric Y value in line " + (yi + 1));
                    return;
                }
                y_data.push(yval);
            }

            if (y_lines.length > 0 && y_lines.length !== token_lines.length) {
                $("#embedding_parse_errors").html("Number of Y values (" + y_lines.length + ") does not match number of X samples (" + token_lines.length + ").");
                return;
            }
        }

        // Auto-adjust sequence length
        if ($("#embedding_auto_adjust_seq_length").is(":checked") && x_data.length > 0) {
            var actual_seq_len = x_data[0].length;
            $("#embedding_seq_length").val(actual_seq_len);
        }

        embedding_parsed_x = x_data;
        embedding_parsed_y = y_data;

        update_embedding_data_preview();
        show_embedding_inspection_panel();

        log("[embedding_data] Parsed " + x_data.length + " samples, seq_length=" + seq_length);

    } catch (e) {
        $("#embedding_parse_errors").html("Parse error: " + (e.message || e));
        err("[parse_embedding_data] " + e);
    }
}

/**
 * Update the data preview in the GUI.
 */
function update_embedding_data_preview() {
    if (!embedding_parsed_x || embedding_parsed_x.length === 0) {
        $(".hide_when_no_embedding").hide();
        return;
    }

    $(".hide_when_no_embedding").show();

    var max_preview = Math.min(embedding_parsed_x.length, 5);

    // X preview
    var x_html = "<table class='table_border_1px'><tr><th>#</th><th>Token IDs</th></tr>";
    for (var i = 0; i < max_preview; i++) {
        x_html += "<tr><td>" + i + "</td><td>[" + embedding_parsed_x[i].join(", ") + "]</td></tr>";
    }
    if (embedding_parsed_x.length > max_preview) {
        x_html += "<tr><td colspan='2'>... (" + (embedding_parsed_x.length - max_preview) + " more)</td></tr>";
    }
    x_html += "</table>";
    $("#embedding_x_preview").html(x_html);

    // Y preview
    if (embedding_parsed_y && embedding_parsed_y.length > 0) {
        var y_html = "<table class='table_border_1px'><tr><th>#</th><th>Label/Target</th></tr>";
        for (var j = 0; j < max_preview; j++) {
            y_html += "<tr><td>" + j + "</td><td>" + embedding_parsed_y[j] + "</td></tr>";
        }
        y_html += "</table>";
        $("#embedding_y_preview").html(y_html);
    }

    // Vocab info
    var vocab_size = Object.keys(embedding_vocab).length || parseInt($("#embedding_vocab_size").val());
    var seq_len = embedding_parsed_x[0].length;
    $("#embedding_vocab_info").html(
        "<br>Vocab size: " + vocab_size +
        "<br>Tokens mapped: " + Object.keys(embedding_vocab).length
    );

    // Shape info
    $("#embedding_x_shape").html("X shape: [" + embedding_parsed_x.length + ", " + seq_len + "]");
    if (embedding_parsed_y && embedding_parsed_y.length > 0) {
        var unique_y = [...new Set(embedding_parsed_y)];
        $("#embedding_y_shape").html("Y shape: [" + embedding_parsed_y.length + "]<br>Unique classes: " + unique_y.length);
    }
}

/**
 * Show the embedding inspection panel.
 */
function show_embedding_inspection_panel() {
    $("#embedding_inspection_panel").show();
}

/**
 * Inspect a specific token's embedding vector.
 */
function inspect_embedding_token() {
    var token_id = parseInt($("#embedding_inspect_token_id").val());
    var layer_idx = parseInt($("#embedding_inspect_layer_idx").val());

    if (isNaN(token_id) || isNaN(layer_idx)) {
        $("#embedding_inspect_result").html("Invalid token ID or layer index.");
        return;
    }

    var vec = getEmbeddingForToken(layer_idx, token_id);
    if (vec === null) {
        $("#embedding_inspect_result").html("Could not retrieve embedding. Is the model compiled with an Embedding layer at index " + layer_idx + "?");
        return;
    }

    var word = embedding_vocab_inv[token_id] || "(unknown)";
    var html = "Token ID: " + token_id + " (\"" + word + "\")\n";
    html += "Embedding dim: " + vec.length + "\n";
    html += "Vector: [" + vec.map(v => v.toFixed(6)).join(", ") + "]";

    $("#embedding_inspect_result").html(html);
}

/**
 * Inspect attention Q/K/V weight matrices.
 */
function inspect_attention_weights() {
    var layer_idx = parseInt($("#attention_inspect_layer_idx").val());

    if (isNaN(layer_idx)) {
        $("#attention_inspect_result").html("Invalid layer index.");
        return;
    }

    var weights = getAttentionWeights(layer_idx);
    if (weights === null) {
        $("#attention_inspect_result").html("Could not retrieve attention weights. Is there a SimpleAttention layer at index " + layer_idx + "?");
        return;
    }

    var html = "";
    html += "=== Wq (Query) ===\nShape: [" + weights.Wq.length + ", " + weights.Wq[0].length + "]\n";
    html += format_matrix_preview(weights.Wq, 5) + "\n\n";

    html += "=== Wk (Key) ===\nShape: [" + weights.Wk.length + ", " + weights.Wk[0].length + "]\n";
    html += format_matrix_preview(weights.Wk, 5) + "\n\n";

    html += "=== Wv (Value) ===\nShape: [" + weights.Wv.length + ", " + weights.Wv[0].length + "]\n";
    html += format_matrix_preview(weights.Wv, 5);

    $("#attention_inspect_result").html(html);
}

/**
 * Format a 2D matrix for preview (show first N rows).
 */
function format_matrix_preview(matrix, maxRows) {
    maxRows = maxRows || 5;
    var lines = [];
    var show = Math.min(matrix.length, maxRows);
    for (var i = 0; i < show; i++) {
        lines.push("  [" + matrix[i].slice(0, 8).map(v => v.toFixed(4)).join(", ") + (matrix[i].length > 8 ? ", ..." : "") + "]");
    }
    if (matrix.length > maxRows) {
        lines.push("  ... (" + (matrix.length - maxRows) + " more rows)");
    }
    return lines.join("\n");
}

/**
 * Load example embedding data into the textareas.
 */
function load_embedding_example_data() {
    var input_mode = $("#embedding_input_mode").val();

    if (input_mode === "text") {
        $("#embedding_text_input").val(
            "the cat sat on the mat\n" +
            "the dog ran in the park\n" +
            "a bird flew over the house\n" +
            "the fish swam in the lake\n" +
            "a cat chased the mouse"
        );
        $("#embedding_text_labels").val(
            "cat\ndog\nbird\nfish\ncat"
        );
    } else {
        $("#embedding_token_input").val(
            "1 2 3 4 1 5 0 0 0 0\n" +
            "1 6 7 8 1 9 0 0 0 0\n" +
            "10 11 12 13 1 14 0 0 0 0\n" +
            "1 15 16 8 1 17 0 0 0 0\n" +
            "10 2 18 1 19 0 0 0 0 0"
        );
        $("#embedding_y_input").val(
            "0\n1\n2\n3\n0"
        );
    }

    $("#embedding_seq_length").val(10);
    parse_embedding_data();
}

/**
 * Get the parsed embedding data as tensors for training.
 * Called by the training pipeline.
 * @returns {Object|null} { x: tf.Tensor2D, y: tf.Tensor, xShape: [...], yShape: [...] }
 */
function get_embedding_training_data() {
    if (!embedding_parsed_x || embedding_parsed_x.length === 0) {
        wrn("[get_embedding_training_data] No parsed embedding data available.");
        return null;
    }

    var x_tensor = tf.tensor2d(embedding_parsed_x, [embedding_parsed_x.length, embedding_parsed_x[0].length], 'int32');

    var y_tensor = null;
    if (embedding_parsed_y && embedding_parsed_y.length > 0) {
        var unique_y = [...new Set(embedding_parsed_y)];
        var num_classes = unique_y.length;

        if (num_classes > 1) {
            // One-hot encode
            var y_indices = tf.tensor1d(embedding_parsed_y, 'int32');
            y_tensor = tf.oneHot(y_indices, num_classes).toFloat();
            y_indices.dispose();
        } else {
            y_tensor = tf.tensor1d(embedding_parsed_y, 'float32');
        }
    }

    return {
        x: x_tensor,
        y: y_tensor,
        xShape: x_tensor.shape,
        yShape: y_tensor ? y_tensor.shape : null,
        numClasses: embedding_parsed_y ? [...new Set(embedding_parsed_y)].length : 0,
        vocabSize: Object.keys(embedding_vocab).length || parseInt($("#embedding_vocab_size").val()),
        seqLength: embedding_parsed_x[0].length
    };
}

/**
 * Check if embedding data source is active and has data.
 * @returns {boolean}
 */
function is_embedding_data_ready() {
    return (embedding_parsed_x !== null && embedding_parsed_x.length > 0);
}

log("[embedding_data.js] Embedding data module loaded.");
