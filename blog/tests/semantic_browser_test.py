# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Browser regression test for the local semantic search UI.

Boots a PHP server, opens the course index, and exercises the real search
overlay: a natural-language question must return semantic chunks, regex and
fuzzy modes must still work, and a failed model load must fall back to the
lexical results without an endless spinner.

Run from the repository root:
    uv run blog/tests/semantic_browser_test.py
"""

from __future__ import annotations

import json
import shutil
import socket
import struct
import subprocess
import time
import urllib.request
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
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


def asset_checks(base: str) -> None:
	with urllib.request.urlopen(base + "/semantic_index.json", timeout=30) as response:
		meta = json.loads(response.read().decode("utf-8"))
	check(meta.get("version") == 1, "semantic index version is 1")
	check(meta.get("dims") == 256, "semantic index has 256 dimensions")
	check(len(meta.get("chunks") or []) > 1000, "semantic index contains the course")
	check(bool(meta.get("sourceHash")), "semantic index carries a source hash")

	with urllib.request.urlopen(base + "/semantic_vectors.bin", timeout=30) as response:
		data = response.read()
	magic, version, count, dims = struct.unpack_from("<4I", data, 0)
	check(magic == 0x4D4E5356, "vector file magic is MNSV")
	check(version == 1, "vector file version is 1")
	check(count == len(meta["chunks"]), "vector count matches the chunk list")
	check(dims == meta["dims"], "vector dimensions match the index")
	check(len(data) == 16 + count * 4 + count * dims, "vector file is complete")

	with urllib.request.urlopen(
		base + "/vendor/model2vec/models/potion-base-8M.bin", timeout=60
	) as response:
		model_size = int(response.headers.get("Content-Length") or 0)
	check(model_size > 1_000_000, "packed embedding model is served", str(model_size))


def wait_ready(browser: webdriver.Chrome) -> None:
	WebDriverWait(browser, 90).until(
		lambda d: d.execute_script(
			"return !!window.initSearch && (!document.getElementById('loader')"
			" || document.getElementById('loader').style.display === 'none')"
		)
	)


def open_search(browser: webdriver.Chrome) -> None:
	browser.execute_script("window.initSearch.open()")
	WebDriverWait(browser, 10).until(
		lambda d: d.find_element(By.CSS_SELECTOR, ".search-input").is_displayed()
	)


def set_query(browser: webdriver.Chrome, query: str) -> None:
	browser.execute_script(
		"""
		const input = document.querySelector('.search-input');
		input.value = arguments[0];
		input.dispatchEvent(new Event('input', { bubbles: true }));
		""",
		query,
	)


def js_count(browser: webdriver.Chrome, selector: str) -> int:
	return int(browser.execute_script(
		"return document.querySelectorAll(arguments[0]).length", selector
	))


def result_text(browser: webdriver.Chrome, selector: str) -> str:
	return browser.execute_script(
		"return (document.querySelector(arguments[0]) || {}).textContent || ''",
		selector,
	)


def wait_for_results(browser: webdriver.Chrome, query: str) -> None:
	def ready(d: webdriver.Chrome) -> bool:
		try:
			return (
				js_count(d, ".search-result-item") > 0
				and query in result_text(d, ".search-results-count")
			)
		except Exception:
			return False

	WebDriverWait(browser, 90).until(ready)


def wait_for_semantic(browser: webdriver.Chrome) -> None:
	WebDriverWait(browser, 90).until(
		lambda d: js_count(d, ".search-result-badge-semantic") > 0
	)


def wait_for_hint(browser: webdriver.Chrome, text: str) -> None:
	WebDriverWait(browser, 20).until(
		lambda d: result_text(d, "#search-hint-mode") == text
	)


def set_ai_toggle(browser: webdriver.Chrome, enabled: bool) -> None:
	checked = browser.execute_script(
		"return document.getElementById('search-ai-toggle').checked"
	)
	if checked != enabled:
		browser.execute_script("document.getElementById('search-ai-toggle').click()")
	WebDriverWait(browser, 10).until(
		lambda d: d.execute_script(
			"return document.getElementById('search-ai-toggle').checked"
		) == enabled
	)


def item_titles(browser: webdriver.Chrome, limit: int = 5) -> list[str]:
	return browser.execute_script(
		"""
		return Array.from(
			document.querySelectorAll('.search-result-item .search-result-title')
		).slice(0, arguments[0]).map(function (element) {
			return element.textContent.replace(/\\s+/g, ' ').trim();
		});
		""",
		limit,
	)


def result_snippets(browser: webdriver.Chrome) -> list[str]:
	return browser.execute_script(
		"""
		return Array.from(document.querySelectorAll('.search-result-snippet'))
			.map(function (element) { return element.textContent; });
		"""
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
		asset_checks(base)

		browser = driver()
		browser.get(base + "/index.php")
		wait_ready(browser)
		open_search(browser)

		# Figure macros must never leak their file names or braces into a snippet.
		set_query(browser, "Frank Rosenblatt")
		wait_for_results(browser, "Frank Rosenblatt")
		snippets = result_snippets(browser)
		check(bool(snippets), "Frank Rosenblatt returns results")
		if snippets:
			first = snippets[0]
			check("frank_rosenblatt_commons.jpg" not in first,
				"figure file name is cleaned from snippets")
			check("img_frank_rosenblatt" not in first,
				"citation key is resolved in snippets")
			check("{" not in first and "}" not in first,
				"macro braces are cleaned from snippets")
			check("Frank Rosenblatt" in first, "caption text survives snippet cleaning")

		# The AI checkbox must switch to pure keyword search and remember it.
		set_ai_toggle(browser, False)
		question = "why do neural networks need nonlinear activation functions"
		set_query(browser, question)
		wait_for_results(browser, question)
		check(js_count(browser, ".search-result-item") > 0,
			"pure text search returns results")
		check(js_count(browser, ".search-result-badge-semantic") == 0,
			"AI search off does not run semantic ranking")

		browser.get(base + "/index.php")
		wait_ready(browser)
		open_search(browser)
		check(not browser.execute_script(
			"return document.getElementById('search-ai-toggle').checked"
		), "AI search preference survives a reload")

		set_ai_toggle(browser, True)
		set_query(browser, question)
		wait_for_semantic(browser)
		titles = item_titles(browser)
		check(bool(titles), "question returns results")
		check(
			"Activation" in titles[0] or "activation" in titles[0].lower(),
			"question puts the relevant lesson first",
			" | ".join(titles[:3]),
		)
		check(js_count(browser, ".search-result-badge-semantic") > 0,
			"semantic results carry the meaning badge")
		check("match" in result_text(browser, ".search-results-count"),
			"result count is rendered")

		latency = browser.execute_async_script(
			"""
			const done = arguments[arguments.length - 1];
			window.MNSemantic.load().then(function () {
				const t0 = performance.now();
				for (let i = 0; i < 10; i++) {
					window.MNSemantic.search('why do neural networks need activation functions');
				}
				done((performance.now() - t0) / 10);
			}).catch(function (error) { done(-1); });
			"""
		)
		check(latency >= 0, "semantic search can run in the page")
		check(latency < 500, "semantic search stays under 500 ms", f"{latency:.1f} ms")
		print(f"     browser semantic search: {latency:.1f} ms/query")

		set_query(browser, "backpropagation")
		wait_for_results(browser, "backpropagation")
		check(js_count(browser, ".search-result-item") > 0,
			"short keyword query still returns results")

		set_query(browser, "/attention/")
		wait_for_hint(browser, "regex mode")
		wait_for_results(browser, "/attention/")
		check(js_count(browser, ".search-result-item") > 0,
			"regex mode returns results")
		check(js_count(browser, ".search-result-badge-semantic") == 0,
			"regex mode does not run semantic search")

		set_query(browser, "~atention")
		wait_for_hint(browser, "fuzzy mode")
		wait_for_results(browser, "~atention")
		check(js_count(browser, ".search-result-item") > 0,
			"fuzzy mode returns results")
		check(js_count(browser, ".search-result-badge-semantic") == 0,
			"fuzzy mode does not run semantic search")

		# A rejected model load must leave the lexical path untouched and must
		# not leave the "Searching by meaning…" spinner behind.
		browser.get(base + "/index.php")
		wait_ready(browser)
		open_search(browser)
		browser.execute_script(
			"window.MNSemantic = { load: function () {"
			" return Promise.reject(new Error('blocked')); },"
			" search: function () { return []; } };"
		)
		set_query(browser, "backpropagation")
		wait_for_results(browser, "backpropagation")
		check(js_count(browser, ".search-result-item") > 0,
			"failed semantic load falls back to lexical results")
		check(js_count(browser, ".search-loading") == 0,
			"failed semantic load does not leave a spinner")

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
