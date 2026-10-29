# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Browser regression test for the optional "Ask the course" chat.

The backend is mocked in the page, so this runs without Ollama: it checks the
health gate, the queue/ETA status text, the generated answer, source links and
console cleanliness.

Run from the repository root:
    uv run blog/tests/rag_browser_test.py
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
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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


MOCK = r"""
(() => {
	const realFetch = window.fetch.bind(window);
	let statusCalls = 0;
	const reply = (payload) => Promise.resolve(new Response(JSON.stringify(payload), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	}));
	window.fetch = function (input, init) {
		const url = String(input);
		if (url.indexOf('ask.php?health=1') !== -1) {
			return reply({ ok: true, ready: true, ollama: true, model: 'mock', model_present: true });
		}
		if (url.indexOf('ask.php?status=') !== -1) {
			if (url.indexOf('undefined') !== -1) {
				return reply({ error: 'unknown_job' });
			}
			statusCalls += 1;
			if (statusCalls <= 3) {
				return reply({
					status: 'running',
					position: 0,
					eta_seconds: 10,
					partial: 'A perceptron is a linear classifier'
				});
			}
			return reply({
				status: 'done',
				grounded: true,
				answer: 'A perceptron is a linear classifier [S1].',
				sources: [{
					id: 'S1',
					title: 'Brief History of AI',
					heading: 'The Perceptron',
					url: 'history#the-perceptron'
				}]
			});
		}
		if (url.indexOf('ask.php') === 0) {
			return reply({ id: 'test-job', status: 'queued', position: 2, eta_seconds: 20 });
		}
		return realFetch(input, init);
	};
})();
"""


def status_text(browser: webdriver.Chrome) -> str:
	return browser.execute_script(
		"return (document.querySelector('.rag-chat-status') || {}).textContent || ''"
	)


def main() -> int:
	port = free_port()
	server = subprocess.Popen(
		["php", "-S", f"127.0.0.1:{port}", "-t", str(ROOT)],
		stdout=subprocess.DEVNULL,
		stderr=subprocess.DEVNULL,
	)
	browser = None
	try:
		time.sleep(1)
		browser = driver()
		browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": MOCK})
		browser.get(f"http://127.0.0.1:{port}/index.php")
		WebDriverWait(browser, 60).until(
			lambda d: d.execute_script(
				"return !!document.getElementById('rag-chat-toggle')"
			)
		)
		check(True, "healthy backend shows the chat button")

		browser.execute_script("document.getElementById('rag-chat-toggle').click()")
		WebDriverWait(browser, 10).until(
			lambda d: not d.find_element(By.ID, "rag-chat-panel").get_attribute("hidden")
		)
		check(True, "the chat panel opens")
		check(browser.execute_script(
			"return document.querySelectorAll('#rag-chat-toggle svg path, "
			"#rag-chat-toggle svg circle').length"
		) >= 2, "the chat button has a visible icon")
		check(browser.execute_script(
			"return getComputedStyle(document.querySelector('.rag-chat-close')).color"
		) == "rgb(225, 29, 72)", "the close button is red")

		browser.execute_script(
			"const input = document.querySelector('.rag-chat-input');"
			"input.value = 'What is a perceptron?';"
			"input.dispatchEvent(new Event('input', { bubbles: true }));"
			"document.querySelector('.rag-chat-send').click();"
		)
		WebDriverWait(browser, 5).until(
			lambda d: "You are #2" in status_text(d)
		)
		check("About 20 seconds" in status_text(browser),
			"queued status shows the position and ETA", status_text(browser))

		WebDriverWait(browser, 8).until(
			lambda d: "Generating your answer" in status_text(d)
		)
		check("about 10 seconds" in status_text(browser),
			"running status shows the remaining time", status_text(browser))
		WebDriverWait(browser, 8).until(
			lambda d: len(d.find_elements(By.CSS_SELECTOR, ".rag-chat-msg-assistant")) > 0
		)
		check("A perceptron is a linear classifier" in
			browser.find_element(By.CSS_SELECTOR, ".rag-chat-msg-assistant").text,
			"partial answer streams while generating")

		WebDriverWait(browser, 10).until(
			lambda d: len(d.find_elements(By.CSS_SELECTOR, ".rag-sources")) > 0
		)
		answer = browser.find_element(By.CSS_SELECTOR, ".rag-chat-msg-assistant").text
		check("A perceptron is a linear classifier" in answer,
			"the generated answer is rendered", answer[:120])
		check("Brief History of AI" in answer and "The Perceptron" in answer,
			"source links are rendered", answer[:200])
		check("history#the-perceptron" in browser.execute_script(
			"return document.querySelector('.rag-chat-msg-assistant').innerHTML"
		), "citation points at the lesson")


		# Enter sends; Shift+Enter inserts a newline and does not send.
		input_el = browser.find_element(By.CSS_SELECTOR, ".rag-chat-input")
		input_el.send_keys("What is a derivative?")
		input_el.send_keys(Keys.ENTER)
		WebDriverWait(browser, 8).until(
			lambda d: len(d.find_elements(By.CSS_SELECTOR, ".rag-chat-msg-user")) >= 2
		)
		check(True, "Enter sends the message")

		browser.execute_script("document.querySelector('.rag-chat-input').value = ''")
		input_el = browser.find_element(By.CSS_SELECTOR, ".rag-chat-input")
		input_el.click()
		input_el.send_keys("line one")
		input_el.send_keys(Keys.SHIFT + Keys.ENTER)
		input_el.send_keys("line two")
		value = browser.execute_script(
			"return document.querySelector('.rag-chat-input').value"
		)
		check("\n" in value, "Shift+Enter inserts a newline", repr(value))
		check(len(browser.find_elements(By.CSS_SELECTOR, ".rag-chat-msg-user")) == 2,
			"Shift+Enter does not send the message")

		selected = browser.execute_script("""
			const question = document.querySelector('.rag-chat-msg-user');
			const answer = document.querySelector('.rag-chat-msg-assistant');
			const range = document.createRange();
			range.setStart(question.firstChild, 0);
			range.setEnd(answer, answer.childNodes.length);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
			return selection.toString();
		""")
		check("What is a perceptron?" in selected and "A perceptron" in selected,
			"question and answer can be selected together", selected[:200])
		check(browser.execute_script(
			"return getComputedStyle(document.querySelector('.rag-chat-msg')).userSelect"
		) in ("text", "auto"), "chat text is selectable")

		severe = [entry for entry in browser.get_log("browser")
				  if entry.get("level") == "SEVERE"]
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
