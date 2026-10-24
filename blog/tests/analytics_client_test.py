# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""
Browser-level regression test for analytics.js section/event collection.

Serves a tiny temporary page with .md headings, a train button, a code-copy
button, a citation, internal/external links and a fake track endpoint. It then
verifies that a final beacon contains section visibility and aggregate events,
and that no search query or full external URL is sent.

Usage:
    uv run blog/tests/analytics_client_test.py
"""

from __future__ import annotations

import json
import shutil
import socket
import subprocess
import tempfile
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
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
		"--window-size=1200,900",
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


PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><title>Analytics client test</title>
<script>window.__MNAnalytics={enabled:true,token:"0123456789abcdef0123456789abcdef",endpoint:"/track.php",heartbeat:60000};</script>
</head><body>
<div class="md">
<h2>Section One</h2><p>Hello world. This is a test section with enough words to be visible.</p>
<h2>Section Two</h2><p>Second section text for the section observer to see.</p>
</div>
<button class="btn-train" type="button">Train</button>
<button class="code-copy-btn" type="button">Copy</button>
<a class="cite-stealth" data-target="bib-key" href="#" onclick="return false">citation</a>
<a href="https://example.com/path?q=secret" onclick="return false">external</a>
<a href="other.php" onclick="return false">internal</a>
<script src="analytics.js"></script>
<script>
setTimeout(function(){
  window.dispatchEvent(new CustomEvent('mnsearch:results',{detail:{count:3}}));
  window.dispatchEvent(new CustomEvent('mnquiz:answer',{detail:{id:'quiz',index:1,right:true}}));
}, 300);
</script>
</body></html>
"""

TRACK = """<?php
file_put_contents(__DIR__ . '/payload.log', file_get_contents('php://input') . "\\n", FILE_APPEND);
http_response_code(204);
"""


def main() -> int:
	port = free_port()
	with tempfile.TemporaryDirectory(prefix="asanai-client-test-") as tmp:
		root = Path(tmp)
		(root / "index.html").write_text(PAGE, encoding="utf-8")
		(root / "track.php").write_text(TRACK, encoding="utf-8")
		shutil.copyfile(ROOT / "analytics.js", root / "analytics.js")

		server = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{port}", "-t", str(root)],
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		browser = None
		try:
			time.sleep(1)
			browser = driver()
			browser.get(f"http://127.0.0.1:{port}/index.html")
			time.sleep(2.5)
			browser.execute_script("window.scrollTo(0, document.body.scrollHeight)")
			time.sleep(0.4)
			browser.find_element("css selector", ".btn-train").click()
			browser.find_element("css selector", ".code-copy-btn").click()
			browser.find_element("css selector", "a.cite-stealth").click()
			browser.find_element("css selector", 'a[href^="https://example.com"]').click()
			browser.find_element("css selector", 'a[href="other.php"]').click()
			time.sleep(0.4)
			browser.execute_script("window.dispatchEvent(new Event('pagehide'))")
			time.sleep(1.2)

			log_path = root / "payload.log"
			check(log_path.is_file(), "track endpoint received a payload")
			if not log_path.is_file():
				return 1
			lines = [line for line in log_path.read_text(encoding="utf-8").splitlines() if line.strip()]
			check(bool(lines), "payload log is not empty")
			payload = json.loads(lines[-1])
			check(payload.get("event") == "leave", "final leave event")
			check(payload.get("token") == "0123456789abcdef0123456789abcdef", "page token forwarded")
			sections = payload.get("sections") or []
			events = payload.get("events") or []
			check(len(sections) >= 2, "section visibility collected", str(sections))
			check(any(section.get("k") == "section-one" for section in sections), "first section key")
			check(any(section.get("v", 0) >= 50 for section in sections), "section visibility percentage")
			types = {event.get("type") for event in events}
			expect = {"search", "quiz_answer", "lab_run", "code_copy", "citation", "external_link", "internal_link"}
			check(expect.issubset(types), "interaction events collected", str(types))
			targets = [str(event.get("target", "")) for event in events]
			check(all("?" not in target and "://" not in target for target in targets), "targets contain no query or full URL", str(targets))
			check(any(target == "example.com" for target in targets), "external target is hostname only", str(targets))
			check(any(target == "other" for target in targets), "internal target is page slug", str(targets))
			check("secret" not in json.dumps(payload), "no query secret leaked into payload")
			check(len(json.dumps(payload).encode("utf-8")) < 4096, "payload under 4 KB")
			severe = [entry for entry in browser.get_log("browser") if entry.get("level") == "SEVERE"]
			check(not severe, "no severe browser console errors", str(severe))
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
