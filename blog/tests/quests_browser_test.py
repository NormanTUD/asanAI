#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Browser regression test for the XP reward center and the Flow Surge.

Boots a PHP server, opens a demo-heavy lesson, then exercises the real UI:
  * the first interactive award spawns the full orb into the badge
  * the badge pulses (`.is-receive`) when that first orb arrives
  * the next award uses the scaled-down orb; distant awards only tick (`.is-tick`)
  * sustained demo interaction fills the Flow meter
  * a full meter lights the ×2 booster, its badge and the overview card

Run from the repository root:
    uv run blog/tests/quests_browser_test.py
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

DEMO_SELECTOR = (
    ".mnlab, [data-interactive], .lab-container, .lab-dashboard, .js-plotly-plot, "
    ".plot-container, canvas, input[type=range], select"
)


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
		"--window-size=1280,1000",
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
			"return !!window.MNQuest && !document.getElementById('loader')"
		)
	)
	time.sleep(3)  # demo tracking runs on blogPostLoadComplete + a short delay


def flow(browser: webdriver.Chrome) -> dict:
	return browser.execute_script("return window.MNQuest.flow();")


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
		browser.get(base + "/backproplab.php")
		wait_ready(browser)

		check(browser.execute_script(
			"return !!document.querySelector('#mnq-hud')"
		), "the reward badge is rendered")
		check(browser.execute_script(
			"return document.querySelector('.mnq-hud-boost').hidden"
		), "no booster badge before a surge")
		check(flow(browser)["active"] is False, "the flow meter starts inactive")

		# The first demo interaction is the one showy moment: its award leaves
		# as an orb and lands in the badge.
		engaged = browser.execute_script(
			"""
			const selector = arguments[0];
			const contents = document.getElementById('contents');
			const skip = ['.mn-quiz', '.mn-predict', '#mnq-lesson', '#toc',
				'#sources-section', 'SCRIPT', 'STYLE'];
			const root = Array.from(contents.children).find(function (el) {
				if (skip.some(function (s) { return el.matches(s); })) return false;
				return el.matches(selector) || !!el.querySelector(selector);
			});
			if (!root) return false;
			root.dispatchEvent(new PointerEvent('pointerdown', {
				bubbles: true, pointerType: 'mouse', buttons: 1,
				clientX: 420, clientY: 520
			}));
			return true;
			""",
			DEMO_SELECTOR,
		)
		check(engaged, "the lesson exposes a demo to interact with")
		WebDriverWait(browser, 4).until(
			lambda d: d.execute_script(
				"return document.querySelectorAll('.mnq-orb').length > 0;"
			)
		)
		check(browser.execute_script(
			"return Array.from(document.querySelectorAll('.mnq-orb'))"
			".some(function (el) { return el.classList.contains('mnq-orb--full'); });"
		), "the first demo award leaves as the full flying orb")
		WebDriverWait(browser, 5).until(
			lambda d: d.execute_script(
				"return document.querySelectorAll('.mnq-orb').length === 0;"
			)
		)
		check(browser.execute_script(
			"return document.getElementById('mnq-hud').classList.contains('is-receive');"
		), "the reward badge pulses when the first orb lands")

		# The same interaction must also charge the Flow meter.
		time.sleep(0.8)
		progress = flow(browser)["progress"]
		check(progress > 0, "demo interaction charges the Flow meter", str(progress))

		# The next interactive award is still shown, but scaled down.
		browser.execute_script(
			"window.MNQuest.xp(2, '· second award', 'second-' + Date.now());"
		)
		WebDriverWait(browser, 4).until(
			lambda d: d.execute_script(
				"return document.querySelectorAll('.mnq-orb--soft').length > 0;"
			)
		)
		check(browser.execute_script(
			"return Array.from(document.querySelectorAll('.mnq-orb'))"
			".every(function (el) { return el.classList.contains('mnq-orb--soft'); });"
		), "the second interactive award uses the scaled-down orb")
		WebDriverWait(browser, 5).until(
			lambda d: d.execute_script(
				"return document.querySelectorAll('.mnq-orb').length === 0;"
			)
		)

		# After the pointer origin is stale, awards only tick the badge.
		time.sleep(3.2)
		quiet = browser.execute_script(
			"""
			const hud = document.getElementById('mnq-hud');
			const before = window.MNQuest.summary().xp;
			window.MNQuest.xp(2, '· quiet award', 'quiet-' + Date.now());
			return {
				delta: window.MNQuest.summary().xp - before,
				orbs: document.querySelectorAll('.mnq-orb').length,
				tick: hud.classList.contains('is-tick')
			};
			"""
		)
		check(quiet["delta"] == 2, "a normal award still counts", str(quiet["delta"]))
		check(quiet["orbs"] == 0, "distant awards do not spawn a flying orb")
		check(quiet["tick"] is True, "distant awards only tick the badge")

		# A full meter lights the booster.
		browser.execute_script("window.MNQuest.feedFlow(30);")
		status = flow(browser)
		check(status["active"] is True, "a full meter activates the Flow Surge")
		check(status["mult"] == 2, "the surge reports the x2 multiplier")
		check(not browser.execute_script(
			"return document.querySelector('.mnq-hud-boost').hidden"
		), "the booster badge appears with the surge")
		check("×2" in browser.execute_script(
			"return document.querySelector('.mnq-hud-boost').textContent;"
		), "the badge names the multiplier")
		check(browser.execute_script(
			"return document.getElementById('mnq-hud').classList.contains('is-surge');"
		), "the reward badge enters its surge state")

		# Boosted awards are doubled and stay quiet too.
		boosted = browser.execute_script(
			"""
			const hud = document.getElementById('mnq-hud');
			const before = window.MNQuest.summary().xp;
			window.MNQuest.xp(10, '· boosted award', 'boosted-' + Date.now());
			return {
				delta: window.MNQuest.summary().xp - before,
				orbs: document.querySelectorAll('.mnq-orb').length,
				tick: hud.classList.contains('is-tick')
			};
			"""
		)
		check(boosted["delta"] == 20, "an award is doubled during the surge", str(boosted["delta"]))
		check(boosted["orbs"] == 0, "boosted awards do not spawn a flying orb")
		check(boosted["tick"] is True, "boosted awards tick the badge")

		# The overview explains the meter and shows the live surge.
		browser.execute_script("window.MNQuest.open('overview');")
		WebDriverWait(browser, 5).until(
			lambda d: d.execute_script(
				"return !!document.querySelector('.mnq-boostcard');"
			)
		)
		check(browser.execute_script(
			"return !!document.querySelector('.mnq-boostcard.is-active');"
		), "the overview shows the active surge card")

		severe = [
			entry for entry in browser.get_log("browser")
			if entry.get("level") == "SEVERE"
		]
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
