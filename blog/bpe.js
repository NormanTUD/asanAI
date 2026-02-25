class BPETokenizer {
    constructor() {
        this.vocab = {};    // Vocabulary to store tokens and their frequencies
        this.merges = [];   // List of merge rules (in order)
        this.mergeSet = new Set(); // For fast lookup
    }

    /**
     * Train the BPE tokenizer on a given text corpus.
     * @param {string} text - The input text corpus.
     * @param {number} vocabSize - The desired vocabulary size.
     */
    train(text, vocabSize) {
        // Step 1: Initialize the vocabulary with character-level tokens
        this.vocab = this._initializeVocab(text);

        // Step 2: Iteratively merge the most frequent pairs
        while (Object.keys(this.vocab).length < vocabSize) {
            const pairFrequencies = this._getPairFrequencies();
            const pairs = Object.entries(pairFrequencies);
            if (pairs.length === 0) break;

            // Find the most frequent pair using a simple loop (faster than reduce)
            let bestPair = pairs[0][0];
            let bestCount = pairs[0][1];
            for (let i = 1; i < pairs.length; i++) {
                if (pairs[i][1] > bestCount) {
                    bestPair = pairs[i][0];
                    bestCount = pairs[i][1];
                }
            }

            // Merge the most frequent pair
            this._mergePair(bestPair);
            this.merges.push(bestPair);
            this.mergeSet.add(bestPair);
        }
    }

    /**
     * Tokenize a given text using the trained BPE vocabulary.
     * Applies merges in the order they were learned (important for correctness).
     * @param {string} text - The input text to tokenize.
     * @returns {Array<string>} - The BPE tokens.
     */
    tokenize(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const tokens = [];

        words.forEach(word => {
            let chars = word.split('');

            // Apply merges in the order they were learned
            for (const merge of this.merges) {
                if (chars.length <= 1) break;

                const newChars = [];
                let i = 0;
                while (i < chars.length) {
                    if (i < chars.length - 1 && chars[i] + chars[i + 1] === merge) {
                        newChars.push(merge);
                        i += 2;
                    } else {
                        newChars.push(chars[i]);
                        i++;
                    }
                }
                chars = newChars;
            }

            tokens.push(...chars);
        });

        return tokens;
    }

    /**
     * Initialize the vocabulary with character-level tokens.
     * @param {string} text - The input text corpus.
     * @returns {Object} - The initial vocabulary with token frequencies.
     */
    _initializeVocab(text) {
        const vocab = {};
        const words = text.split(/\s+/).filter(w => w.length > 0);

        words.forEach(word => {
            const tokenizedWord = word.split('').join(' ');
            vocab[tokenizedWord] = (vocab[tokenizedWord] || 0) + 1;
        });

        return vocab;
    }

    /**
     * Get the frequencies of all adjacent token pairs in the vocabulary.
     * @returns {Object} - A map of token pairs to their frequencies.
     */
    _getPairFrequencies() {
        const pairFrequencies = {};

        const entries = Object.entries(this.vocab);
        for (let e = 0; e < entries.length; e++) {
            const [word, freq] = entries[e];
            const tokens = word.split(' ');
            for (let i = 0; i < tokens.length - 1; i++) {
                const pair = tokens[i] + tokens[i + 1];
                pairFrequencies[pair] = (pairFrequencies[pair] || 0) + freq;
            }
        }

        return pairFrequencies;
    }

    /**
     * Merge a token pair in the vocabulary.
     * Uses token-aware merging instead of regex (correct for multi-char tokens).
     * @param {string} pair - The merged token string (e.g., "ab").
     */
    _mergePair(pair) {
        const newVocab = {};

        // We need to find which two adjacent tokens combine to form `pair`.
        // We do this by checking each vocab entry's token list.
        const entries = Object.entries(this.vocab);
        for (let e = 0; e < entries.length; e++) {
            const [word, freq] = entries[e];
            const tokens = word.split(' ');
            const newTokens = [];
            let i = 0;

            while (i < tokens.length) {
                if (i < tokens.length - 1 && tokens[i] + tokens[i + 1] === pair) {
                    newTokens.push(pair);
                    i += 2;
                } else {
                    newTokens.push(tokens[i]);
                    i++;
                }
            }

            const newWord = newTokens.join(' ');
            newVocab[newWord] = (newVocab[newWord] || 0) + freq;
        }

        this.vocab = newVocab;
    }
}
