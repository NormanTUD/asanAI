// BERT's tokenizer, as Hugging Face's `tokenizers` runs it for Model2Vec models (BertNormalizer with lowercasing,
// BertPreTokenizer, WordPiece with "##" continuations). Checked token for token against it in the tests.
const isPunct = (c) => {
    const cp = c.codePointAt(0);
    return (cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) || (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126)
        || /\p{P}/u.test(c);
};
const isCjk = (cp) => (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf)
    || (cp >= 0x20000 && cp <= 0x2a6df) || (cp >= 0x2a700 && cp <= 0x2b73f) || (cp >= 0x2b740 && cp <= 0x2b81f)
    || (cp >= 0x2b820 && cp <= 0x2ceaf) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x2f800 && cp <= 0x2fa1f);
/** Drops control characters, spaces out CJK characters, strips accents and lower-cases. */
export function normalize(text) {
    let out = '';
    for (const c of text) {
        const cp = c.codePointAt(0);
        if (cp === 0 || cp === 0xfffd || (/\p{C}/u.test(c) && !/[\t\n\r]/.test(c)))
            continue;
        if (/\s/u.test(c))
            out += ' ';
        else if (isCjk(cp))
            out += ` ${c} `;
        else
            out += c;
    }
    return out.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
}
/** Splits normalised text into words and single punctuation characters. */
export function preTokenize(text) {
    const words = [];
    for (const chunk of text.split(' ')) {
        let word = '';
        for (const c of chunk) {
            if (isPunct(c)) {
                if (word)
                    words.push(word);
                words.push(c);
                word = '';
            }
            else
                word += c;
        }
        if (word)
            words.push(word);
    }
    return words;
}
/** Token ids for text: each word as the longest known pieces, left to right, or `unk` if it can't be spelt. */
export function wordPiece(vocab, unk, text) {
    const ids = [];
    for (const w of preTokenize(normalize(text))) {
        const chars = Array.from(w);
        if (chars.length > 100) {
            ids.push(unk);
            continue;
        }
        const pieces = [];
        for (let start = 0; start < chars.length;) {
            let end = chars.length;
            let id;
            for (; end > start; end--) {
                id = vocab.get((start ? '##' : '') + chars.slice(start, end).join(''));
                if (id !== undefined)
                    break;
            }
            if (end === start) {
                pieces.length = 0;
                pieces.push(unk);
                break;
            }
            pieces.push(id);
            start = end;
        }
        ids.push(...pieces);
    }
    return ids;
}
//# sourceMappingURL=tokenizer.js.map