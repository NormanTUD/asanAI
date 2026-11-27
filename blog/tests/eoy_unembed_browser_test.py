#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["playwright"]
# ///
"""Browser guardrails for the merged EOY unembedding slide.

Checks both languages for: one merged slide, no tab UI, a large stage, a Temml
formula, clickable bar cards that only reveal an angle (the green word stays),
the length tour beyond the sphere, fixed cosine angles, arrow navigation, the
angle toggle, the optional anisotropy box, and a clean console.
"""
from __future__ import annotations

import argparse
import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"


def free_port() -> int:
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def chrome_path() -> str | None:
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        found = shutil.which(name)
        if found:
            return found
    return os.environ.get("CHROME_BIN") or None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--langs", default="de,en")
    args = parser.parse_args()
    langs = [x.strip() for x in args.langs.split(",") if x.strip()]

    port = free_port()
    server = subprocess.Popen(
        [shutil.which("php") or "php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.5)
    failures: list[str] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        if not ok:
            failures.append(name + (f": {detail}" if detail else ""))

    try:
        with sync_playwright() as pw:
            executable = chrome_path()
            browser = pw.chromium.launch(
                headless=True,
                executable_path=executable,
                args=["--no-sandbox"],
            )
            for lang in langs:
                page = browser.new_page(viewport={"width": 1400, "height": 1000})
                errors: list[str] = []
                page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
                page.on("console", lambda msg: errors.append(f"console: {msg.text}") if msg.type == "error" else None)
                page.goto(f"http://127.0.0.1:{port}/eoy/index.php?lang={lang}", wait_until="load", timeout=90000)
                page.wait_for_function("() => window.LearnSys", timeout=90000)
                page.wait_for_timeout(1000)
                page.evaluate("() => LearnSys.go(0,19,0)")
                page.wait_for_timeout(1200)

                tag = lang
                body = page.locator("#ls-body").inner_text()
                check(f"{tag} merged title", ("Länge vs. Richtung" if lang == "de" else "Length vs. direction") in page.locator("#ls-stage-title").inner_text(), page.locator("#ls-stage-title").inner_text())
                check(f"{tag} no tab UI", page.locator(".ls-sim-tab").count() == 0, str(page.locator(".ls-sim-tab").count()))
                check(f"{tag} no tab character in body", "\t" not in body)
                check(f"{tag} LayerNorm in prose", "LayerNorm" in body, body[-180:])
                check(f"{tag} Temml rendered in prose", page.locator("#ls-body math").count() > 0, str(page.locator("#ls-body math").count()))
                check(f"{tag} Temml formula under bars", page.locator(".ls-sim-formula math").count() > 0, str(page.locator(".ls-sim-formula math").count()))

                stage = page.locator(".ls-sim-stage").bounding_box()
                formula = page.locator(".ls-sim-formula").bounding_box()
                check(f"{tag} stage is not tiny", stage is not None and stage["height"] > 300, str(stage))
                check(f"{tag} formula sits below the stage", stage is not None and formula is not None and formula["y"] > stage["y"] + stage["height"], str(formula))

                extras = page.locator("#ls-extras").inner_text()
                check(f"{tag} anisotropic optional box", ("Anisotrope Richtungen" if lang == "de" else "Anisotropic directions") in extras, extras[-220:])

                readout = page.locator(".ls-sim-readout")
                selected_before = readout.locator("b").nth(0).inner_text()
                cards = page.locator(".ls-sim-bar-card")
                check(f"{tag} default word is Fluss", selected_before == ("Fluss" if lang == "de" else "river"), selected_before)
                check(f"{tag} five separate bar cards", cards.count() == 5, str(cards.count()))
                check(f"{tag} row w_i is Temml", page.locator(".ls-sim-bar-card .ls-math math").count() >= 5, str(page.locator(".ls-sim-bar-card .ls-math math").count()))
                clicked = cards.nth(1)
                clicked_name = clicked.locator(".ls-sim-bar-head b").inner_text()
                clicked.click()
                page.wait_for_timeout(350)
                selected_after = readout.locator("b").nth(0).inner_text()
                angle_text = readout.inner_text()
                check(f"{tag} bar click keeps the green word", selected_before == selected_after, f"{selected_before} -> {selected_after}")
                check(f"{tag} bar click reveals an angle", ("winkel zu" in angle_text.lower() if lang == "de" else "angle to" in angle_text.lower()) and clicked_name.lower() in angle_text.lower(), angle_text)
                check(f"{tag} clicked card is visually focused", "is-focused" in (clicked.get_attribute("class") or ""), clicked.get_attribute("class"))
                cards.nth(2).click()
                page.wait_for_timeout(300)
                check(f"{tag} second bar keeps the green word", readout.locator("b").nth(0).inner_text() == selected_before, readout.locator("b").nth(0).inner_text())

                slider = page.locator(".ls-sim-scale")
                angle_before = readout.locator("b").nth(2).inner_text() if readout.locator("b").count() > 2 else ""
                page.locator("#ls-nav-next").click()
                page.wait_for_timeout(650)
                check(f"{tag} Next moves slider up", float(slider.input_value()) > 0.4, slider.input_value())
                page.locator("#ls-nav-next").click()
                page.wait_for_timeout(650)
                check(f"{tag} Next goes beyond the sphere", float(slider.input_value()) > 1.0, slider.input_value())
                page.locator("#ls-nav-next").click()
                page.wait_for_timeout(650)
                angle_after = readout.locator("b").nth(2).inner_text() if readout.locator("b").count() > 2 else ""
                check(f"{tag} cosine angle stays fixed", angle_before == angle_after, f"{angle_before} -> {angle_after}")

                page.keyboard.press("ArrowRight")
                page.wait_for_timeout(650)
                check(f"{tag} ArrowRight advances the tour", float(slider.input_value()) < 1.6, slider.input_value())
                page.keyboard.press("ArrowLeft")
                page.wait_for_timeout(650)
                check(f"{tag} ArrowLeft moves back", float(slider.input_value()) >= 1.0, slider.input_value())

                toggle = page.locator(".ls-sim-angle-toggle")
                toggle.click()
                page.wait_for_timeout(250)
                check(f"{tag} angle toggle works", toggle.get_attribute("aria-pressed") == "false", toggle.get_attribute("aria-pressed"))
                check(f"{tag} no console errors", not errors, " | ".join(errors[:3]))
                page.close()
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    if failures:
        print("eoy unembed browser guardrails FAILED")
        for item in failures:
            print(" -", item)
        return 1
    print("eoy unembed browser guardrails: all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
