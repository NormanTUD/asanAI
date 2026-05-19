// ===== AUTOCOMPLETE MODULE =====
// Standalone IIFE — does NOT depend on online_python.js internals

(function setupAutocomplete() {

    // =========================================================================
    // LOCAL UTILITY — escapeHtml (self-contained, no external dependency)
    // =========================================================================

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Local set of Python keywords (so we don't depend on the main IIFE's PY_KEYWORDS)
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

    let acPopup = null;
    let acItems = [];
    let acSelectedIndex = -1;   // *** FIX: Start at -1 (nothing pre-selected) ***
    let acVisible = false;
    let acPrefix = '';
    let acTriggerPos = 0;
    let acDismissed = false;
    let acDebounceTimer = null;

    // =========================================================================
    // CONTEXT-AWARE COMPLETION SOURCES
    // =========================================================================

    const ENV_FUNCTIONS = [
        { text: 'predict(', label: 'predict(data)', kind: 'function', detail: 'Run model prediction on input data' },
        { text: 'get_model_info()', label: 'get_model_info()', kind: 'function', detail: 'Get model architecture info (shape, layers, params)' },
        { text: 'get_weights()', label: 'get_weights()', kind: 'function', detail: 'Get model weight tensors as nested lists' },
        { text: 'set_prediction_result(', label: 'set_prediction_result(result)', kind: 'function', detail: 'Display prediction result in the UI bar' },
        { text: 'rand_nested(', label: 'rand_nested(shape)', kind: 'function', detail: 'Generate random nested list matching shape' },
        { text: 'create_canvas(', label: 'create_canvas(w, h)', kind: 'function', detail: 'Create a drawable HTML canvas element' },
        { text: 'display(', label: 'display(obj)', kind: 'function', detail: 'Show canvas/object in console output' },
        { text: 'display_html(', label: 'display_html(html)', kind: 'function', detail: 'Render raw HTML in console output' },
        { text: 'display_image(', label: 'display_image(src, w, h)', kind: 'function', detail: 'Show image from URL/data URL in console' },
        { text: 'check_interrupt()', label: 'check_interrupt()', kind: 'function', detail: 'Call in loops to allow stopping execution' },
    ];

    const ENV_VARIABLES = [
        { text: 'input_data', label: 'input_data', kind: 'variable', detail: 'Current input (webcam frame or uploaded image)' },
        { text: '_labels', label: '_labels', kind: 'variable', detail: 'List of class labels (if classification model)' },
        { text: '_is_classification', label: '_is_classification', kind: 'variable', detail: 'Boolean: whether model is classification' },
        { text: 'photos', label: 'photos', kind: 'variable', detail: 'List of captured multi-snap photos' },
        { text: 'num_photos', label: 'num_photos', kind: 'variable', detail: 'Number of captured photos' },
    ];

    const PYTHON_BUILTINS = [
        { text: 'print(', label: 'print()', kind: 'builtin', detail: 'Print to console output' },
        { text: 'len(', label: 'len(obj)', kind: 'builtin', detail: 'Return length of object' },
        { text: 'range(', label: 'range(stop)', kind: 'builtin', detail: 'Generate sequence of numbers' },
        { text: 'enumerate(', label: 'enumerate(iterable)', kind: 'builtin', detail: 'Iterate with index' },
        { text: 'isinstance(', label: 'isinstance(obj, type)', kind: 'builtin', detail: 'Check object type' },
        { text: 'sorted(', label: 'sorted(iterable)', kind: 'builtin', detail: 'Return sorted list' },
        { text: 'zip(', label: 'zip(a, b)', kind: 'builtin', detail: 'Iterate multiple sequences together' },
        { text: 'max(', label: 'max(iterable)', kind: 'builtin', detail: 'Return maximum value' },
        { text: 'min(', label: 'min(iterable)', kind: 'builtin', detail: 'Return minimum value' },
        { text: 'sum(', label: 'sum(iterable)', kind: 'builtin', detail: 'Sum all values' },
        { text: 'abs(', label: 'abs(x)', kind: 'builtin', detail: 'Absolute value' },
        { text: 'round(', label: 'round(x, ndigits)', kind: 'builtin', detail: 'Round to n decimal places' },
        { text: 'int(', label: 'int(x)', kind: 'builtin', detail: 'Convert to integer' },
        { text: 'float(', label: 'float(x)', kind: 'builtin', detail: 'Convert to float' },
        { text: 'str(', label: 'str(x)', kind: 'builtin', detail: 'Convert to string' },
        { text: 'list(', label: 'list(x)', kind: 'builtin', detail: 'Convert to list' },
        { text: 'dict(', label: 'dict()', kind: 'builtin', detail: 'Create dictionary' },
        { text: 'tuple(', label: 'tuple(x)', kind: 'builtin', detail: 'Convert to tuple' },
        { text: 'type(', label: 'type(obj)', kind: 'builtin', detail: 'Get type of object' },
        { text: 'hasattr(', label: 'hasattr(obj, name)', kind: 'builtin', detail: 'Check if object has attribute' },
        { text: 'getattr(', label: 'getattr(obj, name)', kind: 'builtin', detail: 'Get attribute from object' },
    ];

    const PYTHON_KEYWORDS_AC = [
        { text: 'def ', label: 'def', kind: 'keyword', detail: 'Define a function' },
        { text: 'class ', label: 'class', kind: 'keyword', detail: 'Define a class' },
        { text: 'if ', label: 'if', kind: 'keyword', detail: 'Conditional statement' },
        { text: 'elif ', label: 'elif', kind: 'keyword', detail: 'Else-if branch' },
        { text: 'else:', label: 'else:', kind: 'keyword', detail: 'Else branch' },
        { text: 'for ', label: 'for', kind: 'keyword', detail: 'For loop' },
        { text: 'while ', label: 'while', kind: 'keyword', detail: 'While loop' },
        { text: 'return ', label: 'return', kind: 'keyword', detail: 'Return from function' },
        { text: 'import ', label: 'import', kind: 'keyword', detail: 'Import module' },
        { text: 'from ', label: 'from', kind: 'keyword', detail: 'Import from module' },
        { text: 'try:', label: 'try:', kind: 'keyword', detail: 'Try block' },
        { text: 'except ', label: 'except', kind: 'keyword', detail: 'Exception handler' },
        { text: 'finally:', label: 'finally:', kind: 'keyword', detail: 'Finally block' },
        { text: 'with ', label: 'with', kind: 'keyword', detail: 'Context manager' },
        { text: 'lambda ', label: 'lambda', kind: 'keyword', detail: 'Anonymous function' },
        { text: 'raise ', label: 'raise', kind: 'keyword', detail: 'Raise exception' },
        { text: 'yield ', label: 'yield', kind: 'keyword', detail: 'Generator yield' },
        { text: 'pass', label: 'pass', kind: 'keyword', detail: 'No-op placeholder' },
        { text: 'break', label: 'break', kind: 'keyword', detail: 'Break out of loop' },
        { text: 'continue', label: 'continue', kind: 'keyword', detail: 'Skip to next iteration' },
        { text: 'True', label: 'True', kind: 'constant', detail: 'Boolean true' },
        { text: 'False', label: 'False', kind: 'constant', detail: 'Boolean false' },
        { text: 'None', label: 'None', kind: 'constant', detail: 'Null/None value' },
    ];

    const COMMON_SNIPPETS = [
        { text: 'for i in range(', label: 'for i in range(...)', kind: 'snippet', detail: 'For loop with range' },
        { text: 'for i, item in enumerate(', label: 'for i, item in enumerate(...)', kind: 'snippet', detail: 'Enumerate loop' },
        { text: 'if __name__ == "__main__":', label: 'if __name__ == "__main__":', kind: 'snippet', detail: 'Main guard' },
        { text: "f'{", label: "f-string f'{...}'", kind: 'snippet', detail: 'Formatted string literal' },
        { text: 'print(f"', label: 'print(f"...")', kind: 'snippet', detail: 'Print formatted string' },
    ];

    const DOT_COMPLETIONS = {
        'list': [
            { text: 'append(', label: '.append(item)', kind: 'method', detail: 'Add item to end' },
            { text: 'extend(', label: '.extend(iterable)', kind: 'method', detail: 'Extend list' },
            { text: 'insert(', label: '.insert(i, item)', kind: 'method', detail: 'Insert at index' },
            { text: 'remove(', label: '.remove(item)', kind: 'method', detail: 'Remove first occurrence' },
            { text: 'pop(', label: '.pop(i)', kind: 'method', detail: 'Remove and return item' },
            { text: 'index(', label: '.index(item)', kind: 'method', detail: 'Find index of item' },
            { text: 'count(', label: '.count(item)', kind: 'method', detail: 'Count occurrences' },
            { text: 'sort(', label: '.sort()', kind: 'method', detail: 'Sort in place' },
            { text: 'reverse()', label: '.reverse()', kind: 'method', detail: 'Reverse in place' },
            { text: 'copy()', label: '.copy()', kind: 'method', detail: 'Shallow copy' },
        ],
        'str': [
            { text: 'format(', label: '.format(...)', kind: 'method', detail: 'Format string' },
            { text: 'split(', label: '.split(sep)', kind: 'method', detail: 'Split into list' },
            { text: 'join(', label: '.join(iterable)', kind: 'method', detail: 'Join iterable with string' },
            { text: 'strip()', label: '.strip()', kind: 'method', detail: 'Remove whitespace' },
            { text: 'replace(', label: '.replace(old, new)', kind: 'method', detail: 'Replace substring' },
            { text: 'startswith(', label: '.startswith(prefix)', kind: 'method', detail: 'Check prefix' },
            { text: 'endswith(', label: '.endswith(suffix)', kind: 'method', detail: 'Check suffix' },
            { text: 'lower()', label: '.lower()', kind: 'method', detail: 'Lowercase' },
            { text: 'upper()', label: '.upper()', kind: 'method', detail: 'Uppercase' },
            { text: 'find(', label: '.find(sub)', kind: 'method', detail: 'Find substring index' },
        ],
        'dict': [
            { text: 'keys()', label: '.keys()', kind: 'method', detail: 'Get all keys' },
            { text: 'values()', label: '.values()', kind: 'method', detail: 'Get all values' },
            { text: 'items()', label: '.items()', kind: 'method', detail: 'Get key-value pairs' },
            { text: 'get(', label: '.get(key, default)', kind: 'method', detail: 'Get with default' },
            { text: 'update(', label: '.update(other)', kind: 'method', detail: 'Merge dictionaries' },
            { text: 'pop(', label: '.pop(key)', kind: 'method', detail: 'Remove and return value' },
            { text: 'setdefault(', label: '.setdefault(key, default)', kind: 'method', detail: 'Get or set default' },
        ],
        'ctx': [
            { text: 'fillRect(', label: '.fillRect(x, y, w, h)', kind: 'method', detail: 'Fill rectangle' },
            { text: 'strokeRect(', label: '.strokeRect(x, y, w, h)', kind: 'method', detail: 'Stroke rectangle' },
            { text: 'clearRect(', label: '.clearRect(x, y, w, h)', kind: 'method', detail: 'Clear rectangle' },
            { text: 'beginPath()', label: '.beginPath()', kind: 'method', detail: 'Start new path' },
            { text: 'closePath()', label: '.closePath()', kind: 'method', detail: 'Close current path' },
            { text: 'moveTo(', label: '.moveTo(x, y)', kind: 'method', detail: 'Move to point' },
            { text: 'lineTo(', label: '.lineTo(x, y)', kind: 'method', detail: 'Line to point' },
            { text: 'arc(', label: '.arc(x, y, r, start, end)', kind: 'method', detail: 'Draw arc/circle' },
            { text: 'fill()', label: '.fill()', kind: 'method', detail: 'Fill current path' },
            { text: 'stroke()', label: '.stroke()', kind: 'method', detail: 'Stroke current path' },
            { text: 'fillText(', label: '.fillText(text, x, y)', kind: 'method', detail: 'Draw filled text' },
            { text: 'strokeText(', label: '.strokeText(text, x, y)', kind: 'method', detail: 'Draw stroked text' },
            { text: 'drawImage(', label: '.drawImage(img, x, y)', kind: 'method', detail: 'Draw image' },
        ],
        'info': [
            { text: "['input_shape']", label: "['input_shape']", kind: 'property', detail: 'Model input shape e.g. [null, 40, 40, 3]' },
            { text: "['output_shape']", label: "['output_shape']", kind: 'property', detail: 'Model output shape' },
            { text: "['num_layers']", label: "['num_layers']", kind: 'property', detail: 'Number of layers' },
            { text: "['layer_names']", label: "['layer_names']", kind: 'property', detail: 'List of layer names' },
            { text: "['layer_types']", label: "['layer_types']", kind: 'property', detail: 'List of layer types' },
            { text: "['trainable_params']", label: "['trainable_params']", kind: 'property', detail: 'Trainable parameter count' },
            { text: "['non_trainable_params']", label: "['non_trainable_params']", kind: 'property', detail: 'Non-trainable parameter count' },
        ],
    };

    const IMPORTABLE_MODULES = [
        { text: 'json', label: 'json', kind: 'module', detail: 'JSON encoding/decoding' },
        { text: 'math', label: 'math', kind: 'module', detail: 'Mathematical functions' },
        { text: 'random', label: 'random', kind: 'module', detail: 'Random number generation' },
        { text: 'itertools', label: 'itertools', kind: 'module', detail: 'Iterator tools' },
        { text: 'functools', label: 'functools', kind: 'module', detail: 'Higher-order functions' },
        { text: 'collections', label: 'collections', kind: 'module', detail: 'Specialized containers' },
        { text: 're', label: 're', kind: 'module', detail: 'Regular expressions' },
        { text: 'time', label: 'time', kind: 'module', detail: 'Time functions' },
        { text: 'datetime', label: 'datetime', kind: 'module', detail: 'Date and time types' },
        { text: 'statistics', label: 'statistics', kind: 'module', detail: 'Statistical functions' },
    ];

    // =========================================================================
    // EXTRACT USER-DEFINED SYMBOLS FROM CODE
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
                    detail: 'Defined on line ' + (i + 1)
                });
            }

            var classMatch = line.match(/^\s*class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (classMatch && !seenNames.has(classMatch[1])) {
                seenNames.add(classMatch[1]);
                symbols.push({
                    text: classMatch[1],
                    label: classMatch[1],
                    kind: 'user-class',
                    detail: 'Class defined on line ' + (i + 1)
                });
            }

            var varMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            if (varMatch && !seenNames.has(varMatch[2])) {
                var varName = varMatch[2];
                if (varName.length > 1 && !PY_KEYWORDS.has(varName) && varName !== 'self') {
                    seenNames.add(varName);
                    symbols.push({
                        text: varName,
                        label: varName,
                        kind: 'user-variable',
                        detail: 'Variable (line ' + (i + 1) + ')'
                    });
                }
            }

            var forMatch = line.match(/^\s*for\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (forMatch && !seenNames.has(forMatch[1])) {
                var forVar = forMatch[1];
                if (forVar.length > 1) {
                    seenNames.add(forVar);
                    symbols.push({
                        text: forVar,
                        label: forVar,
                        kind: 'user-variable',
                        detail: 'Loop variable (line ' + (i + 1) + ')'
                    });
                }
            }

            var importMatch = line.match(/^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (importMatch && !seenNames.has(importMatch[1])) {
                seenNames.add(importMatch[1]);
                symbols.push({
                    text: importMatch[1],
                    label: importMatch[1],
                    kind: 'module',
                    detail: 'Imported module'
                });
            }

            var fromImportMatch = line.match(/^\s*from\s+\S+\s+import\s+(.+)/);
            if (fromImportMatch) {
                var imports = fromImportMatch[1].split(',');
                imports.forEach(function(imp) {
                    var name = imp.trim().split(/\s+as\s+/).pop().trim();
                    if (name && !seenNames.has(name) && /^[a-zA-Z_]/.test(name)) {
                        seenNames.add(name);
                        symbols.push({
                            text: name,
                            label: name,
                            kind: 'import',
                            detail: 'Imported symbol'
                        });
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
            var assignMatch = line.match(new RegExp('^\\s*' + varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=\\s*(.+)'));
            if (assignMatch) {
                var rhs = assignMatch[1].trim();
                if (rhs.startsWith('[') || rhs.includes('.split(') || rhs.startsWith('list(')) return 'list';
                if (rhs.startsWith('{') && rhs.includes(':')) return 'dict';
                if (rhs.startsWith('{')) return 'set';
                if (rhs.startsWith('"') || rhs.startsWith("'") || rhs.startsWith('f"') || rhs.startsWith("f'")) return 'str';
                if (rhs === 'get_model_info()') return 'info';
                if (rhs.includes('getContext(') || rhs.includes('get_context(')) return 'ctx';
                if (rhs.includes('create_canvas(')) return 'canvas';
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
            return { type: 'import', prefix: currentLine.match(/(\w*)$/)[1] };
        }
        if (/^\s*from\s+\w*$/.test(currentLine)) {
            return { type: 'import', prefix: currentLine.match(/(\w*)$/)[1] };
        }

        var dotMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.\s*([a-zA-Z_]*)$/);
        if (dotMatch) {
            return {
                type: 'dot',
                objectName: dotMatch[1],
                prefix: dotMatch[2] || '',
                fullMatch: dotMatch[0]
            };
        }

        var dictMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)\[\s*['"]([^'"]*)$/);
        if (dictMatch) {
            return {
                type: 'dict_key',
                objectName: dictMatch[1],
                prefix: dictMatch[2] || ''
            };
        }

        var identMatch = currentLine.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
        if (identMatch && identMatch[1].length >= 2) {
            return {
                type: 'identifier',
                prefix: identMatch[1]
            };
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
            if (textBefore[i] === '"' && !inSingle && !inTripleSingle && !inTripleDouble) { inDouble = !inDouble; }
            if (textBefore[i] === "'" && !inDouble && !inTripleDouble && !inTripleSingle) { inSingle = !inSingle; }
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
            case 'none':
                return [];

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
                    suggestions = [].concat(
                        DOT_COMPLETIONS['list'],
                        DOT_COMPLETIONS['str'],
                        DOT_COMPLETIONS['dict']
                    );
                }
                break;

            case 'dict_key':
                var dictType = inferVariableType(fullCode, context.objectName);
                if (dictType === 'info' || context.objectName === 'info' || context.objectName === 'model_info') {
                    suggestions = DOT_COMPLETIONS['info'].map(function(item) {
                        var key = item.text.replace(/^\['/, '').replace(/'\]$/, '');
                        return {
                            text: key + "']",
                            label: key,
                            kind: item.kind,
                            detail: item.detail
                        };
                    });
                }
                break;

            case 'identifier':
                var userSymbols = extractUserSymbols(fullCode);
                suggestions = [].concat(
                    userSymbols,
                    ENV_FUNCTIONS,
                    ENV_VARIABLES,
                    COMMON_SNIPPETS,
                    PYTHON_BUILTINS,
                    PYTHON_KEYWORDS_AC
                );
                break;
        }

        // Filter by prefix
        var prefix = context.prefix || '';
        if (prefix.length > 0) {
            var lowerPrefix = prefix.toLowerCase();
            suggestions = suggestions.filter(function(item) {
                var matchText = item.label || item.text;
                return matchText.toLowerCase().startsWith(lowerPrefix) ||
                       fuzzyMatch(lowerPrefix, matchText.toLowerCase());
            });
        }

        // Remove exact matches (don't suggest what's already fully typed)
        suggestions = suggestions.filter(function(item) {
            return item.text !== prefix && (item.label || item.text) !== prefix;
        });

        // Sort
        var kindPriority = {
            'user-function': 0, 'user-variable': 1, 'user-class': 2,
            'function': 3, 'variable': 4, 'snippet': 5,
            'method': 6, 'property': 7, 'builtin': 8,
            'keyword': 9, 'constant': 10, 'module': 11, 'import': 12
        };

        var lp = (prefix || '').toLowerCase();
        suggestions.sort(
            function(a, b) {
                var aExact = (a.label || a.text).toLowerCase().startsWith(lp) ? 0 : 1;
                var bExact = (b.label || b.text).toLowerCase().startsWith(lp) ? 0 : 1;
                if (aExact !== bExact) return aExact - bExact;

                var aPri = kindPriority[a.kind] !== undefined ? kindPriority[a.kind] : 99;
                var bPri = kindPriority[b.kind] !== undefined ? kindPriority[b.kind] : 99;
                if (aPri !== bPri) return aPri - bPri;

                return (a.label || a.text).localeCompare(b.label || b.text);
            }
        );

        // Remove exact matches (don't suggest what's already fully typed)
        suggestions = suggestions.filter(function(item) {
            return item.text !== prefix && (item.label || item.text) !== prefix;
        });

        // Limit to top 12 suggestions
        return suggestions.slice(0, 12);
    }

    /**
     * Simple fuzzy match: checks if all chars of pattern appear in str in order
     */
    function fuzzyMatch(pattern, str) {
        var pi = 0;
        for (var si = 0; si < str.length && pi < pattern.length; si++) {
            if (str[si] === pattern[pi]) pi++;
        }
        return pi === pattern.length;
    }

    // =========================================================================
    // LOCAL UTILITY — escapeHtml (self-contained, no external dependency)
    // =========================================================================

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Local PY_KEYWORDS set (so we don't depend on the main IIFE)
    var PY_KEYWORDS = new Set([
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
        'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
        'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
        'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
        'try', 'while', 'with', 'yield'
    ]);

    /**
     * Trigger highlight update in the main editor (if available)
     */
    function scheduleHighlight() {
        // Try to call the main editor's highlight function via a textarea input event
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (textarea) {
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // =========================================================================
    // POPUP UI
    // =========================================================================

    function createPopup() {
        if (acPopup) return acPopup;

        acPopup = document.createElement('div');
        acPopup.className = 'pe-autocomplete-popup';
        acPopup.style.cssText = [
            'position:absolute',
            'z-index:10000',
            'background:var(--pe-surface, #1e1e2e)',
            'border:1px solid var(--pe-border, #45475a)',
            'border-radius:6px',
            'box-shadow:0 4px 16px rgba(0,0,0,0.4)',
            'max-height:240px',
            'overflow-y:auto',
            'overflow-x:hidden',
            'min-width:220px',
            'max-width:380px',
            'font-family:monospace',
            'font-size:12px',
            'display:none',
            'padding:4px 0',
            'scrollbar-width:thin',
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
            if (item.detail && !isSelected) {
                html += '<span style="font-size:10px;color:var(--pe-muted, #6c7086);margin-left:8px;opacity:0.7;max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.detail) + '</span>';
            } else if (item.detail && isSelected) {
                html += '<span style="font-size:10px;color:rgba(255,255,255,0.7);margin-left:8px;max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.detail) + '</span>';
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
            'position:absolute',
            'visibility:hidden',
            'white-space:pre-wrap',
            'word-wrap:break-word',
            'overflow:hidden',
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
            case 'function': return 'ƒ';
            case 'user-function': return 'ƒ';
            case 'method': return 'μ';
            case 'variable': return 'x';
            case 'user-variable': return 'x';
            case 'user-class': return 'C';
            case 'keyword': return '⚷';
            case 'builtin': return '⊕';
            case 'snippet': return '✂';
            case 'module': return '◫';
            case 'import': return '↗';
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
    // ACCEPT / DISMISS SUGGESTION
    // =========================================================================

    function acceptSuggestion(index) {
        if (index < 0 || index >= acItems.length) return;

        var item = acItems[index];
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (!textarea) return;

        var value = textarea.value;
        var cursorPos = textarea.selectionStart;

        var context = getCompletionContext(value, cursorPos);
        var prefixLen = (context.prefix || '').length;

        var replaceStart = cursorPos - prefixLen;

        var insertText = item.text;
        var newValue = value.substring(0, replaceStart) + insertText + value.substring(cursorPos);

        textarea.value = newValue;
        textarea.selectionStart = textarea.selectionEnd = replaceStart + insertText.length;

        hidePopup();
        scheduleHighlight();
        textarea.focus();
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

        if (suggestions.length === 1 && suggestions[0].text === context.prefix) {
            hidePopup();
            return;
        }

        acItems = suggestions;
        // *** FIX #2: Start with NO item selected (-1) so Enter/Tab pass through ***
        acSelectedIndex = -1;
        acPrefix = context.prefix || '';
        acDismissed = false;

        positionPopup();
        renderPopup();
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    function setupAutocompleteHandlers() {
        var textarea = document.getElementById('pyodide_editor_textarea');
        if (!textarea) return;

        // Trigger on input with debounce
        textarea.addEventListener('input', function() {
            acDismissed = false;
            clearTimeout(acDebounceTimer);
            acDebounceTimer = setTimeout(function() {
                if (!acDismissed) {
                    triggerAutocomplete();
                }
            }, 150);
        });

        // Handle keyboard navigation in the popup
        textarea.addEventListener('keydown', function(e) {
            if (!acVisible) return;

            // Arrow Down
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                acSelectedIndex = (acSelectedIndex + 1) % acItems.length;
                renderPopup();
                return;
            }

            // Arrow Up
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                acSelectedIndex = (acSelectedIndex - 1 + acItems.length) % acItems.length;
                renderPopup();
                return;
            }

            // Tab — accept suggestion ONLY if an item is actively selected
            if (e.key === 'Tab') {
                if (acSelectedIndex >= 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    acceptSuggestion(acSelectedIndex);
                    return;
                }
                // If nothing selected, let Tab pass through normally (indent)
                hidePopup();
                return;
            }

            // Enter — accept ONLY if user has navigated to select an item
            if (e.key === 'Enter') {
                if (acSelectedIndex >= 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    acceptSuggestion(acSelectedIndex);
                    return;
                }
                // If nothing selected, let Enter pass through (newline)
                hidePopup();
                return;
            }

            // Escape — dismiss popup
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                hidePopup();
                acDismissed = true;
                return;
            }
        });

        // Hide on blur
        textarea.addEventListener('blur', function() {
            setTimeout(function() {
                if (!acPopup || !acPopup.matches(':hover')) {
                    hidePopup();
                }
            }, 200);
        });

        // Hide on scroll
        textarea.addEventListener('scroll', function() {
            if (acVisible) {
                hidePopup();
            }
        });

        // Ctrl+Space to force trigger
        textarea.addEventListener('keydown', function(e) {
            if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                acDismissed = false;
                triggerAutocomplete();
            }
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
