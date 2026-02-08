class BPETokenizer {
    constructor(vocabSize = 256) {
        this.vocabSize = vocabSize;
        this.vocab = new Map();
        this.merges = new Map();
        // Initialize with basic byte values
        for (let i = 0; i < 256; i++) {
            this.vocab.set(i, String.fromCharCode(i));
        }
    }

    train(text, iterations) {
        let ids = Array.from(new TextEncoder().encode(text));
        for (let i = 0; i < iterations; i++) {
            const counts = this._getPairCounts(ids);
            if (counts.size === 0) break;
            
            // Find most frequent pair
            let bestPair = null;
            let maxCount = -1;
            for (let [pair, count] of counts) {
                if (count > maxCount) {
                    maxCount = count;
                    bestPair = pair;
                }
            }

            const newToken = 256 + i;
            this.merges.set(bestPair, newToken);
            ids = this._merge(ids, bestPair, newToken);
        }
        return ids;
    }

    _getPairCounts(ids) {
        const counts = new Map();
        for (let i = 0; i < ids.length - 1; i++) {
            const pair = `${ids[i]},${ids[i+1]}`;
            counts.set(pair, (counts.get(pair) || 0) + 1);
        }
        return counts;
    }

    _merge(ids, pairStr, newToken) {
        const pair = pairStr.split(',').map(Number);
        const newIds = [];
        let i = 0;
        while (i < ids.length) {
            if (i < ids.length - 1 && ids[i] === pair[0] && ids[i+1] === pair[1]) {
                newIds.push(newToken);
                i += 2;
            } else {
                newIds.push(ids[i]);
                i++;
            }
        }
        return newIds;
    }

    encode(text) {
        let ids = Array.from(new TextEncoder().encode(text));
        // Apply merges in order...
        return ids;
    }
}
