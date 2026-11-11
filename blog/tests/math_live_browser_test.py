#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Browser regression test for live formula updates (math_i).

Dragging a slider must replace the rendered equation in the same event, with a
short crossfade between the old and new MathML, instead of leaving the old
equation on screen until the debounced document-wide render pass runs.

Run from the repository root:
    uv run blog/tests/math_live_browser_test.py
"""

from __future__ import annotations

import shutil
import socket
import subprocess
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

ROOT = Path(__file__).resolve().parent.parent
failures = 0
checks = 0


def check(condition: bool, label: str, detail: str = "") -> None:
	global failures, checks
	checks += 1
	if condition:
		print(f"ok   {label}")
		return
	failures += 1
	print(f"FAIL {label}" + (f" — {detail}" if detail else ""))


def free_port() -> int:
	with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
		sock.bind(("127.0.0.1", 0))
		return int(sock.getsockname()[1])


def driver() -> webdriver.Chrome:
	options = Options()
	for arg in [
		"--headless=new",
		"--no-sandbox",
		"--disable-dev-shm-usage",
		"--disable-gpu",
		"--window-size=1400,1000",
		"--remote-debugging-pipe",
		"--disable-extensions",
		"--disable-background-networking",
		"--disable-software-rasterizer",
	]:
		options.add_argument(arg)
	options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
	binary = (
		shutil.which("chromium-browser")
		or shutil.which("chromium")
		or shutil.which("google-chrome")
	)
	if binary:
		options.binary_location = binary
	try:
		return webdriver.Chrome(
			service=Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install()),
			options=options,
		)
	except Exception:
		try:
			return webdriver.Chrome(
				service=Service(ChromeDriverManager().install()),
				options=options,
			)
		except Exception:
			return webdriver.Chrome(options=options)


def wait_ready(browser: webdriver.Chrome) -> None:
	WebDriverWait(browser, 90).until(
		lambda d: d.execute_script(
			"return document.readyState === 'complete' && window.MNMath && "
			"typeof window.MNMath.afterPaint === 'function' && "
			"(!document.getElementById('loader') || "
			"document.getElementById('loader').style.display === 'none')"
		)
	)


def scroll_and_wait_math(browser: webdriver.Chrome, container: str) -> None:
	browser.execute_script(
		"document.getElementById(arguments[0]).scrollIntoView({block: 'center', behavior: 'instant'});",
		container,
	)
	WebDriverWait(browser, 60).until(
		lambda d: d.execute_script(
			"const el = document.getElementById(arguments[0]);"
			"return !!(el && el.querySelector('math'));",
			container,
		)
	)


def dispatch_slider(browser: webdriver.Chrome, slider: str, value: str, container: str) -> dict:
	return browser.execute_script(
		"""
		const el = document.getElementById(arguments[2]);
		const slider = document.getElementById(arguments[0]);
		el.scrollIntoView({ block: 'center', behavior: 'instant' });
		const before = el.querySelector('math');
		const beforeTex = before ? (before.getAttribute('data-tex') || '') : '';
		slider.value = arguments[1];
		const started = performance.now();
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		const elapsed = performance.now() - started;
		const after = el.querySelector('math');
		return {
			beforeTex,
			afterTex: after ? (after.getAttribute('data-tex') || '') : '',
			elapsed,
			swapIn: el.querySelectorAll('.mn-math-swap-in').length,
			swapOut: el.querySelectorAll('.mn-math-swap-out').length,
			overlayMath: el.querySelectorAll('.mn-math-swap-out math').length,
			position: getComputedStyle(el).position,
		};
		""",
		slider,
		value,
		container,
	)


def wait_for_swap_end(browser: webdriver.Chrome, container: str) -> None:
	WebDriverWait(browser, 10).until(
		lambda d: d.execute_script(
			"const el = document.getElementById(arguments[0]);"
			"return el.querySelectorAll('.mn-math-swap-out').length === 0 && "
			"el.querySelectorAll('.mn-math-swap-in').length === 0;",
			container,
		)
	)


def main() -> int:
	port = free_port()
	base = f"http://127.0.0.1:{port}"
	server = subprocess.Popen(
		["php", "-S", f"127.0.0.1:{port}", "-t", str(ROOT)],
		stdout=subprocess.DEVNULL,
		stderr=subprocess.DEVNULL,
	)
	browser = None
	try:
		time.sleep(1)
		browser = driver()
		browser.get(base + "/math_i.php")
		wait_ready(browser)

		scroll_and_wait_math(browser, "formula-6")
		time.sleep(0.6)
		wait_for_swap_end(browser, "formula-6")
		linear = dispatch_slider(browser, "slider-6-a", "3.7", "formula-6")
		check("3.7" in linear["afterTex"], "slider replaces the equation synchronously", str(linear))
		check(linear["afterTex"] != linear["beforeTex"], "equation source actually changed")
		check(linear["swapIn"] >= 1, "new equation fades in")
		check(linear["swapOut"] >= 1 and linear["overlayMath"] >= 1,
			"old equation is overlaid while fading out")
		check(linear["position"] == "relative", "crossfade host becomes a positioning context")
		wait_for_swap_end(browser, "formula-6")
		check(browser.execute_script(
			"return getComputedStyle(document.getElementById('formula-6')).position === 'static'"
		), "crossfade host restores its position")

		scroll_and_wait_math(browser, "log-equation-display")
		log_update = dispatch_slider(browser, "slider-log-x", "12.5", "log-equation-display")
		check("12.5" in log_update["afterTex"], "log slider replaces the equation synchronously", str(log_update))
		check(log_update["swapOut"] >= 1, "log equation crossfades")
		wait_for_swap_end(browser, "log-equation-display")

		browser.get(base + "/differentiation.php")
		wait_ready(browser)
		browser.execute_script(
			"const p = document.getElementById('plot-secant-tangent');"
			"if (p) p.scrollIntoView({block: 'center', behavior: 'instant'});"
		)
		WebDriverWait(browser, 60).until(
			lambda d: d.execute_script(
				"return !!document.querySelector('#deriv-secant-formula math');"
			)
		)
		time.sleep(0.6)
		global_update = dispatch_slider(browser, "slider-deriv-h", "0.37", "deriv-secant-formula")
		check("0.37" in global_update["afterTex"],
			"global render_temml updates the equation synchronously", str(global_update))
		check(global_update["swapOut"] >= 1,
			"global render_temml crossfades on the first change")
		wait_for_swap_end(browser, "deriv-secant-formula")

		severe = [entry for entry in browser.get_log("browser") if entry["level"] == "SEVERE"]
		check(not severe, "no severe console errors", str(severe[:3]))
	finally:
		if browser:
			browser.quit()
		server.terminate()
		try:
			server.wait(timeout=5)
		except subprocess.TimeoutExpired:
			server.kill()

	print()
	print(f"{checks} checks, {failures} failure(s)")
	return 0 if failures == 0 else 1


if __name__ == "__main__":
	raise SystemExit(main())
