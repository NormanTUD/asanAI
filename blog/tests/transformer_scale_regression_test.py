#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Scale regression for the transformer lesson.

Checks the things that break when the demo is pushed past 3D:
  * the 32D preset still renders the embedding and trajectory via PCA;
  * the page does not leave the browser tab over budget in time or JS heap;
  * the copy/induction-style training example actually learns;
  * the corpus-trained BPE tokenizer produces tokens and a vocabulary;
  * no page/console error is swallowed.

Every failure prints the config and the measured loss/accuracy/time/heap so
the message says what broke and where. Run from the repository root:
    uv run blog/tests/transformer_scale_regression_test.py
"""

from __future__ import annotations

import json
import shutil
import socket
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
CASES: list[tuple[str, bool, str]] = []
COPY_TEXT = "a b c d a b c d a b c d x y z w x y z w"


def check(name: str, ok: bool, detail: str = "") -> None:
    CASES.append((name, bool(ok), detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + (f" — {detail}" if detail and not ok else ""))


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def ensure_chromium() -> None:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            browser.close()
            return
    except Exception:
        pass
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)


def serve(port: int) -> subprocess.Popen:
    php = shutil.which("php")
    if php is None:
        print("ERROR: php is not on PATH", file=sys.stderr)
        raise SystemExit(1)
    return subprocess.Popen([php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    ensure_chromium()
    port = free_port()
    server = serve(port)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--enable-precise-memory-info"])
            page = browser.new_page(viewport={"width": 1400, "height": 1000})
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
            page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
            page.goto(f"http://127.0.0.1:{port}/transformer.php", wait_until="load", timeout=120000)
            page.wait_for_function("() => !!document.getElementById('transformer-preset')", timeout=120000)
            page.wait_for_timeout(800)

            # 1. 32D configuration: PCA plots, no errors, bounded resources.
            page.evaluate("""() => {
                const s = document.getElementById('transformer-preset');
                s.value = 'wide32';
                s.dispatchEvent(new Event('change', {bubbles: true}));
            }""")
            page.wait_for_timeout(800)
            page.evaluate("() => document.getElementById('transformer-step-visuals').scrollIntoView()")
            page.wait_for_function("() => window.__tmStepDepsReady === true", timeout=60000)
            page.evaluate("() => document.getElementById('transformer-plotly-space').scrollIntoView()")
            page.wait_for_function("""() => {
                const e = document.getElementById('transformer-plotly-space');
                return !!(e && e.data && e.data.length && e.layout && e.layout.title);
            }""", timeout=60000)
            page.wait_for_timeout(1200)
            highdim = page.evaluate("""() => {
                const e = document.getElementById('transformer-plotly-space');
                const d = (e && e.data) || [];
                return {
                    types: [...new Set(d.map(t => t.type))],
                    title: e && e.layout && e.layout.title ? e.layout.title.text : '',
                    d: document.getElementById('transformer-dimension-model').value,
                    h: document.getElementById('transformer-heads').value,
                    n: document.getElementById('transformer-depth').value,
                    ffn: document.getElementById('transformer-ffn-size').value,
                    heap: performance.memory ? performance.memory.usedJSHeapSize : null,
                };
            }""")
            check("32D preset sets d_model/heads/layers/FFN",
                  highdim["d"] == "32" and highdim["h"] == "8"
                  and highdim["n"] == "4" and highdim["ffn"] == "128",
                  json.dumps(highdim))
            check("32D embedding uses PCA and scatter3d",
                  "scatter3d" in highdim["types"] and "PCA (d→3)" in highdim["title"],
                  json.dumps(highdim)[:300])
            check("32D render keeps JS heap under 350 MB",
                  highdim["heap"] is None or highdim["heap"] < 350 * 1024 * 1024,
                  json.dumps(highdim)[:300])

            # Trajectory is also projected through PCA at 32D.
            page.evaluate("() => document.getElementById('transformer-trajectory-full-path').scrollIntoView()")
            page.wait_for_timeout(1200)
            traj = page.evaluate("""() => {
                const e = document.getElementById('transformer-trajectory-full-path');
                const d = (e && e.data) || [];
                return {types: [...new Set(d.map(t => t.type))], title: e && e.layout && e.layout.title ? e.layout.title.text : ''};
            }""")
            check("32D trajectory uses PCA and cones",
                  "scatter3d" in traj["types"] and "cone" in traj["types"] and "PCA" in traj["title"],
                  json.dumps(traj)[:300])

            # 1c. The experimental 64D preset still renders through PCA.
            page.evaluate("""() => {
                const s = document.getElementById('transformer-preset');
                s.value = 'wide64';
                s.dispatchEvent(new Event('change', {bubbles: true}));
            }""")
            page.wait_for_timeout(900)
            page.evaluate("() => document.getElementById('transformer-plotly-space').scrollIntoView()")
            page.wait_for_timeout(1200)
            high64 = page.evaluate("""() => {
                const e = document.getElementById('transformer-plotly-space');
                const d = (e && e.data) || [];
                return {
                    d: document.getElementById('transformer-dimension-model').value,
                    types: [...new Set(d.map(t => t.type))],
                    title: e && e.layout && e.layout.title ? e.layout.title.text : '',
                    heap: performance.memory ? performance.memory.usedJSHeapSize : null,
                };
            }""")
            check("64D preset renders through PCA",
                  high64["d"] == "64" and "scatter3d" in high64["types"] and "PCA (d→3)" in high64["title"],
                  json.dumps(high64)[:300])
            check("64D render keeps JS heap under 350 MB",
                  high64["heap"] is None or high64["heap"] < 350 * 1024 * 1024,
                  json.dumps(high64)[:300])

            # 1b. A short 32D training run must stay finite.
            page.evaluate("""() => {
                const set = (id, v, max) => {
                    const e = document.getElementById(id);
                    if (!e) return;
                    if (max) e.max = String(max);
                    e.value = String(v);
                    e.dispatchEvent(new Event('input', {bubbles: true}));
                };
                set('transformer-tokenizer-type', 'regex');
                const ta = document.getElementById('transformer-training-data');
                ta.value = 'the king rules the land and the queen rules the sea';
                ta.dispatchEvent(new Event('input', {bubbles: true}));
                clearTimeout(trainingDebounceTimer);
                const tokens = getTrainingTokens();
                set('transformer-dimension-model', 32, 64);
                set('transformer-heads', 8, 16);
                set('transformer-depth', 4, 24);
                set('transformer-ffn-size', 128, 512);
                set('transformer-context-size', Math.max(2, tokens.length - 1), 512);
                window.currentWeights = null;
                window.persistentEmbeddingSpace = null;
                window.last_d_model = null;
                ensureWeightsAndEmbeddings(tokens, 4, 32);
            }""")
            stable32 = page.evaluate("""async () => {
                const tokens = getTrainingTokens();
                const cfg = getTransformerConfig();
                const wv = convert_weights_to_tensors(window.currentWeights);
                const av = collectTrainableVars(wv);
                const opt = createOptimizer('adam', 0.01);
                let loss = null;
                for (let e = 0; e < 10; e++) {
                    const cost = computeAndApplyGradients(tokens, wv, 32, 4, cfg.n_heads, av, opt, 1.0);
                    loss = (await cost.data())[0];
                    dispose(cost);
                    if (e % 5 === 0) await tf.nextFrame();
                }
                window.currentWeights = await convert_tensors_to_weights(wv);
                disposeWeightVars(wv);
                dispose(opt);
                return {loss, finite: Number.isFinite(loss)};
            }""")
            check("32D short training stays finite", stable32["finite"], json.dumps(stable32))

            # 2. Corpus-trained BPE tokenizer.
            page.evaluate("""() => {
                const t = document.getElementById('transformer-training-data');
                t.value = 'the king rules the sea';
                t.dispatchEvent(new Event('input', {bubbles: true}));
                const s = document.getElementById('transformer-tokenizer-type');
                s.value = 'bpe';
                s.dispatchEvent(new Event('change', {bubbles: true}));
            }""")
            page.wait_for_timeout(1000)
            bpe = page.evaluate("""() => {
                const tokens = transformer_tokenize_render('the king rules the sea', null, false);
                return {tokens: tokens, vocab: Object.keys(window.persistentEmbeddingSpace || {}).length};
            }""")
            check("BPE tokenizer produces tokens and a vocabulary",
                  len(bpe["tokens"]) > 0 and bpe["vocab"] >= 5, json.dumps(bpe)[:300])

            # 2b. Character tokenizer.
            page.evaluate("""() => {
                const s = document.getElementById('transformer-tokenizer-type');
                s.value = 'chars';
                s.dispatchEvent(new Event('change', {bubbles: true}));
            }""")
            page.wait_for_timeout(500)
            chars = page.evaluate("() => transformer_tokenize_render('a b a', null, false)")
            check("character tokenizer splits into characters",
                  chars == ["a", " ", "b", " ", "a"], json.dumps(chars))

            # 3. Copy/induction-style learning at 16D.
            page.evaluate("""() => {
                const s = document.getElementById('transformer-preset');
                s.value = 'copy16';
                s.dispatchEvent(new Event('change', {bubbles: true}));
            }""")
            page.wait_for_timeout(800)
            trained = page.evaluate("""async (text) => {
                const set = (id, v, max) => {
                    const e = document.getElementById(id);
                    if (!e) return;
                    if (max) e.max = String(max);
                    e.value = String(v);
                    e.dispatchEvent(new Event('input', {bubbles: true}));
                };
                set('transformer-tokenizer-type', 'regex');
                const ta = document.getElementById('transformer-training-data');
                ta.value = text;
                ta.dispatchEvent(new Event('input', {bubbles: true}));
                clearTimeout(trainingDebounceTimer);
                if (window.syncTransformerSettings) window.syncTransformerSettings('scale');
                clearTimeout(trainingDebounceTimer);
                const tokens = getTrainingTokens();
                set('transformer-context-size', Math.max(2, tokens.length - 1), 512);
                window.currentWeights = null;
                window.persistentEmbeddingSpace = null;
                window.last_d_model = null;
                let seed = 123456789;
                const origRandom = Math.random;
                Math.random = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
                ensureWeightsAndEmbeddings(tokens, 2, 16);
                Math.random = origRandom;
                const cfg = getTransformerConfig();
                const wv = convert_weights_to_tensors(window.currentWeights);
                const av = collectTrainableVars(wv);
                const opt = createOptimizer('adam', 0.05);
                const t0 = performance.now();
                let loss = null;
                for (let e = 0; e < 80; e++) {
                    const cost = computeAndApplyGradients(tokens, wv, 16, 2, cfg.n_heads, av, opt, 1.0);
                    loss = (await cost.data())[0];
                    dispose(cost);
                    if (e % 10 === 0) await tf.nextFrame();
                }
                const trainMs = performance.now() - t0;
                window.currentWeights = await convert_tensors_to_weights(wv);
                disposeWeightVars(wv);
                dispose(opt);
                const vocab = Object.keys(window.persistentEmbeddingSpace);
                const emb = vocab.map(w => window.persistentEmbeddingSpace[w]);
                let correct = 0, total = 0;
                const misses = [];
                for (let k = 1; k < tokens.length; k++) {
                    const h = runSimpleForwardPass(tokens.slice(0, k), window.currentWeights, 16, cfg.n_heads, 2, false);
                    const last = h[h.length - 1];
                    let bi = 0, bv = -Infinity;
                    for (let i = 0; i < emb.length; i++) {
                        let sc = 0;
                        for (let j = 0; j < last.length; j++) sc += last[j] * emb[i][j];
                        if (sc > bv) { bv = sc; bi = i; }
                    }
                    const hit = vocab[bi] === tokens[k];
                    if (hit) correct++; else misses.push({target: tokens[k], pred: vocab[bi]});
                    total++;
                }
                return {loss, trainMs, correct, total, misses, tokens: tokens.length};
            }""", COPY_TEXT)
            check("copy/induction-style sequence is learned",
                  trained["total"] > 0 and trained["correct"] == trained["total"],
                  json.dumps(trained)[:400])
            check("copy training stays under 120 seconds at 16D",
                  trained["trainMs"] < 120000, json.dumps(trained)[:300])

            # 4. Modern Transformer Lab: controls change real plots.
            modern_errors: list[str] = []
            page2 = browser.new_page(viewport={"width": 1200, "height": 900})
            page2.on("pageerror", lambda e: modern_errors.append("pageerror: " + str(e)))
            page2.on("console", lambda m: modern_errors.append("console: " + m.text) if m.type == "error" else None)
            page2.goto(f"http://127.0.0.1:{port}/transformer.php", wait_until="load", timeout=120000)
            page2.wait_for_function("() => !!document.querySelector('#modern-transformer-lab-optional .optional-header')", timeout=120000)
            page2.locator("#modern-transformer-lab-optional").scroll_into_view_if_needed()
            page2.wait_for_timeout(500)
            page2.locator("#modern-transformer-lab-optional .optional-header").click()
            page2.wait_for_function("() => !!document.getElementById('mtl-attention').data", timeout=60000)
            modern = page2.evaluate("""() => ({
                attention: !!document.getElementById('mtl-attention').data,
                logits: !!document.getElementById('mtl-logits').data,
                rope: !!document.getElementById('mtl-rope-vectors').data,
                score: !!document.getElementById('mtl-rope-score').data,
            })""")
            check("modern lab renders attention, logits and RoPE plots",
                  all(modern.values()), json.dumps(modern))
            page2.select_option("#mtl-pos", "sin")
            page2.select_option("#mtl-attn", "mha")
            page2.select_option("#mtl-ffn", "gelu")
            page2.wait_for_timeout(500)
            modern_changed = page2.evaluate("""() => ({
                attention: !!document.getElementById('mtl-attention').data,
                logits: !!document.getElementById('mtl-logits').data,
                readout: document.getElementById('mtl-readout').textContent,
            })""")
            check("modern lab controls re-render the forward pass",
                  modern_changed["attention"] and modern_changed["logits"]
                  and "Sinusoidal" in modern_changed["readout"] and "MHA" in modern_changed["readout"],
                  json.dumps(modern_changed)[:300])
            check("modern lab has no page or console errors", not modern_errors, "; ".join(modern_errors[:5]))
            page2.close()

            # 5. Initializer chapter controls.
            init_errors: list[str] = []
            page3 = browser.new_page(viewport={"width": 1200, "height": 900})
            page3.on("pageerror", lambda e: init_errors.append("pageerror: " + str(e)))
            page3.on("console", lambda m: init_errors.append("console: " + m.text) if m.type == "error" else None)
            page3.goto(f"http://127.0.0.1:{port}/initializers.php", wait_until="load", timeout=120000)
            page3.wait_for_function("() => !!document.getElementById('init-variance-plot').data", timeout=60000)
            init_plot = page3.evaluate("""() => ({
                plot: !!document.getElementById('init-variance-plot').data,
                hist: !!document.querySelector('#init-hist').getContext,
                note: document.getElementById('init-variance-note').textContent,
            })""")
            check("initializer chapter renders variance and histogram", all([init_plot["plot"], init_plot["hist"], bool(init_plot["note"])]), json.dumps(init_plot)[:300])
            page3.select_option("#init-scheme", "he")
            page3.select_option("#init-act", "relu")
            page3.wait_for_timeout(400)
            init_after = page3.evaluate("""() => ({
                scheme: document.getElementById('init-scheme').value,
                note: document.getElementById('init-variance-note').textContent,
            })""")
            check("initializer controls recompute the variance model",
                  init_after["scheme"] == "he" and "relu" in init_after["note"].lower(),
                  json.dumps(init_after)[:200])
            check("initializer chapter has no page or console errors", not init_errors, "; ".join(init_errors[:5]))
            page3.close()

            check("no page or console errors", not errors, "; ".join(errors[:5]))
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    failed = [c for c in CASES if not c[1]]
    print(f"\n{len(CASES) - len(failed)}/{len(CASES)} passed")
    if failed:
        print("FAILED:")
        for name, _, detail in failed:
            print(f"  - {name}: {detail}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
