#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""
Regression tests for the transformer lesson fixes.

Covers the bugs that were easy to reintroduce:
  * inference prompts must NOT get an appended <|endoftext|> (training corpora
    still do), otherwise the next-token distribution is read at the EOS
    position and the model predicts EOS immediately;
  * the removed "What each layer is doing" panel must stay removed;
  * the attractor-detector summary must wrap instead of overflowing;
  * the Probability Flow residual-write chart must exist;
  * quiz feedback keeps a reserved height so answering does not shift the page.

Run from the repository root:
    uv run blog/tests/transformer_regression_test.py
"""

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"


def free_port():
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def make_driver():
    opts = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1400,1000"):
        opts.add_argument(arg)
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    except Exception:
        return webdriver.Chrome(options=opts)


def wait_for(driver, script, timeout=40):
    end = time.time() + timeout
    while time.time() < end:
        try:
            value = driver.execute_script(script)
            if value:
                return value
        except Exception:
            pass
        time.sleep(0.4)
    raise AssertionError("timed out waiting for: " + script)


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


class Results:
    def __init__(self):
        self.passed = 0
        self.failed = 0

    def check(self, name, condition, detail=""):
        if condition:
            self.passed += 1
            print(f"  PASS  {name}")
        else:
            self.failed += 1
            print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def test_static(results):
    print("\n[static]")
    php = text("blog/transformer.php")
    tda = text("blog/tda_live.js")
    river = text("blog/llm_river.js")
    quiz = text("blog/modules/quiz.js")
    attn = text("blog/attention_engine.js")
    tm_attn = text("blog/tenminutes/assets/full/attention_engine.js")
    tm_js = text("blog/tenminutes/assets/full/transformer.js")

    results.check(
        "layer-summary script removed",
        "transformer_layer_summary.js" not in php,
    )
    results.check(
        "attractor summary wraps",
        "overflow-wrap: anywhere" in php,
    )
    results.check(
        "attractor entries separated by breakable spaces",
        'parts.join(" · ")' in tda,
    )
    results.check(
        "residual-write chart container exists",
        "transformer-residual-contrib-plot" in river and "_themeriver_render_residual_contrib" in river,
    )
    results.check(
        "quiz reserves feedback height",
        "reserveFeedbackHeight" in quiz and ".mnz-feedback" in quiz,
    )
    results.check(
        "attention-web canvas is not capped",
        "max-width:none" in attn and "max-width:none" in tm_attn,
    )
    results.check(
        "head highlight is hover-driven",
        "svg.addEventListener('mouseover', over)" in attn
        and "svg.addEventListener('mouseover', over)" in tm_attn,
    )
    results.check(
        "tenminutes attention web redraws on reveal",
        "_attnWebDraw" in tm_js and "ResizeObserver" in tm_js,
    )
    main_js = text("blog/transformer.js")
    results.check(
        "token picker inserts word separators",
        "needsSpace" in main_js and "needsSpace" in tm_js,
    )
    results.check(
        "h_last is rendered one component per row",
        "\\\\begin{bmatrix} ${hLastRows}" in main_js
        and "\\\\begin{bmatrix} ${hLastRows}" in tm_js,
    )
    results.check(
        "residual 3D chart is wired",
        "transformer-residual-stream-3d" in river and "_themeriver_render_residual_3d" in river,
    )


def test_page(driver, base, label, results):
    print(f"\n[{label}]")
    driver.get(base)
    wait_for(driver, "return typeof transformer_tokenize_render === 'function'")

    tokens = driver.execute_script("return transformer_tokenize_render('the', null, false);")
    results.check(
        f"{label}: inference prompt has no EOS",
        "<|endoftext|>" not in tokens,
        str(tokens),
    )
    trained = driver.execute_script("return transformer_tokenize_render('the', null);")
    results.check(
        f"{label}: training corpus still ends with EOS",
        "<|endoftext|>" in trained,
        str(trained),
    )


def test_main_ui(driver, base, results):
    print("\n[main UI]")
    driver.get(base)
    wait_for(driver, "return !!document.getElementById('step-input')")
    results.check(
        "no layer-summary panel rendered",
        driver.execute_script("return !document.getElementById('transformer-layer-summary')"),
    )
    results.check(
        "no 'What each layer is doing' text",
        driver.execute_script(
            "return document.body.innerText.indexOf('What each layer is doing') === -1"
        ),
    )
    projection_len = driver.execute_script(
        "var el = document.getElementById('transformer-output-projection'); return el ? el.innerHTML.length : 0;"
    )
    results.check(
        "final projection is filled",
        projection_len > 1000,
        f"innerHTML length {projection_len}",
    )
    quiz = driver.execute_script(
        """
const fb = document.querySelector('.mn-quiz .mnz-feedback');
if (!fb) return null;
const cs = getComputedStyle(fb);
return { minHeight: parseFloat(cs.minHeight) || 0, text: fb.textContent };
"""
    )
    results.check(
        "quiz feedback reserves height before answering",
        bool(quiz) and quiz["minHeight"] > 0,
        str(quiz),
    )


def main():
    results = Results()
    test_static(results)

    port = free_port()
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    driver = None
    try:
        driver = make_driver()
        main_url = f"http://127.0.0.1:{port}/transformer.php"
        test_page(driver, main_url, "main", results)
        test_main_ui(driver, main_url, results)
        test_page(driver, f"http://127.0.0.1:{port}/tenminutes/transformer.php", "tenminutes", results)
    finally:
        if driver:
            driver.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    total = results.passed + results.failed
    print(f"\n{results.passed}/{total} passed, {results.failed} failed")
    sys.exit(1 if results.failed else 0)


if __name__ == "__main__":
    main()
