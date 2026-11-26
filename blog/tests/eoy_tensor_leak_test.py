#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Walk the eoy deck repeatedly and fail on TensorFlow.js tensor leaks.

The full eoy lesson caches one scene per step. The first forward walk is a
warm-up that creates those scenes. The script then walks the deck back and
forth twice, pauses the TF.js scenes at each slide, samples ``tf.memory()``
until the count is stable, and compares the same slide across passes. A slide
whose tensor count grows between the measured passes fails with its exact
delta, so a training or prediction tensor that is never disposed is caught.

Run from the repository root:

    uv run blog/tests/eoy_tensor_leak_test.py
    uv run blog/tests/eoy_tensor_leak_test.py --lang de --passes 2
    uv run blog/tests/eoy_tensor_leak_test.py --only 16 --verbose
    uv run blog/tests/eoy_tensor_leak_test.py --tolerance 0 --max-seconds 900
    uv run blog/tests/eoy_tensor_leak_test.py --only 16 --self-test-leak  # must fail
"""

from __future__ import annotations

import argparse
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
MAX_SUBSTEPS = 8


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def serve(port: int) -> subprocess.Popen:
    php = shutil.which("php")
    if not php:
        raise SystemExit("php is not on PATH")
    return subprocess.Popen(
        [php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_server(port: int, timeout: float = 10.0) -> None:
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return
        except OSError:
            time.sleep(0.05)
    raise SystemExit("php -S did not start")


def launch(playwright):
    attempts = [
        {"channel": "chrome"},
        {"executable_path": shutil.which("chromium")},
        {"executable_path": shutil.which("chromium-browser")},
        {},
    ]
    for attempt in attempts:
        if attempt.get("executable_path") is None and "executable_path" in attempt:
            continue
        try:
            return playwright.chromium.launch(headless=True, args=["--no-sandbox"], **attempt)
        except Exception:
            continue
    raise SystemExit("Could not launch Chromium; run `python3 -m playwright install chromium`")


def signature(page) -> str:
    return page.evaluate(
        "() => ['ls-kicker','ls-title','ls-body'].map(function (id) {"
        " var el = document.getElementById(id); return el ? el.textContent : ''; }).join('|')"
    )


def active_scene(page) -> str | None:
    return page.evaluate(
        "() => { var l = document.querySelector('#ls-demo .ls-scene-layer.is-active');"
        " return l ? l.getAttribute('data-scene') : null; }"
    )


def read_memory(page) -> dict | None:
    return page.evaluate(
        "() => {"
        " if (!window.tf || !tf.memory) return null;"
        " var m = tf.memory();"
        " return { tensors: m.numTensors, bytes: m.numBytes,"
        " gpu: m.numBytesInGPU || 0, gpuAllocated: m.numBytesInGPUAllocated || 0,"
        " backend: tf.getBackend ? tf.getBackend() : '' };"
        " }"
    )


def sample_stable(page, args) -> dict | None:
    values = []
    last_tensors = None
    last_bytes = None
    stable = 0
    deadline = time.time() + args.sample_timeout
    while time.time() < deadline:
        memory = read_memory(page)
        if memory is None:
            return None
        values.append(memory)
        if memory["tensors"] == last_tensors and memory["bytes"] == last_bytes:
            stable += 1
            if stable >= args.stable_samples:
                break
        else:
            stable = 0
        last_tensors = memory["tensors"]
        last_bytes = memory["bytes"]
        page.wait_for_timeout(args.sample_interval)
    if not values:
        return None
    return min(values, key=lambda item: (item["tensors"], item["bytes"]))


def wait_for_button(page, scene: str, timeout: int = 12000) -> bool:
    selector = ".ls-il-toggle" if scene == "imagelab" else ".ls-sinus-train"
    try:
        page.wait_for_function(
            "(args) => {"
            " var l = document.querySelector('#ls-demo .ls-scene-layer.is-active');"
            " var b = l && l.querySelector(args[0]);"
            " if (!b) return false;"
            " if (args[1] && b.disabled) return false;"
            " if (args[1]) return true;"
            " var sc = l.querySelector('.ls-sinus-scene');"
            " return !!(sc && sc.getAttribute('data-net-layers'));"
            " }",
            arg=[selector, scene == "imagelab"],
            timeout=timeout,
        )
        return True
    except PlaywrightError:
        return False


def click_active(page, selector: str) -> None:
    page.evaluate(
        "(selector) => {"
        " var l = document.querySelector('#ls-demo .ls-scene-layer.is-active');"
        " var b = l && l.querySelector(selector);"
        " if (b && !b.disabled) b.click();"
        " }",
        selector,
    )


def visit_slide(page, args, scene: str) -> dict | None:
    if scene == "imagelab":
        if not wait_for_button(page, scene):
            return sample_stable(page, args)
        running = page.evaluate(
            "() => { var l = document.querySelector('#ls-demo .ls-scene-layer.is-active');"
            " var b = l && l.querySelector('.ls-il-toggle');"
            " return !!(b && b.classList.contains('is-stop')); }"
        )
        if not running:
            click_active(page, ".ls-il-toggle")
            page.wait_for_timeout(args.play_ms)
        click_active(page, ".ls-il-toggle")
        page.wait_for_timeout(args.pause_ms)
        memory = sample_stable(page, args)
        click_active(page, ".ls-il-toggle")
        return memory
    if scene == "model":
        if not wait_for_button(page, scene):
            return sample_stable(page, args)
        is_pause = page.evaluate(
            "() => { var l = document.querySelector('#ls-demo .ls-scene-layer.is-active');"
            " var b = l && l.querySelector('.ls-sinus-train');"
            " return !!(b && /pause|pausieren/i.test(b.textContent || '')); }"
        )
        if not is_pause:
            click_active(page, ".ls-sinus-train")
            page.wait_for_timeout(args.play_ms)
        click_active(page, ".ls-sinus-train")
        page.wait_for_timeout(args.pause_ms)
        memory = sample_stable(page, args)
        click_active(page, ".ls-sinus-train")
        return memory
    page.wait_for_timeout(args.settle)
    return sample_stable(page, args)


def go_slide(page, step: int, sub: int) -> bool:
    try:
        page.evaluate(
            "(args) => { if (window.LearnSys && LearnSys.go) LearnSys.go(0, args[0], args[1]); }",
            [step, sub],
        )
        return True
    except PlaywrightError:
        return False


def discover_slides(page, steps: list[int], args) -> list[dict]:
    slides: list[dict] = []
    for step in steps:
        previous = None
        for sub in range(MAX_SUBSTEPS):
            if not go_slide(page, step, sub):
                raise SystemExit(f"LearnSys.go failed for step {step} sub {sub}")
            page.wait_for_timeout(args.settle)
            state = page.evaluate("() => window.LearnSys.state ? window.LearnSys.state() : null")
            if not state or int(state.get("step", -1)) != step or int(state.get("substep", -1)) != sub:
                break
            sig = signature(page)
            if sub > 0 and sig == previous:
                break
            scene = active_scene(page)
            memory = visit_slide(page, args, scene)
            if args.self_test_leak:
                page.evaluate("() => { if (window.tf) tf.keep(tf.tensor1d([1])); }")
            slides.append({
                "step": step,
                "sub": sub,
                "scene": scene,
                "signature": sig,
                "warmup": memory,
            })
            previous = sig
    return slides


def traverse(page, slides: list[dict], direction: str, label: str, args) -> dict:
    records = {}
    ordered = slides if direction == "forward" else list(reversed(slides))
    for index, slide in enumerate(ordered, 1):
        if time.time() - args.started > args.max_seconds:
            raise SystemExit(f"time budget exhausted during {label} at slide {index}/{len(ordered)}")
        if not go_slide(page, slide["step"], slide["sub"]):
            raise SystemExit(f"LearnSys.go failed for step {slide['step']} sub {slide['sub']}")
        page.wait_for_timeout(args.settle)
        scene = active_scene(page)
        memory = visit_slide(page, args, scene)
        if args.self_test_leak:
            page.evaluate("() => { if (window.tf) tf.keep(tf.tensor1d([1])); }")
        key = (slide["step"], slide["sub"])
        records[key] = {"scene": scene, "memory": memory, "direction": direction}
        if args.verbose:
            shown = "n/a" if memory is None else str(memory["tensors"])
            print(f"  {label:>10} {direction:>7} {index:>2}/{len(ordered)} "
                  f"step {slide['step'] + 1:>2} sub {slide['sub']} scene {scene or '-':<14} tensors {shown}")
    return records


def compare(previous: dict, current: dict, left: str, right: str, tolerance: int) -> list[dict]:
    findings = []
    for key in sorted(set(previous) & set(current)):
        record = current[key]
        before = previous[key]["memory"]
        after = record["memory"]
        if before is None or after is None:
            continue
        delta = after["tensors"] - before["tensors"]
        bytes_delta = after["bytes"] - before["bytes"]
        if delta > tolerance:
            findings.append({
                "key": key,
                "scene": record["scene"],
                "left": left,
                "right": right,
                "before": before,
                "after": after,
                "delta": delta,
                "bytes_delta": bytes_delta,
            })
    return findings


def run_language(port: int, lang: str, args, playwright) -> list[dict]:
    browser = launch(playwright)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.set_default_timeout(12000)
    page.on("dialog", lambda dialog: dialog.dismiss())
    errors: list[str] = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    findings: list[dict] = []
    try:
        url = f"http://127.0.0.1:{port}/eoy/index.php?lang={lang}"
        page.goto(url, wait_until="load", timeout=60000)
        page.wait_for_function(
            "() => window.LearnSys && document.querySelectorAll('#ls-steps .ls-dot').length",
            timeout=40000,
        )
        page.wait_for_timeout(1400)
        total_steps = int(page.evaluate("document.querySelectorAll('#ls-steps .ls-dot').length"))
        steps = args.steps or list(range(total_steps))
        steps = [step for step in steps if 0 <= step < total_steps]
        if not steps:
            raise SystemExit("no steps selected")
        print(f"[{lang}] {total_steps} steps, walking {len(steps)} selected step(s)")
        slides = discover_slides(page, steps, args)
        if not slides:
            raise SystemExit("no slides discovered")
        if not any(slide["warmup"] for slide in slides):
            raise SystemExit("TF.js memory was never available during the warm-up")
        print(f"[{lang}] warm-up forward complete: {len(slides)} slide(s)")
        runs: list[tuple[dict, dict]] = []
        for index in range(args.passes):
            back = traverse(page, slides, "back", f"back{index + 1}", args)
            forward = traverse(page, slides, "forward", f"forward{index + 1}", args)
            runs.append((back, forward))
        final_back = traverse(page, slides, "back", "return", args)
        for index, (back, forward) in enumerate(runs):
            next_back = runs[index + 1][0] if index + 1 < len(runs) else final_back
            next_forward = runs[index + 1][1] if index + 1 < len(runs) else None
            findings.extend(compare(back, next_back, f"back{index + 1}", f"back{index + 2}", args.tolerance))
            if next_forward is not None:
                findings.extend(compare(forward, next_forward, f"forward{index + 1}", f"forward{index + 2}", args.tolerance))
        if errors:
            findings.append({"error": "pageerror", "messages": errors[:4]})
        return findings
    finally:
        try:
            context.close()
        finally:
            browser.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["de", "en", "both"], default="de")
    parser.add_argument("--only", action="append", default=[], help="day number(s), e.g. --only 16")
    parser.add_argument("--passes", type=int, default=2, help="measured round trips after the warm-up")
    parser.add_argument("--settle", type=int, default=450, help="ms after a slide navigation")
    parser.add_argument("--play", dest="play_ms", type=int, default=850, help="ms of training per TF slide")
    parser.add_argument("--pause", dest="pause_ms", type=int, default=900, help="ms after pausing before sampling")
    parser.add_argument("--sample-timeout", type=float, default=3.0, help="max seconds for a stable tensor sample")
    parser.add_argument("--sample-interval", type=int, default=120, help="ms between tensor samples")
    parser.add_argument("--stable-samples", type=int, default=4, help="consecutive equal samples needed")
    parser.add_argument("--tolerance", type=int, default=0, help="allowed tensor growth between passes")
    parser.add_argument("--max-seconds", type=float, default=900.0, help="hard time budget per language")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--no-fail", action="store_true")
    parser.add_argument("--self-test-leak", action="store_true", help="intentionally leak one tensor per slide")
    args = parser.parse_args()

    if args.only:
        args.steps = [int(day) - 1 for day in args.only]
    else:
        args.steps = None
    args.started = time.time()
    langs = ["de", "en"] if args.lang == "both" else [args.lang]
    port = free_port()
    server = serve(port)
    wait_server(port)
    findings: list[dict] = []
    try:
        with sync_playwright() as playwright:
            for lang in langs:
                args.started = time.time()
                findings.extend(run_language(port, lang, args, playwright))
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    if findings:
        print("\nTENSOR LEAK FINDINGS")
        for finding in findings:
            if "error" in finding:
                print(f"  pageerror: {' | '.join(finding['messages'])}")
                continue
            before = finding["before"]["tensors"]
            after = finding["after"]["tensors"]
            print(
                f"  step {finding['key'][0] + 1} sub {finding['key'][1]} "
                f"scene {finding['scene'] or '-'} {finding['left']} -> {finding['right']}: "
                f"{before} -> {after} ({finding['delta']:+d} tensors, "
                f"{finding['bytes_delta']:+d} bytes, GPU {finding['after']['gpu']} B)"
            )
        if not args.no_fail:
            raise SystemExit(1)
    print("no tensor leaks found")


if __name__ == "__main__":
    main()
