#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Regression test for the complex transformer-lesson fixes.

Covers the problems that are easy to break and hard to see:
  * the Pre-LN block formulas show the data flow (h_in -> attention -> h_attn -> FFN -> h_out);
  * right-clicking a rendered equation opens the LaTeX popup (also inside a layer card);
  * the "Collapse all layers" button is a real toggle and updates its label;
  * the 3D capacity note appears only above d_model = 3;
  * head tabs say "Head N", are blue, keep the estimate above the method note;
  * the removed training-window/share UI stays removed in both transformer pages;
  * the inference overlay exists and is theme-token based;
  * a d_model = 10 model memorizes a short training sentence.

Run from the repository root:
    uv run blog/tests/transformer_fix_regression_test.py
"""

from __future__ import annotations

import json
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
CASES: list[tuple[str, bool, str]] = []


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
    subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )


def serve(port: int) -> subprocess.Popen:
    php = shutil.which("php")
    if php is None:
        print("ERROR: php is not on PATH", file=sys.stderr)
        raise SystemExit(1)
    return subprocess.Popen(
        [php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def source_checks() -> None:
    php = (BLOG / "transformer.php").read_text(encoding="utf-8")
    tm_php = (BLOG / "tenminutes" / "transformer.php").read_text(encoding="utf-8")
    js = (BLOG / "transformer.js").read_text(encoding="utf-8")
    tm_js = (BLOG / "tenminutes" / "assets" / "full" / "transformer.js").read_text(encoding="utf-8")
    attn = (BLOG / "attention_engine.js").read_text(encoding="utf-8")
    tm_attn = (BLOG / "tenminutes" / "assets" / "full" / "attention_engine.js").read_text(encoding="utf-8")

    for name, text in (("parent", php + js), ("tenminutes", tm_php + tm_js)):
        check(f"{name}: training-window UI is gone", "Show training windows" not in text and "toggleTrainingWindows" not in text)
        check(f"{name}: share-run UI is gone", "Share run" not in text and "TransformerRun" not in text)
    check("parent: no hyperparameter URL writer", "transformerRunParams" not in js and "collectTransformerRun" not in js)
    check("parent: right-click reads the data-tex wrapper", "closest('[data-tex]')" in (BLOG / "start.js").read_text(encoding="utf-8"))
    for name, text in (("parent", attn), ("tenminutes", tm_attn)):
        check(f"{name}: orange attention-result box removed", "#fffbeb" not in text and "border:1px solid #f59e0b" not in text)
        check(f"{name}: green Pre-LN/next box removed", "background:#f0fdf4" not in text)
        check(f"{name}: head tabs use the blue active state", "2563eb" in text and "is-active" in text)
    for name, text in (("parent", js), ("tenminutes", tm_js)):
        check(f"{name}: collapse-all is a toggle", "updateLayerCollapseAllLabel" in text and "setLayerCardsOpen" in text)
        check(f"{name}: vector-field explanation exists", "createTrajectoryVFNote" in text)
        check(f"{name}: inference overlay is wired", "tmShowInferenceBusy" in text and "tm-inference-busy" in text)


def page_checks(page, port: int) -> None:
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    page.goto(f"http://127.0.0.1:{port}/transformer.php", wait_until="load", timeout=120000)
    page.wait_for_function("() => !!document.querySelector('.tm-transformer-formulas')", timeout=120000)
    page.wait_for_function("() => !!document.querySelector('.tm-layer-card')", timeout=120000)

    formulas = page.evaluate("""() => Array.from(document.querySelectorAll('.tm-transformer-formulas [data-tex]'))
        .map(e => e.getAttribute('data-tex'))""")
    joined = " || ".join(formulas)
    check("formulas use h notation with concat/residual flow",
          r"h_{\text{attn}}" in joined and "Concat" in joined and r"h_{\text{out}}" in joined
          and "z=x+" not in joined, joined[:180])

    note = page.evaluate("""() => {
        const p = document.querySelector('.transformer-slider-note');
        const m = p && p.querySelector('math');
        return m ? {display: getComputedStyle(m).display, tex: m.getAttribute('data-tex')} : null;
    }""")
    check("slider-note math is inline and uses a slash fraction",
          bool(note) and note["display"] == "inline-flex" and "/h" in note["tex"], json.dumps(note))

    check("capacity note is hidden at d_model = 3", not page.evaluate("() => { const n=document.getElementById('tm-capacity-note'); return n ? !n.hidden : true; }"))
    page.evaluate("() => { const s=document.getElementById('transformer-dimension-model'); s.value='4'; s.dispatchEvent(new Event('input',{bubbles:true})); }")
    page.wait_for_timeout(300)
    check("capacity note appears at d_model = 4", page.evaluate("() => { const n=document.getElementById('tm-capacity-note'); return n ? !n.hidden : false; }"))

    page.evaluate("() => { const s=document.getElementById('transformer-dimension-model'); s.value='3'; s.dispatchEvent(new Event('input',{bubbles:true})); }")
    page.wait_for_timeout(1500)

    page.locator(".tm-transformer-formulas math").first.click(button="right")
    page.wait_for_timeout(300)
    check("right-click opens the LaTeX popup", page.evaluate("() => !!document.querySelector('.lp-overlay')"))
    page.keyboard.press("Escape")

    page.evaluate("""() => {
        const card = document.querySelector('.tm-layer-card');
        card.querySelector('.tm-layer-head').click();
        const sub = card.querySelector('.tm-layer-subbox[data-sub="attention"]');
        if (sub) sub.open = true;
    }""")
    page.wait_for_function("() => !!document.querySelector('.tm-layer-card .mha-head-tab-btn')", timeout=60000)
    page.wait_for_timeout(1200)
    head = page.evaluate("""() => {
        const card = document.querySelector('.tm-layer-card');
        const btn = card.querySelector('.mha-head-tab-btn');
        const note = card.querySelector('.tm-head-estimate');
        const method = card.querySelector('.tm-head-method-details');
        const summary = card.querySelector('.tm-layer-head-summary');
        return {
            label: btn.textContent.trim(),
            bg: getComputedStyle(btn).backgroundColor,
            estimate: note ? note.textContent : '',
            methodAfter: !!(note && method && note.nextElementSibling === method && method.querySelector('.tm-head-method')),
            summary: summary ? summary.textContent.slice(0, 80) : null
        };
    }""")
    check("head tab says only 'Head N'", head["label"] == "Head 1", head["label"])
    check("active head tab is blue", head["bg"] == "rgb(37, 99, 235)", head["bg"])
    check("estimate explains context mixing", "dominates" in head["estimate"] or "dominiert" in head["estimate"])
    check("method note sits directly under the estimate", head["methodAfter"])
    check("no per-layer summary when only context mixing is detected", head["summary"] is None, str(head["summary"]))

    page.evaluate("() => document.querySelector('.tm-layer-head').click()")
    page.wait_for_timeout(200)
    page.evaluate("() => document.querySelector('.tm-layer-head').click()")
    page.wait_for_timeout(200)
    states = page.evaluate("""() => {
        const btn = document.querySelector('.tm-layer-collapse-all');
        const before = btn.textContent;
        btn.click(); const afterCollapse = btn.textContent;
        btn.click(); const afterExpand = btn.textContent;
        return {before, afterCollapse, afterExpand};
    }""")
    check("collapse-all toggles label and expands", states["afterCollapse"] == "Expand all layers" and states["afterExpand"] == "Collapse all layers", json.dumps(states))

    check("no Probability-Flow pseudo heading", page.evaluate("() => !Array.from(document.querySelectorAll('.themeriver-header span')).some(e => e.textContent.indexOf('Probability Flow') !== -1)"))
    check("residual-write note explains the bar height", page.evaluate("() => { const n=document.querySelector('.themeriver-residual-note'); return !!n && n.textContent.indexOf('L2 norm') !== -1; }"))
    overlay = page.evaluate("""() => {
        if (typeof window.tmShowInferenceBusy !== 'function') return null;
        window.tmShowInferenceBusy();
        const el = document.getElementById('tm-inference-busy');
        const shown = !!el && !el.hidden;
        window.tmHideInferenceBusy();
        return {shown, hiddenAgain: !!el && el.hidden, card: !!document.querySelector('.tm-inference-busy-card')};
    }""")
    check("inference busy overlay shows and hides", bool(overlay) and overlay["shown"] and overlay["hiddenAgain"] and overlay["card"], json.dumps(overlay))

    check("no console/page errors on the parent page", not errors, "; ".join(errors[:3]))


def training_check(page) -> None:
    result = page.evaluate("""async () => {
        const set = (id, v) => { const e = document.getElementById(id); if (e) { e.value = String(v); e.dispatchEvent(new Event('input', {bubbles:true})); } };
        set('transformer-dimension-model', 10); set('transformer-heads', 2);
        set('transformer-depth', 2); set('transformer-ffn-size', 40);
        const trainEl = document.getElementById('transformer-training-data');
        trainEl.value = 'the king rules the sea';
        trainEl.dispatchEvent(new Event('input', {bubbles:true}));
        clearTimeout(trainingDebounceTimer);
        if (window.syncTransformerSettings) window.syncTransformerSettings('dim');
        clearTimeout(trainingDebounceTimer);
        const tokens = getTrainingTokens();
        set('transformer-context-size', tokens.length - 1);
        clearTimeout(trainingDebounceTimer);
        if (window.run_transformer_demo) window.run_transformer_demo();
        await tf.nextFrame();
        const cfg = getTransformerConfig();
        ensureWeightsAndEmbeddings(tokens, cfg.n_layers, cfg.d_model);
        const weightVars = convert_weights_to_tensors(window.currentWeights);
        const allVars = collectTrainableVars(weightVars);
        const optimizer = createOptimizer('adam', 0.08);
        let loss = null;
        let epochs = 0;
        for (let epoch = 0; epoch < 160; epoch++) {
            epochs = epoch + 1;
            const cost = computeAndApplyGradients(tokens, weightVars, cfg.d_model, cfg.n_layers, cfg.n_heads, allVars, optimizer, 1.0);
            loss = (await cost.data())[0];
            dispose(cost);
            if (epoch % 20 === 0) await tf.nextFrame();
            if (loss < 0.03) break;
        }
        window.currentWeights = await convert_tensors_to_weights(weightVars);
        disposeWeightVars(weightVars);
        dispose(optimizer);
        const vocab = Object.keys(window.persistentEmbeddingSpace);
        const emb = vocab.map(w => window.persistentEmbeddingSpace[w]);
        let correct = 0;
        const predicted = [];
        for (let k = 1; k < tokens.length; k++) {
            const h = runSimpleForwardPass(tokens.slice(0, k), window.currentWeights, cfg.d_model, cfg.n_heads, cfg.n_layers);
            const last = h[h.length - 1];
            let best = 0, bestScore = -Infinity;
            for (let i = 0; i < emb.length; i++) {
                let score = 0;
                for (let j = 0; j < last.length; j++) score += last[j] * emb[i][j];
                if (score > bestScore) { bestScore = score; best = i; }
            }
            const hit = vocab[best] === tokens[k];
            if (hit) correct++;
            predicted.push({target: tokens[k], pred: vocab[best], hit});
        }
        return {correct, total: tokens.length - 1, loss, epochs, predicted, d_model: cfg.d_model};
    }""")
    check("d_model = 10 memorizes a short sentence",
          result["d_model"] == 10 and result["correct"] == result["total"],
          json.dumps(result)[:400])


def tenminutes_check(page, port: int) -> None:
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(f"http://127.0.0.1:{port}/tenminutes/transformer.php", wait_until="load", timeout=120000)
    try:
        page.wait_for_function("() => !!document.querySelector('#transformer_config p math')", timeout=30000)
    except Exception:
        pass
    note = page.evaluate("""() => {
        const m = document.querySelector('#transformer_config p math');
        return m ? {display: getComputedStyle(m).display, tex: m.getAttribute('data-tex')} : null;
    }""")
    check("tenminutes: slider-note math stays inline", bool(note) and note["display"] in ("inline-flex", "inline"), json.dumps(note))
    check("tenminutes: no page errors", not errors, "; ".join(errors[:3]))


def main() -> None:
    source_checks()
    ensure_chromium()
    port = free_port()
    server = serve(port)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1400, "height": 1000})
            page_checks(page, port)
            training_check(page)
            tenminutes_check(page, port)
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    failed = [name for name, ok, _ in CASES if not ok]
    print(f"\n{len(CASES) - len(failed)}/{len(CASES)} passed")
    if failed:
        print("FAILED: " + ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
