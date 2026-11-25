// The packed model file. Little-endian: magic "FAQM", version, vocabulary size, dimensions, bits (32, 8 or 4),
// group size and the vocabulary's byte length; then the tokens joined by "\n", padded to 4 bytes; then the
// vectors. At 32 bits they are plain f32. At 8 bits each value is an int8, and at 4 bits two values share a byte
// (low nibble first, each nibble − 8); either way every `group` values share one f16 scale, and all the scales
// come first, padded to 4 bytes.
const MAGIC = 0x4d514146;
const VERSION = 1;
export function fromF16(h) {
    const e = (h >> 10) & 31, m = h & 1023, s = h & 0x8000 ? -1 : 1;
    if (e === 0)
        return s * m * 2 ** -24;
    if (e === 31)
        return m ? NaN : s * Infinity;
    return s * (1 + m / 1024) * 2 ** (e - 15);
}
export function toF16(x) {
    const u = new Uint32Array(new Float32Array([x]).buffer)[0];
    const s = (u >> 16) & 0x8000, e = ((u >> 23) & 255) - 127 + 15;
    let m = u & 0x7fffff;
    if (e <= 0)
        return s | Math.round((m | 0x800000) / 2 ** (14 - e));
    if (e >= 31)
        return s | 0x7c00;
    m = Math.round(m / 8192);
    return m === 1024 ? s | ((e + 1) << 10) : s | (e << 10) | m;
}
const pad4 = (n) => (n + 3) & ~3;
export function decodeModel(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 28 || dv.getUint32(0, true) !== MAGIC)
        throw new Error('not a model2vec-js model file');
    const header = Array.from({ length: 7 }, (_, i) => dv.getUint32(i * 4, true));
    const [, version, n, dims, bits, group, vocabLen] = header;
    if (version !== VERSION)
        throw new Error(`unsupported model file version ${version}`);
    let off = 28;
    const tokens = new TextDecoder().decode(bytes.subarray(off, off + vocabLen)).split('\n');
    if (tokens.length !== n)
        throw new Error('model file is corrupt: vocabulary size');
    off += pad4(vocabLen);
    const count = n * dims;
    const vectors = new Float32Array(count);
    if (bits === 32) {
        vectors.set(new Float32Array(bytes.slice(off, off + count * 4).buffer));
    }
    else if (bits === 8 || bits === 4) {
        const groups = count / group;
        const scales = new Float32Array(groups);
        for (let g = 0; g < groups; g++)
            scales[g] = fromF16(dv.getUint16(off + g * 2, true));
        off += pad4(groups * 2);
        for (let i = 0; i < count; i++) {
            const q = bits === 8 ? (bytes[off + i] << 24) >> 24 : ((bytes[off + (i >> 1)] >> ((i & 1) * 4)) & 15) - 8;
            vectors[i] = q * scales[(i / group) | 0];
        }
    }
    else {
        throw new Error(`unsupported bits: ${bits}`);
    }
    return { tokens, dims, vectors };
}
export function encodeModel({ tokens, dims, vectors }, { bits = 4, group = 64 } = {}) {
    const n = tokens.length, count = n * dims;
    if (vectors.length !== count)
        throw new Error('vectors must hold tokens.length × dims values');
    if (tokens.some((t) => t.includes('\n')))
        throw new Error('tokens must not contain newlines');
    if (bits !== 32 && dims % group)
        throw new Error(`group (${group}) must divide dims (${dims})`);
    const vocab = new TextEncoder().encode(tokens.join('\n'));
    let body;
    if (bits === 32) {
        body = new Uint8Array(new Float32Array(vectors).buffer);
    }
    else {
        const levels = bits === 8 ? 127 : 7, groups = count / group;
        const scaleBytes = pad4(groups * 2);
        body = new Uint8Array(scaleBytes + (bits === 8 ? count : Math.ceil(count / 2)));
        const dv = new DataView(body.buffer);
        for (let g = 0; g < groups; g++) {
            let max = 0;
            for (let i = g * group; i < (g + 1) * group; i++)
                max = Math.max(max, Math.abs(vectors[i]));
            const h = toF16(max / levels), scale = fromF16(h) || 1;
            dv.setUint16(g * 2, h, true);
            for (let i = g * group; i < (g + 1) * group; i++) {
                const v = Math.max(-levels, Math.min(levels, Math.round(vectors[i] / scale)));
                if (bits === 8)
                    dv.setInt8(scaleBytes + i, v);
                else
                    body[scaleBytes + (i >> 1)] |= (v + 8) << ((i & 1) * 4);
            }
        }
    }
    const out = new Uint8Array(28 + pad4(vocab.length) + body.length);
    const dv = new DataView(out.buffer);
    [MAGIC, VERSION, n, dims, bits, group, vocab.length].forEach((v, i) => dv.setUint32(i * 4, v, true));
    out.set(vocab, 28);
    out.set(body, 28 + pad4(vocab.length));
    return out;
}
//# sourceMappingURL=format.js.map