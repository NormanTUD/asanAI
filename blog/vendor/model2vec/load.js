// Fetching files: URLs everywhere, and local paths in Node (the Node entry point registers a file reader, so the
// browser build never imports node:fs).
let readFile = null;
/** @internal Used by the Node entry point. */
export function setFileReader(reader) {
    readFile = reader;
}
/** The bundled model: potion-base-8M packed at 4 bits. */
export const DEFAULT_MODEL = new URL('../models/potion-base-8M.bin', import.meta.url);
/** The bundled word list for the spelling corrector (SCOWL size 60, front-coded). */
export const DEFAULT_WORDS = new URL('../models/words.txt', import.meta.url);
export async function loadBytes(src) {
    if (src instanceof ArrayBuffer)
        return new Uint8Array(src);
    if (ArrayBuffer.isView(src))
        return new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
    const url = src instanceof URL ? src : null;
    if (readFile && (url ? url.protocol === 'file:' : !/^[a-z][a-z0-9+.-]*:\/\//i.test(src))) {
        return readFile(url ?? src);
    }
    const res = await fetch(src);
    if (!res.ok)
        throw new Error(`${String(src)}: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
}
export async function loadText(src) {
    return new TextDecoder().decode(await loadBytes(src));
}
//# sourceMappingURL=load.js.map