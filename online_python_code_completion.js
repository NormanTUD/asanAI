// ===== AUTOCOMPLETE MODULE =====
// Standalone IIFE — does NOT depend on online_python.js internals

(function setupAutocomplete() {

    // =========================================================================
    // LOCAL UTILITIES
    // =========================================================================

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var PY_KEYWORDS = new Set([
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
        'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
        'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
        'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
        'try', 'while', 'with', 'yield'
    ]);

    // =========================================================================
    // AUTOCOMPLETE STATE
    // =========================================================================

    var acPopup = null;
    var acItems = [];
    var acSelectedIndex = -1;
    var acVisible = false;
    var acPrefix = '';
    var acStartPos = 0;
    var acDismissed = false;
    var acDebounceTimer = null;
    var acAccepting = false;

    // *** GLOBAL FLAG ***
    // Your main editor (online_python.js) should check this before auto-executing:
    //   if (window._acInserting) return;
    // Add that check at the top of whatever function runs the Python code automatically.
    window._acInserting = false;
    window._acRecentlyInserted = false;

    // =========================================================================
    // CONTEXT-AWARE COMPLETION SOURCES
    // =========================================================================

    var ENV_FUNCTIONS = [
	{ text: 'predict(', label: 'predict(data)', kind: 'function', detail: 'Run model prediction on input data' },
        { text: 'get_model_info()', label: 'get_model_info()', kind: 'function', detail: 'Get model architecture info' },
        { text: 'get_weights()', label: 'get_weights()', kind: 'function', detail: 'Get model weight tensors' },
        { text: 'set_prediction_result(', label: 'set_prediction_result(result)', kind: 'function', detail: 'Display prediction result in UI' },
        { text: 'rand_nested(', label: 'rand_nested(shape)', kind: 'function', detail: 'Generate random nested list' },
        { text: 'create_canvas(', label: 'create_canvas(w, h)', kind: 'function', detail: 'Create drawable HTML canvas' },
        { text: 'display(', label: 'display(obj)', kind: 'function', detail: 'Show canvas/object in output' },
        { text: 'display_html(', label: 'display_html(html)', kind: 'function', detail: 'Render raw HTML in output' },
        { text: 'display_image(', label: 'display_image(src, w, h)', kind: 'function', detail: 'Show image in output' },
        { text: 'check_interrupt()', label: 'check_interrupt()', kind: 'function', detail: 'Allow stopping execution' },
        // PRE-INJECTED HELPERS
        { text: '_setup_model()', label: '_setup_model()', kind: 'function', detail: 'Setup model + return state dict' },
        { text: '_print_model_summary(', label: '_print_model_summary(info)', kind: 'function', detail: 'Print formatted model summary' },
        { text: '_predict_and_show(', label: '_predict_and_show(data, verbose)', kind: 'function', detail: 'Predict + display + return result' },
        { text: '_format_result(', label: '_format_result(result)', kind: 'function', detail: 'Format prediction as string' },
        { text: '_print_all_classes(', label: '_print_all_classes(result)', kind: 'function', detail: 'Print sorted class bar chart' },
        { text: '_get_label(', label: '_get_label(idx, labels, is_classif)', kind: 'function', detail: 'Get label for class index' },
        { text: '_sample_shape(', label: '_sample_shape(input_shape)', kind: 'function', detail: 'Get sample input shape (no batch)' },
        { text: '_draw_bar_chart(', label: '_draw_bar_chart(values, labels, title)', kind: 'function', detail: 'Draw bar chart on canvas' },
        { text: '_smooth_predictions(', label: '_smooth_predictions(buffer)', kind: 'function', detail: 'Average prediction buffer' },
        { text: '_top_prediction(', label: '_top_prediction(result)', kind: 'function', detail: 'Get (idx, conf) of top class' },
        { text: '_get_tensor_shape(', label: '_get_tensor_shape(w)', kind: 'function', detail: 'Get shape of nested list tensor' },
    ];

    var ENV_VARIABLES = [
        { text: 'input_data', label: 'input_data', kind: 'variable', detail: 'Current input (webcam/image)' },
        { text: '_labels', label: '_labels', kind: 'variable', detail: 'List of class labels' },
        { text: '_is_classification', label: '_is_classification', kind: 'variable', detail: 'Boolean: classification model' },
        { text: 'photos', label: 'photos', kind: 'variable', detail: 'List of captured photos' },
        { text: 'num_photos', label: 'num_photos', kind: 'variable', detail: 'Number of captured photos' },
    ];

    var PYTHON_BUILTINS = [
        { text: 'print(', label: 'print()', kind: 'builtin', detail: 'Print to output' },
        { text: 'len(', label: 'len(obj)', kind: 'builtin', detail: 'Return length' },
        { text: 'range(', label: 'range(stop)', kind: 'builtin', detail: 'Generate sequence' },
        { text: 'enumerate(', label: 'enumerate(iterable)', kind: 'builtin', detail: 'Iterate with index' },
        { text: 'isinstance(', label: 'isinstance(obj, type)', kind: 'builtin', detail: 'Check type' },
        { text: 'sorted(', label: 'sorted(iterable)', kind: 'builtin', detail: 'Return sorted list' },
        { text: 'zip(', label: 'zip(a, b)', kind: 'builtin', detail: 'Iterate together' },
        { text: 'max(', label: 'max(iterable)', kind: 'builtin', detail: 'Maximum value' },
        { text: 'min(', label: 'min(iterable)', kind: 'builtin', detail: 'Minimum value' },
        { text: 'sum(', label: 'sum(iterable)', kind: 'builtin', detail: 'Sum values' },
        { text: 'abs(', label: 'abs(x)', kind: 'builtin', detail: 'Absolute value' },
        { text: 'round(', label: 'round(x, n)', kind: 'builtin', detail: 'Round number' },
        { text: 'int(', label: 'int(x)', kind: 'builtin', detail: 'Convert to int' },
        { text: 'float(', label: 'float(x)', kind: 'builtin', detail: 'Convert to float' },
        { text: 'str(', label: 'str(x)', kind: 'builtin', detail: 'Convert to string' },
        { text: 'list(', label: 'list(x)', kind: 'builtin', detail: 'Convert to list' },
        { text: 'dict(', label: 'dict()', kind: 'builtin', detail: 'Create dictionary' },
        { text: 'tuple(', label: 'tuple(x)', kind: 'builtin', detail: 'Convert to tuple' },
        { text: 'type(', label: 'type(obj)', kind: 'builtin', detail: 'Get type' },
        { text: 'hasattr(', label: 'hasattr(obj, name)', kind: 'builtin', detail: 'Check attribute' },
        { text: 'getattr(', label: 'getattr(obj, name)', kind: 'builtin', detail: 'Get attribute' },
    ];

    var PYTHON_KEYWORDS_AC = [
        { text: 'def ', label: 'def', kind: 'keyword', detail: 'Define function' },
        { text: 'class ', label: 'class', kind: 'keyword', detail: 'Define class' },
        { text: 'if ', label: 'if', kind: 'keyword', detail: 'Conditional' },
        { text: 'elif ', label: 'elif', kind: 'keyword', detail: 'Else-if' },
        { text: 'else:', label: 'else:', kind: 'keyword', detail: 'Else branch' },
        { text: 'for ', label: 'for', kind: 'keyword', detail: 'For loop' },
        { text: 'while ', label: 'while', kind: 'keyword', detail: 'While loop' },
        { text: 'return ', label: 'return', kind: 'keyword', detail: 'Return value' },
        { text: 'import ', label: 'import', kind: 'keyword', detail: 'Import module' },
        { text: 'from ', label: 'from', kind: 'keyword', detail: 'Import from' },
        { text: 'try:', label: 'try:', kind: 'keyword', detail: 'Try block' },
        { text: 'except ', label: 'except', kind: 'keyword', detail: 'Exception handler' },
        { text: 'finally:', label: 'finally:', kind: 'keyword', detail: 'Finally block' },
        { text: 'with ', label: 'with', kind: 'keyword', detail: 'Context manager' },
        { text: 'lambda ', label: 'lambda', kind: 'keyword', detail: 'Anonymous function' },
        { text: 'raise ', label: 'raise', kind: 'keyword', detail: 'Raise exception' },
        { text: 'yield ', label: 'yield', kind: 'keyword', detail: 'Generator yield' },
        { text: 'pass', label: 'pass', kind: 'keyword', detail: 'No-op' },
        { text: 'break', label: 'break', kind: 'keyword', detail: 'Break loop' },
        { text: 'continue', label: 'continue', kind: 'keyword', detail: 'Next iteration' },
        { text: 'True', label: 'True', kind: 'constant', detail: 'Boolean true' },
        { text: 'False', label: 'False', kind: 'constant', detail: 'Boolean false' },
        { text: 'None', label: 'None', kind: 'constant', detail: 'Null value' },
    ];

    var COMMON_SNIPPETS = [
        { text: 'for i in range(', label: 'for i in range(...)', kind: 'snippet', detail: 'For loop with range' },
        { text: 'for i, item in enumerate(', label: 'for i, item in enumerate(...)', kind: 'snippet', detail: 'Enumerate loop' },
        { text: 'if __name__ == "__main__":', label: 'if __name__ == "__main__":', kind: 'snippet', detail: 'Main guard' },
    ];

    var DOT_COMPLETIONS = {
        'list': [
            { text: 'append(', label: '.append(item)', kind: 'method', detail: 'Add item to end' },
            { text: 'extend(', label: '.extend(iterable)', kind: 'method', detail: 'Extend list' },
            { text: 'insert(', label: '.insert(i, item)', kind: 'method', detail: 'Insert at index' },
            { text: 'remove(', label: '.remove(item)', kind: 'method', detail: 'Remove first occurrence' },
            { text: 'pop(', label: '.pop(i)', kind: 'method', detail: 'Remove and return' },
            { text: 'index(', label: '.index(item)', kind: 'method', detail: 'Find index' },
            { text: 'count(', label: '.count(item)', kind: 'method', detail: 'Count occurrences' },
            { text: 'sort(', label: '.sort()', kind: 'method', detail: 'Sort in place' },
            { text: 'reverse()', label: '.reverse()', kind: 'method', detail: 'Reverse in place' },
            { text: 'copy()', label: '.copy()', kind: 'method', detail: 'Shallow copy' },
        ],
        'str': [
            { text: 'format(', label: '.format(...)', kind: 'method', detail: 'Format string' },
            { text: 'split(', label: '.split(sep)', kind: 'method', detail: 'Split into list' },
            { text: 'join(', label: '.join(iterable)', kind: 'method', detail: 'Join with string' },
            { text: 'strip()', label: '.strip()', kind: 'method', detail: 'Remove whitespace' },
            { text: 'replace(', label: '.replace(old, new)', kind: 'method', detail: 'Replace substring' },
            { text: 'startswith(', label: '.startswith(prefix)', kind: 'method', detail: 'Check prefix' },
            { text: 'endswith(', label: '.endswith(suffix)', kind: 'method', detail: 'Check suffix' },
            { text: 'lower()', label: '.lower()', kind: 'method', detail: 'Lowercase' },
            { text: 'upper()', label: '.upper()', kind: 'method', detail: 'Uppercase' },
            { text: 'find(', label: '.find(sub)', kind: 'method', detail: 'Find substring' },
        ],
        'dict': [
            { text: 'keys()', label: '.keys()', kind: 'method', detail: 'Get all keys' },
            { text: 'values()', label: '.values()', kind: 'method', detail: 'Get all values' },
            { text: 'items()', label: '.items()', kind: 'method', detail: 'Get key-value pairs' },
            { text: 'get(', label: '.get(key, default)', kind: 'method', detail: 'Get with default' },
            { text: 'update(', label: '.update(other)', kind: 'method', detail: 'Merge dicts' },
            { text: 'pop(', label: '.pop(key)', kind: 'method', detail: 'Remove and return' },
        ],
        'ctx': [
            { text: 'fillRect(', label: '.fillRect(x, y, w, h)', kind: 'method', detail: 'Fill rectangle' },
            { text: 'strokeRect(', label: '.strokeRect(x, y, w, h)', kind: 'method', detail: 'Stroke rectangle' },
            { text: 'clearRect(', label: '.clearRect(x, y, w, h)', kind: 'method', detail: 'Clear rectangle' },
            { text: 'beginPath()', label: '.beginPath()', kind: 'method', detail: 'Start path' },
            { text: 'moveTo(', label: '.moveTo(x, y)', kind: 'method', detail: 'Move to point' },
            { text: 'lineTo(', label: '.lineTo(x, y)', kind: 'method', detail: 'Line to point' },
            { text: 'arc(', label: '.arc(x, y, r, start, end)', kind: 'method', detail: 'Draw arc' },
            { text: 'fill()', label: '.fill()', kind: 'method', detail: 'Fill path' },
            { text: 'stroke()', label: '.stroke()', kind: 'method', detail: 'Stroke path' },
            { text: 'fillText(', label: '.fillText(text, x, y)', kind: 'method', detail: 'Draw text' },
        ],
        'info': [
            { text: "['input_shape']", label: "['input_shape']", kind: 'property', detail: 'Model input shape' },
            { text: "['output_shape']", label: "['output_shape']", kind: 'property', detail: 'Model output shape' },
            { text: "['num_layers']", label: "['num_layers']", kind: 'property', detail: 'Number of layers' },
            { text: "['layer_names']", label: "['layer_names']", kind: 'property', detail: 'Layer names list' },
            { text: "['layer_types']", label: "['layer_types']", kind: 'property', detail: 'Layer types list' },
            { text: "['trainable_params']", label: "['trainable_params']", kind: 'property', detail: 'Trainable params' },
        ],
    };

    var IMPORTABLE_MODULES = [
        { text: 'json', label: 'json', kind: 'module', detail: 'JSON encoding/decoding' },
        { text: 'math', label: 'math', kind: 'module', detail: 'Math functions' },
        { text: 'random', label: 'random', kind: 'module', detail: 'Random numbers' },
        { text: 'itertools', label: 'itertools', kind: 'module', detail: 'Iterator tools' },
        { text: 'functools', label: 'functools', kind: 'module', detail: 'Higher-order functions' },
        { text: 'collections', label: 'collections', kind: 'module', detail: 'Containers' },
        { text: 're', label: 're', kind: 'module', detail: 'Regular expressions' },
        { text: 'time', label: 'time', kind: 'module', detail: 'Time functions' },
        { text: 'datetime', label: 'datetime', kind: 'module', detail: 'Date/time types' },
        { text: 'statistics', label: 'statistics', kind: 'module', detail: 'Statistics' },
    ];

    // =========================================================================
    // EXTRACT USER-DEFINED SYMBOLS
    // =========================================================================

    function extractUserSymbols(code) {
        var symbols = [];
        var lines = code.split('\n');
        var seenNames = new Set();

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            var funcMatch = line.match(/^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
            if (funcMatch && !seenNames.has(funcMatch[1])) {
                seenNames.add(funcMatch[1]);
                var paramsMatch = line.match(/def\s+\w+\s*\(([^)]*)\)/);
                var params = paramsMatch ? paramsMatch[1] : '...';
                symbols.push({
                    text: funcMatch[1] + '(',
                    label: funcMatch[1] + '(' + params + ')',
                    kind: 'user-function',
                    detail: 'Line ' + (i + 1)
                });
            }

            var classMatch = line.match(/^\s*class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (classMatch && !seenNames.has(classMatch[1])) {
                seenNames.add(classMatch[1]);
                symbols.push({ text: classMatch[1], label: classMatch[1], kind: 'user-class', detail: 'Line ' + (i + 1) });
            }

            var varMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            if (varMatch && !seenNames.has(varMatch[2])) {
                var varName = varMatch[2];
                if (varName.length > 1 && !PY_KEYWORDS.has(varName) && varName !== 'self') {
                    seenNames.add(varName);
                    symbols.push({ text: varName, label: varName, kind: 'user-variable', detail: 'Line ' + (i + 1) });
                }
            }

            var forMatch = line.match(/^\s*for\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (forMatch && !seenNames.has(forMatch[1]) && forMatch[1].length > 1) {
                seenNames.add(forMatch[1]);
                symbols.push({ text: forMatch[1], label: forMatch[1], kind: 'user-variable', detail: 'Loop var line ' + (i + 1) });
            }

            var importMatch = line.match(/^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (importMatch && !seenNames.has(importMatch[1])) {
                seenNames.add(importMatch[1]);
                symbols.push({ text: importMatch[1], label: importMatch[1], kind: 'module', detail: 'Imported' });
            }

            var fromImportMatch = line.match(/^\s*from\s+\S+\s+import\s+(.+)/);
            if (fromImportMatch) {
                fromImportMatch[1].split(',').forEach(function(imp) {
                    var name = imp.trim().split(/\s+as\s+/).pop().trim();
                    if (name && !seenNames.has(name) && /^[a-zA-Z_]/.test(name)) {
                        seenNames.add(name);
                        symbols.push({ text: name, label: name, kind: 'import', detail: 'Imported' });
                    }
                });
            }
        }
        return symbols;
    }

    function inferVariableType(code, varName) {
        var lines = code.split('\n');
        for (var i = lines.length - 1; i >= 0; i--) {
            var line = lines[i];
            var re = new RegExp('^\\s*' + varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=\\s*(.+)');
            var m = line.match(re);
            if (m) {
                var rhs = m[1].trim();
                if (rhs.startsWith('[') || rhs.includes('.split(') || rhs.startsWith('list(')) return 'list';
                if (rhs.startsWith('{') && rhs.includes(':')) return 'dict';
                if (rhs.startsWith('"') || rhs.startsWith("'") || rhs.startsWith('f"') || rhs.startsWith("f'")) return 'str';
                if (rhs === 'get_model_info()') return 'info';
                if (rhs.includes('getContext(') || rhs.includes('get_context(')) return 'ctx';
            }
        }
        if (varName === 'ctx' || varName === 'context') return 'ctx';
        if (varName === 'info' || varName === 'model_info') return 'info';
        if (varName === 'result' || varName === 'results' || varName === 'predictions') return 'list';
        if (varName === 'state' || varName === 'config' || varName === 'options') return 'dict';
        return null;
    }

    // =========================================================================
    // CONTEXT DETECTION
    // =========================================================================

    function getCompletionContext(code, cursorPos) {
        var textBefore = code.substring(0, cursorPos);
        var currentLine = textBefore.substring(textBefore.lastIndexOf('\n') + 1);

        if (isInsideString(textBefore) || currentLine.trimStart().startsWith('#')) {
            return { type: 'none' };
        }

        if (/^\s*(import|from\s+\S+\s+import)\s+\w*$/.test(currentLine)) {
            var m = currentLine.match(/(\w*)$/);
            return { type: 'import', prefix: m[1], startPos: cursorPos - m[1].length };
        }
        if (/^\s*from\s+\w*$/.test(currentLine)) {
            var m2 = currentLine.match(/(\w*)$/);
            return { type: 'import', prefix: m2[1], startPos: cursorPos - m2[1].length };
        }

        var dotMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.\s*([a-zA-Z_]*)$/);
        if (dotMatch) {
            return { type: 'dot', objectName: dotMatch[1], prefix: dotMatch[2] || '', startPos: cursorPos - (dotMatch[2] || '').length };
        }

        var dictMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)\[\s*['"]([^'"]*)$/);
        if (dictMatch) {
            return { type: 'dict_key', objectName: dictMatch[1], prefix: dictMatch[2] || '', startPos: cursorPos - (dictMatch[2] || '').length };
        }

        var identMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
        if (identMatch && identMatch[1].length >= 2) {
            return { type: 'identifier', prefix: identMatch[1], startPos: cursorPos - identMatch[1].length };
        }

        return { type: 'none' };
    }

    function isInsideString(textBefore) {
        var inSingle = false, inDouble = false, inTripleSingle = false, inTripleDouble = false;
        var i = 0;
        while (i < textBefore.length) {
            if (i < textBefore.length - 2) {
                if (textBefore.substring(i, i + 3) === '"""') {
                    if (inTripleDouble) { inTripleDouble = false; i += 3; continue; }
                    else if (!inSingle && !inTripleSingle) { inTripleDouble = true; i += 3; continue; }
                }
                if (textBefore.substring(i, i + 3) === "'''") {
                    if (inTripleSingle) { inTripleSingle = false; i += 3; continue; }
                    else if (!inDouble && !inTripleDouble) { inTripleSingle = true; i += 3; continue; }
                }
            }
            if (textBefore[i] === '\\') { i += 2; continue; }
            if (textBefore[i] === '"' && !inSingle && !inTripleSingle && !inTripleDouble) inDouble = !inDouble;
            if (textBefore[i] === "'" && !inDouble && !inTripleDouble && !inTripleSingle) inSingle = !inSingle;
            i++;
        }
        return inSingle || inDouble || inTripleSingle || inTripleDouble;
    }

    // =========================================================================
    // GATHER SUGGESTIONS
    // =========================================================================

    function gatherSuggestions(context, fullCode) {
        var suggestions = [];

        switch (context.type) {
            case 'none': return [];
            case 'import':
                suggestions = IMPORTABLE_MODULES.slice();
                break;
            case 'dot':
                var varType = inferVariableType(fullCode, context.objectName);
                if (varType && DOT_COMPLETIONS[varType]) {
                    suggestions = DOT_COMPLETIONS[varType].slice();
                } else if (DOT_COMPLETIONS[context.objectName]) {
                    suggestions = DOT_COMPLETIONS[context.objectName].slice();
                } else {
                    suggestions = [].concat(DOT_COMPLETIONS['list'], DOT_COMPLETIONS['str'], DOT_COMPLETIONS['dict']);
                }
                break;
            case 'dict_key':
                var dt = inferVariableType(fullCode, context.objectName);
                if (dt === 'info' || context.objectName === 'info' || context.objectName === 'model_info') {
                    suggestions = DOT_COMPLETIONS['info'].map(function(item) {
                        var key = item.text.replace(/^\['/, '').replace(/'\]$/, '');
                        return { text: key + "']", label: key, kind: item.kind, detail: item.detail };
                    });
                }
                break;
            case 'identifier':
                suggestions = [].concat(
                    extractUserSymbols(fullCode),
                    ENV_FUNCTIONS, ENV_VARIABLES, COMMON_SNIPPETS,
                    PYTHON_BUILTINS, PYTHON_KEYWORDS_AC
                );
                break;
        }

        var prefix = context.prefix || '';
        if (prefix.length > 0) {
            var lp = prefix.toLowerCase();
            suggestions = suggestions.filter(function(item) {
                var t = (item.label || item.text).toLowerCase();
                return t.startsWith(lp) || fuzzyMatch(lp, t);
            });
        }

        suggestions = suggestions.filter(function(item) {
            return item.text !== prefix && (item.label || item.text) !== prefix;
        });

        var kindPriority = {
            'user-function': 0, 'user-variable': 1, 'user-class': 2,
            'function': 3, 'variable': 4, 'snippet': 5,
            'method': 6, 'property': 7, 'builtin': 8,
            'keyword': 9, 'constant': 10, 'module': 11, 'import': 12
        };
        var lp2 = (prefix || '').toLowerCase();
        suggestions.sort(function(a, b) {
            var aE = (a.label || a.text).toLowerCase().startsWith(lp2) ? 0 : 1;
            var bE = (b.label || b.text).toLowerCase().startsWith(lp2) ? 0 : 1;
            if (aE !== bE) return aE - bE;
            var aP = kindPriority[a.kind] !== undefined ? kindPriority[a.kind] : 99;
            var bP = kindPriority[b.kind] !== undefined ? kindPriority[b.kind] : 99;
            if (aP !== bP) return aP - bP;
            return (a.label || a.text).localeCompare(b.label || b.text);
        });

        return suggestions.slice(0, 12);
    }

    function fuzzyMatch(pattern, str) {
        var pi = 0;
        for (var si = 0; si < str.length && pi < pattern.length; si++) {
            if (str[si] === pattern[pi]) pi++;
        }
        return pi === pattern.length;
    }

    // =========================================================================
    // POPUP UI
    // =========================================================================

    function createPopup() {
        if (acPopup) return acPopup;
        acPopup = document.createElement('div');
        acPopup.className = 'pe-autocomplete-popup';
        acPopup.style.cssText = [
            'position:absolute', 'z-index:10000',
            'background:var(--pe-surface, #1e1e2e)',
            'border:1px solid var(--pe-border, #45475a)',
            'border-radius:6px', 'box-shadow:0 4px 16px rgba(0,0,0,0.4)',
            'max-height:240px', 'overflow-y:auto', 'overflow-x:hidden',
            'min-width:220px', 'max-width:380px',
            'font-family:monospace', 'font-size:12px',
            'display:none', 'padding:4px 0', 'scrollbar-width:thin',
        ].join(';');

        acPopup.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });

        var editorBody = document.querySelector('.pe-editor-body');
        if (editorBody) {
            editorBody.style.position = 'relative';
            editorBody.appendChild(acPopup);
        } else {
            document.body.appendChild(acPopup);
        }

        return acPopup;
    }

    function renderPopup() {
        var popup = createPopup();
        if (acItems.length === 0) {
            hidePopup();
            return;
        }

        var html = '';
        for (var i = 0; i < acItems.length; i++) {
            var item = acItems[i];
            var isSelected = i === acSelectedIndex;
            var kindIcon = getKindIcon(item.kind);
            var kindColor = getKindColor(item.kind);

            html += '<div class="pe-ac-item' + (isSelected ? ' pe-ac-selected' : '') + '" data-index="' + i + '" style="'
                + 'padding:4px 10px;cursor:pointer;display:flex;align-items:center;gap:8px;'
                + 'white-space:nowrap;'
                + (isSelected ? 'background:var(--pe-accent, #6c63ff);color:#fff;' : '')
                + '">';
            html += '<span style="font-size:11px;opacity:0.7;min-width:16px;text-align:center;color:' + (isSelected ? '#fff' : kindColor) + ';">' + kindIcon + '</span>';
            html += '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.label || item.text) + '</span>';
            if (item.detail) {
                html += '<span style="font-size:10px;color:' + (isSelected ? 'rgba(255,255,255,0.7)' : 'var(--pe-muted, #6c7086)') + ';margin-left:8px;opacity:0.7;max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.detail) + '</span>';
            }
            html += '</div>';
        }

        popup.innerHTML = html;
        popup.style.display = 'block';
        acVisible = true;

        var items = popup.querySelectorAll('.pe-ac-item');
        items.forEach(function(el) {
            el.addEventListener('click', function() {
                var idx = parseInt(el.getAttribute('data-index'));
                acceptSuggestion(idx);
            });
            el.addEventListener('mouseenter', function() {
                acSelectedIndex = parseInt(el.getAttribute('data-index'));
                renderPopup();
            });
        });

        if (acSelectedIndex >= 0) {
            var selectedEl = popup.querySelector('.pe-ac-selected');
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function positionPopup() {
        var popup = createPopup();
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (!textarea || !popup) return;

        var coords = getCursorCoordinates(textarea, textarea.selectionStart);
        var editorBody = textarea.closest('.pe-editor-body');
        if (editorBody) {
            var bodyRect = editorBody.getBoundingClientRect();
            var textareaRect = textarea.getBoundingClientRect();

            var left = coords.left + (textareaRect.left - bodyRect.left) - textarea.scrollLeft;
            var top = coords.top + (textareaRect.top - bodyRect.top) - textarea.scrollTop + coords.lineHeight;

            var maxLeft = bodyRect.width - 240;
            if (left > maxLeft) left = maxLeft;
            if (left < 0) left = 0;

            if (top + 240 > bodyRect.height) {
                top = coords.top + (textareaRect.top - bodyRect.top) - textarea.scrollTop - 240;
            }

            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
        }
    }

    function hidePopup() {
        if (acPopup) {
            acPopup.style.display = 'none';
        }
        acVisible = false;
        acSelectedIndex = -1;
        acItems = [];
    }

    function getCursorCoordinates(textarea, position) {
        var mirror = document.createElement('div');
        var computed = window.getComputedStyle(textarea);

        mirror.style.cssText = [
            'position:absolute', 'visibility:hidden',
            'white-space:pre-wrap', 'word-wrap:break-word', 'overflow:hidden',
            'width:' + textarea.clientWidth + 'px',
            'font:' + computed.font,
            'padding:' + computed.padding,
            'line-height:' + computed.lineHeight,
            'letter-spacing:' + computed.letterSpacing,
        ].join(';');

        document.body.appendChild(mirror);

        var text = textarea.value.substring(0, position);
        mirror.textContent = text;

        var span = document.createElement('span');
        span.textContent = textarea.value.substring(position) || '.';
        mirror.appendChild(span);

        var lineHeight = parseInt(computed.lineHeight) || parseInt(computed.fontSize) * 1.2;
        var coords = {
            left: span.offsetLeft,
            top: span.offsetTop,
            lineHeight: lineHeight
        };

        document.body.removeChild(mirror);
        return coords;
    }

    // =========================================================================
    // KIND ICONS & COLORS
    // =========================================================================

    function getKindIcon(kind) {
        switch (kind) {
            case 'function': case 'user-function': return 'ƒ';
            case 'method': return 'μ';
            case 'variable': case 'user-variable': return 'x';
            case 'user-class': return 'C';
            case 'keyword': return '⚷';
            case 'builtin': return '⊕';
            case 'snippet': return '✂';
            case 'module': case 'import': return '◫';
            case 'property': return '◆';
            case 'constant': return '∅';
            default: return '·';
        }
    }

    function getKindColor(kind) {
        switch (kind) {
            case 'function': case 'user-function': case 'method': return '#89b4fa';
            case 'variable': case 'user-variable': return '#a6e3a1';
            case 'user-class': return '#f9e2af';
            case 'keyword': return '#cba6f7';
            case 'builtin': return '#89dceb';
            case 'snippet': return '#f5c2e7';
            case 'module': case 'import': return '#fab387';
            case 'property': return '#94e2d5';
            case 'constant': return '#f38ba8';
            default: return '#cdd6f4';
        }
    }

    // =========================================================================
    // ACCEPT SUGGESTION — WITH EXECUTION PREVENTION
    // =========================================================================

    function acceptSuggestion(index) {
        if (index < 0 || index >= acItems.length) return;

        var item = acItems[index];
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (!textarea) return;

        var value = textarea.value;
        var cursorPos = textarea.selectionStart;
        var insertText = item.text;

        var replaceStart = acStartPos;
        var replaceEnd = cursorPos;

        // GUARDS
        if (replaceStart < 0) replaceStart = 0;
        if (replaceStart > cursorPos) replaceStart = cursorPos;
        if (replaceStart > value.length) replaceStart = value.length;
        if (replaceEnd > value.length) replaceEnd = value.length;

        var currentPrefix = value.substring(replaceStart, replaceEnd);

        // Sanity check
        if (currentPrefix.length > 0 && !insertText.toLowerCase().startsWith(currentPrefix.toLowerCase())) {
            var redetectStart = cursorPos;
            while (redetectStart > 0 && /[a-zA-Z0-9_]/.test(value[redetectStart - 1])) {
                redetectStart--;
            }
            var redetectedPrefix = value.substring(redetectStart, cursorPos);
            if (insertText.toLowerCase().startsWith(redetectedPrefix.toLowerCase()) || redetectedPrefix.length === 0) {
                replaceStart = redetectStart;
                replaceEnd = cursorPos;
            }
        }

        // *** SET GLOBAL FLAGS TO PREVENT AUTO-EXECUTION ***
        acAccepting = true;
        window._acInserting = true;

        hidePopup();

        var success = false;

        // STRATEGY 1: execCommand (best — native undo support, fires input event)
        try {
            textarea.focus();
            textarea.setSelectionRange(replaceStart, replaceEnd);
            success = document.execCommand('insertText', false, insertText);
            if (success) {
                var check = textarea.value.substring(replaceStart, replaceStart + insertText.length);
                if (check !== insertText) success = false;
            }
        } catch (e) {
            success = false;
        }

        // STRATEGY 2: setRangeText
        if (!success) {
            try {
                textarea.setRangeText(insertText, replaceStart, replaceEnd, 'end');
                success = true;
            } catch (e) {
                success = false;
            }
        }

        // STRATEGY 3: Direct value set (last resort)
        if (!success) {
            var newValue = value.substring(0, replaceStart) + insertText + value.substring(replaceEnd);
            textarea.value = newValue;
            textarea.selectionStart = textarea.selectionEnd = replaceStart + insertText.length;
            success = true;
        }

        // Final verification
        if (success) {
            var finalCheck = textarea.value.substring(replaceStart, replaceStart + insertText.length);
            if (finalCheck !== insertText) {
                var nuclear = value.substring(0, replaceStart) + insertText + value.substring(replaceEnd);
                textarea.value = nuclear;
                textarea.selectionStart = textarea.selectionEnd = replaceStart + insertText.length;
            }
        }

        textarea.focus();

        // CLEAR the immediate flag after a short delay
        // But set a SECONDARY "cooldown" flag that lasts longer than the
        // live-predict debounce (1500ms) to prevent stale timers from firing
        window._acRecentlyInserted = true;

        setTimeout(function() {
            acAccepting = false;
            window._acInserting = false;
        }, 100);

        // This secondary flag stays true for 2 seconds — longer than the
        // 1500ms live-predict debounce — so any timer that was started
        // BEFORE the autocomplete accept will see this flag and abort
        setTimeout(function() {
            window._acRecentlyInserted = false;
        }, 2000);
    }


    // =========================================================================
    // TRIGGER AUTOCOMPLETE
    // =========================================================================

    function triggerAutocomplete() {
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (!textarea) return;

        var code = textarea.value;
        var cursorPos = textarea.selectionStart;

        if (textarea.selectionStart !== textarea.selectionEnd) {
            hidePopup();
            return;
        }

        var context = getCompletionContext(code, cursorPos);

        if (context.type === 'none') {
            hidePopup();
            return;
        }

        if (context.type === 'identifier' && (context.prefix || '').length < 2) {
            hidePopup();
            return;
        }

        var suggestions = gatherSuggestions(context, code);

        if (suggestions.length === 0) {
            hidePopup();
            return;
        }

        acItems = suggestions;
        acSelectedIndex = -1;
        acPrefix = context.prefix || '';
        acDismissed = false;
        acStartPos = cursorPos - acPrefix.length;
        if (acStartPos < 0) acStartPos = 0;

        positionPopup();
        renderPopup();
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    function setupAutocompleteHandlers() {
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (!textarea) return;

        textarea.addEventListener('input', function() {
            if (acAccepting) return;
            if (window._acInserting) return;
            acDismissed = false;
            clearTimeout(acDebounceTimer);
            acDebounceTimer = setTimeout(function() {
                if (!acDismissed && !window._acInserting) {
                    triggerAutocomplete();
                }
            }, 150);
        });

        // CAPTURE PHASE keydown
        textarea.addEventListener('keydown', function(e) {
            if (!acVisible) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopImmediatePropagation();
                acSelectedIndex = (acSelectedIndex + 1) % acItems.length;
                renderPopup();
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopImmediatePropagation();
                acSelectedIndex = (acSelectedIndex - 1 + acItems.length) % acItems.length;
                renderPopup();
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                e.stopImmediatePropagation();
                var idx = acSelectedIndex >= 0 ? acSelectedIndex : 0;
                acceptSuggestion(idx);
                return;
            }

            if (e.key === 'Enter') {
                if (acSelectedIndex >= 0) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    acceptSuggestion(acSelectedIndex);
                    return;
                }
                hidePopup();
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                hidePopup();
                acDismissed = true;
                return;
            }

            if (e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
                hidePopup();
            }
        }, true);

        textarea.addEventListener('keydown', function(e) {
            if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                acDismissed = false;
                triggerAutocomplete();
            }
        }, true);

        textarea.addEventListener('blur', function() {
            setTimeout(function() {
                if (!acPopup || !acPopup.matches(':hover')) {
                    hidePopup();
                }
            }, 200);
        });

        textarea.addEventListener('scroll', function() {
            if (acVisible) hidePopup();
        });
    }

    // =========================================================================
    // INIT
    // =========================================================================

    function initAutocomplete() {
        setupAutocompleteHandlers();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initAutocomplete, 100);
        });
    } else {
        setTimeout(initAutocomplete, 100);
    }

})(); // end setupAutocomplete
