class BPETokenizer {
    constructor() {
        this.vocab = {};
        this.merges = [];
    }

    /**
     * Train the BPE tokenizer on a given text corpus.
     * @param {string} text - The input text corpus.
     * @param {object} [options] - Optional settings.
     * @param {number} [options.minFrequency=2] - Minimum pair frequency to consider merging.
     * @param {number} [options.maxMerges] - Optional hard cap on number of merges.
     */
    train(text, options = {}) {
        const minFrequency = options.minFrequency ?? 2;
        const maxMerges = options.maxMerges ?? Infinity;

        this.vocab = this._initializeVocab(text);
        this.merges = [];

        let mergeCount = 0;
        while (mergeCount < maxMerges) {
            const pairFrequencies = this._getPairFrequencies();
            const pairs = Object.entries(pairFrequencies);
            if (pairs.length === 0) break;

            let bestPair = null;
            let bestCount = 0;
            for (let i = 0; i < pairs.length; i++) {
                if (pairs[i][1] > bestCount) {
                    bestPair = pairs[i][0];
                    bestCount = pairs[i][1];
                }
            }

            if (bestCount < minFrequency) break;

            this._mergePair(bestPair);
            this.merges.push(bestPair);
            mergeCount++;
        }

        // Build the final token vocabulary for recognizing known subwords
        this._buildTokenVocab();
    }

    /**
     * Build a set of all known tokens from the trained vocabulary.
     * Used during tokenization to handle unseen words gracefully.
     */
    _buildTokenVocab() {
        this.knownTokens = new Set();

        const entries = Object.entries(this.vocab);
        for (let e = 0; e < entries.length; e++) {
            const tokens = entries[e][0].split(' ');
            for (const token of tokens) {
                this.knownTokens.add(token);
            }
        }
    }

    /**
     * Tokenize a given text using the trained BPE vocabulary.
     * Produces ## prefixed continuation tokens for subword pieces.
     * Falls back to character-level with ## prefixes for unknown words.
     * @param {string} text - The input text to tokenize.
     * @returns {Array<string>} - The BPE tokens.
     */
    tokenize(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const tokens = [];

        words.forEach(word => {
            let chars = word.split('');

            // Apply merges in learned order
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

            // If the word was fully merged into one token, push it as-is
            if (chars.length === 1) {
                tokens.push(chars[0]);
                return;
            }

            // Otherwise, try greedy longest-match from the known token vocab
            // to avoid single-character splits for rare words
            const subwords = this._greedyTokenize(word);

            // Add ## prefix to continuation tokens (not the first piece)
            for (let i = 0; i < subwords.length; i++) {
                if (i === 0) {
                    tokens.push(subwords[i]);
                } else {
                    tokens.push('##' + subwords[i]);
                }
            }
        });

        return tokens;
    }

    /**
     * Greedy longest-match tokenization using the known token vocabulary.
     * This handles rare words better than pure BPE merge replay,
     * by matching the longest known subword at each step.
     * @param {string} word - The word to tokenize.
     * @returns {Array<string>} - Subword tokens.
     */
    _greedyTokenize(word) {
        const subwords = [];
        let start = 0;

        while (start < word.length) {
            let end = word.length;
            let found = false;

            // Try longest match first, shrink until we find a known token
            while (end > start) {
                const substr = word.slice(start, end);
                if (this.knownTokens.has(substr)) {
                    subwords.push(substr);
                    start = end;
                    found = true;
                    break;
                }
                end--;
            }

            // If no known token found, take a single character
            if (!found) {
                subwords.push(word[start]);
                start++;
            }
        }

        return subwords;
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
     * @param {string} pair - The merged token string.
     */
    _mergePair(pair) {
        const newVocab = {};

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
