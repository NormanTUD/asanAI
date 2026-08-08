#!/usr/bin/env python3
"""
Take a headless screenshot of the running asanAI instance and (optionally)
compare it pixel-perfectly against the reference PNG.

This uses Playwright instead of `chromium --screenshot` because the latter's
`--virtual-time-budget` does not advance past real network requests, so the
asanAI loading screen would still be visible at screenshot time.

The script waits for the `#mainsite` element to become visible (that is
how `main.js::show_website_and_hide_loader` signals the app is ready) and
then takes a viewport screenshot.

Usage:
    take_screenshot.py [--update] [options]

Exit codes:
    0  - screenshot matches reference (or --update succeeded)
    1  - screenshot differs from reference
    2  - bad usage / missing dependency / page never finished loading
"""

from __future__ import annotations

import argparse
import asyncio
import os
import shutil
import sys
import tempfile
from pathlib import Path

from playwright.async_api import (
	Browser,
	BrowserContext,
	Error as PlaywrightError,
	Page,
	async_playwright,
)


def log(msg: str) -> None:
	print(msg, file=sys.stderr)


async def _wait_for_app_ready(page: Page, selector: str, timeout_ms: int) -> bool:
	"""Wait for `selector` to become visible. Returns True on success."""
	try:
		await page.wait_for_selector(selector, state="visible", timeout=timeout_ms)
		return True
	except PlaywrightError as exc:
		log(f"WARNING: '{selector}' did not become visible within {timeout_ms}ms ({exc.__class__.__name__})")
		return False


async def _shoot(
	url: str,
	width: int,
	height: int,
	output_path: str,
	ready_selector: str,
	ready_timeout_ms: int,
	settle_ms: int,
	headless: bool,
) -> None:
	async with async_playwright() as p:
		browser: Browser = await p.chromium.launch(
			headless=headless,
			args=[
				"--no-sandbox",
				"--disable-gpu",
				"--enable-unsafe-swiftshader",
			],
		)
		try:
			context: BrowserContext = await browser.new_context(
				viewport={"width": width, "height": height},
				permissions=["camera", "microphone"],
				ignore_https_errors=True,
			)
			page = await context.new_page()

			log(f"Navigating to {url} ...")
			await page.goto(url, wait_until="domcontentloaded", timeout=30_000)

			if ready_selector:
				log(f"Waiting for '{ready_selector}' (timeout {ready_timeout_ms}ms) ...")
				if not await _wait_for_app_ready(page, ready_selector, ready_timeout_ms):
					# Try to continue anyway so we still get a screenshot to debug.
					log("Continuing despite readiness timeout ...")

			if settle_ms > 0:
				log(f"Letting things settle for {settle_ms}ms ...")
				await page.wait_for_timeout(settle_ms)

			log(f"Capturing viewport screenshot to {output_path} ...")
			await page.screenshot(path=output_path, full_page=False)
		finally:
			await browser.close()


def compare(reference_path: str, current_path: str) -> int:
	"""Compare two PNGs pixel-perfectly. Returns 0 on match, 1 on diff, 2 on error."""
	try:
		from PIL import Image
	except ImportError:
		log("ERROR: Pillow (python3-pil) is required for pixel comparison.")
		return 2

	if not os.path.isfile(reference_path):
		log(f"Reference image not found: {reference_path}")
		return 2
	if not os.path.isfile(current_path):
		log(f"Current image not found: {current_path}")
		return 2

	ref = Image.open(reference_path).convert("RGB")
	cur = Image.open(current_path).convert("RGB")

	if ref.size != cur.size:
		log(
			f"Size mismatch: reference={ref.size[0]}x{ref.size[1]}, "
			f"current={cur.size[0]}x{cur.size[1]}"
		)
		return 1

	ref_bytes = ref.tobytes()
	cur_bytes = cur.tobytes()

	if ref_bytes == cur_bytes:
		log("Pixel-perfect match")
		return 0

	width, height = ref.size
	total = width * height
	diff = 0
	first_x = -1
	first_y = -1
	for i in range(0, len(ref_bytes), 3):
		if ref_bytes[i:i + 3] != cur_bytes[i:i + 3]:
			if first_x == -1:
				pixel_index = i // 3
				first_x = pixel_index % width
				first_y = pixel_index // width
			diff += 1

	pct = (diff * 100.0) / total if total else 0.0
	log(f"{diff}/{total} pixels differ ({pct:.2f}%); first diff at ({first_x}, {first_y})")
	return 1


def main(argv: list[str]) -> int:
	here = Path(__file__).resolve().parent
	default_reference = str(here / "reference.png")

	parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
	parser.add_argument("--url", default=os.environ.get("SCREENSHOT_URL", "http://localhost:1122/"))
	parser.add_argument("--reference", default=os.environ.get("SCREENSHOT_REFERENCE", default_reference))
	parser.add_argument("--output", default=None, help="Where to write the new screenshot (default: temp file).")
	parser.add_argument("--width", type=int, default=int(os.environ.get("SCREENSHOT_WIDTH", "1300")))
	parser.add_argument("--height", type=int, default=int(os.environ.get("SCREENSHOT_HEIGHT", "1500")))
	parser.add_argument("--ready-selector", default=os.environ.get("SCREENSHOT_READY_SELECTOR", "#mainsite"))
	parser.add_argument("--ready-timeout-ms", type=int, default=int(os.environ.get("SCREENSHOT_READY_TIMEOUT_MS", "30000")))
	parser.add_argument("--settle-ms", type=int, default=int(os.environ.get("SCREENSHOT_SETTLE_MS", "1500")))
	parser.add_argument("--update", action="store_true", help="Overwrite the reference with the new screenshot.")
	parser.add_argument("--no-headless", action="store_true", help="Run browser with a visible UI (debug only).")
	args = parser.parse_args(argv[1:])

	output = args.output or os.path.join(tempfile.gettempdir(), "asanai_screenshot.png")
	os.makedirs(os.path.dirname(output) or ".", exist_ok=True)

	try:
		asyncio.run(
			_shoot(
				url=args.url,
				width=args.width,
				height=args.height,
				output_path=output,
				ready_selector=args.ready_selector,
				ready_timeout_ms=args.ready_timeout_ms,
				settle_ms=args.settle_ms,
				headless=not args.no_headless,
			)
		)
	except Exception as exc:
		log(f"ERROR: failed to take screenshot: {exc.__class__.__name__}: {exc}")
		return 2

	if not os.path.isfile(output) or os.path.getsize(output) == 0:
		log(f"ERROR: screenshot was not written to {output}")
		return 2

	log(f"Screenshot captured: {output} ({os.path.getsize(output)} bytes)")

	if args.update:
		os.makedirs(os.path.dirname(args.reference) or ".", exist_ok=True)
		shutil.copy(output, args.reference)
		log(f"Reference updated: {args.reference}")
		return 0

	if not os.path.isfile(args.reference):
		log(f"Reference screenshot not found: {args.reference}")
		log("Generate it with: take_screenshot.py --update")
		return 1

	rc = compare(args.reference, output)
	if rc == 0:
		log("Screenshot test PASSED")
	else:
		log("Screenshot test FAILED")
		log(f"Current screenshot:   {output}")
		log(f"Reference screenshot: {args.reference}")
		log("To accept the new design, run: take_screenshot.py --update")
	return rc


if __name__ == "__main__":
	sys.exit(main(sys.argv))
