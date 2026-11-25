import { decodeModel } from './format.js';
import { DEFAULT_MODEL, loadBytes } from './load.js';
import { wordPiece } from './tokenizer.js';
/**
 * A Model2Vec static embedding model: one vector per token, and a sentence's vector is the mean of its tokens'
 * vectors, normalised to length 1. No network runs, so embedding takes microseconds. Long texts are cut as the
 * Python library cuts them: to `maxTokens` × the median token length in characters, then to `maxTokens` tokens,
 * before unknown tokens are left out.
 */
export class StaticModel {
    tokens;
    dims;
    vectors;
    unk;
    /** Tokens read per text; Model2Vec's default is 512. */
    maxTokens = 512;
    vocab;
    medianTokenLength;
    constructor({ tokens, dims, vectors }) {
        this.tokens = tokens;
        this.dims = dims;
        this.vectors = vectors;
        this.vocab = new Map(tokens.map((t, i) => [t, i]));
        this.unk = this.vocab.get('[UNK]') ?? -1;
        const lengths = tokens.map((t) => Array.from(t).length).sort((a, b) => a - b), mid = lengths.length >> 1;
        this.medianTokenLength = Math.trunc(lengths.length % 2 ? lengths[mid] : (lengths[mid - 1] + lengths[mid]) / 2);
    }
    /** Loads a packed model file; by default the bundled potion-base-8M (4-bit, 4.2 MB). */
    static async load(src = DEFAULT_MODEL) {
        return StaticModel.fromBytes(await loadBytes(src));
    }
    static fromBytes(bytes) {
        return new StaticModel(decodeModel(bytes));
    }
    /** Token ids, as Hugging Face's tokenizer gives them without special tokens (unknown words included as UNK). */
    tokenize(text) {
        return wordPiece(this.vocab, this.unk, text);
    }
    /** Whether `token` (e.g. "voucher" or "##ing") is in the vocabulary. */
    has(token) {
        return this.vocab.has(token);
    }
    /** The text's vector: unit length, or all zeros if it has no known tokens. */
    embed(text) {
        const { dims, vectors } = this;
        const v = new Float32Array(dims);
        const chars = this.maxTokens * this.medianTokenLength;
        if (text.length > chars)
            text = Array.from(text).slice(0, chars).join('');
        for (const id of this.tokenize(text).slice(0, this.maxTokens)) {
            if (id === this.unk)
                continue;
            for (let d = 0, o = id * dims; d < dims; d++)
                v[d] += vectors[o + d];
        }
        let norm = 0;
        for (let d = 0; d < dims; d++)
            norm += v[d] * v[d];
        norm = Math.sqrt(norm) || 1;
        for (let d = 0; d < dims; d++)
            v[d] /= norm;
        return v;
    }
    embedMany(texts) {
        return texts.map((t) => this.embed(t));
    }
}
/** Dot product: the cosine similarity of two unit vectors, such as `embed` returns (1 = same meaning). */
export function similarity(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++)
        s += a[i] * b[i];
    return s;
}
//# sourceMappingURL=model.js.map