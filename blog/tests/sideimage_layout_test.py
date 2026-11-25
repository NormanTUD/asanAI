#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Regression test for right-margin sideimages and floats.

The history lesson carries two awkward real-world figures:

* a very tall newspaper scan that is authored as ``\\sideimage[float]``, and
* a tall clipping authored as ``\\marginfig``.

Both used to drift past the visible right edge (the last letters of the
scan disappeared under the classic scrollbar) or fall back to a centred
inline figure at ordinary laptop widths. This test pins down the measured
geometry at every breakpoint:

* no horizontal page overflow,
* every figure and image right edge stays a safe distance inside the
  visible viewport (``documentElement.clientWidth``, not ``100vw``),
* the margin figure is never silently demoted to a centred inline block
  at widths where a right margin exists,
* the float remains a float at those widths.

Run from the repository root:
    uv run blog/tests/sideimage_layout_test.py
"""

from __future__ import annotations

import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

ROOT = Path(__file__).resolve().parent.parent
BLOG = ROOT
URL_TEMPLATE = "http://localhost:{port}/history.php"

WIDTHS = (1000, 1100, 1200, 1279, 1280, 1366, 1440, 1480, 1520, 1540, 1600, 1920)
MIN_GAP = 6

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
	sock = socket.socket()
	sock.bind(("127.0.0.1", 0))
	port = sock.getsockname()[1]
	sock.close()
	return port


def start_php_server(port: int) -> subprocess.Popen:
	env = dict(os.environ)
	env.setdefault("PHP_CLI_SERVER_WORKERS", "4")
	proc = subprocess.Popen(
		["php", "-S", f"localhost:{port}", "-t", str(BLOG)],
		stdout=subprocess.DEVNULL,
		stderr=subprocess.PIPE,
		env=env,
	)
	time.sleep(1.5)
	if proc.poll() is not None:
		stderr = proc.stderr.read().decode() if proc.stderr else ""
		raise RuntimeError(f"PHP server failed to start: {stderr}")
	return proc


def get_chrome_driver(headless: bool = True) -> webdriver.Chrome:
	options = Options()
	if headless:
		options.add_argument("--headless=new")
	options.add_argument("--no-sandbox")
	options.add_argument("--disable-dev-shm-usage")
	options.add_argument("--disable-gpu")
	options.add_argument("--window-size=1920,1080")
	options.add_argument("--remote-debugging-pipe")
	# The history page is very tall and carries many images. Waiting for the
	# full load event over a single-threaded php -S can exceed Selenium's
	# HTTP timeout; DOMContentLoaded is enough because the test then waits
	# for the two figures it actually measures.
	options.page_load_strategy = "eager"
	options.add_argument("--disable-extensions")
	options.add_argument("--disable-background-networking")

	chrome_binary = (
		shutil.which("chromium-browser")
		or shutil.which("chromium")
		or shutil.which("google-chrome")
	)
	if chrome_binary:
		options.binary_location = chrome_binary

	try:
		service = Service(
			ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install()
		)
		return webdriver.Chrome(service=service, options=options)
	except Exception:
		try:
			service = Service(ChromeDriverManager().install())
			return webdriver.Chrome(service=service, options=options)
		except Exception:
			return webdriver.Chrome(options=options)


WAIT_FOR_FIGURES = """
const imgs = [...document.querySelectorAll('img')]
  .filter(i => /navy|warrenmcculloch/.test(i.src));
if (imgs.length < 2) return false;
return imgs.every(i => {
  if (!i.complete || !i.naturalWidth) return false;
  const fig = i.closest('.sideimage');
  if (!fig) return false;
  const r = fig.getBoundingClientRect();
  return r.width > 10 && r.height > 10;
});
"""

MEASURE = """
const root = document.documentElement;
const clientWidth = root.clientWidth;
const out = {
  innerWidth: window.innerWidth,
  clientWidth: clientWidth,
  scrollWidth: root.scrollWidth,
  figures: []
};
for (const img of document.querySelectorAll('img')) {
  if (!/navy|warrenmcculloch/.test(img.src)) continue;
  const fig = img.closest('.sideimage');
  if (!fig) continue;
  const fr = fig.getBoundingClientRect();
  const ir = img.getBoundingClientRect();
  const cs = getComputedStyle(fig);
  out.figures.push({
    src: img.src.split('/').pop().split('?')[0],
    className: fig.className,
    figLeft: fr.left,
    figRight: fr.right,
    figWidth: fr.width,
    imgLeft: ir.left,
    imgRight: ir.right,
    imgWidth: ir.width,
    position: cs.position,
    float: cs.float,
    marginRight: cs.marginRight,
    viewportGap: clientWidth - fr.right,
    imgGap: clientWidth - ir.right
  });
}
return out;
"""


def main() -> int:
	port = free_port()
	server = start_php_server(port)
	driver = None
	try:
		driver = get_chrome_driver(headless=True)
		# Load once, then exercise the real resize/zoom path in both
		# directions. Re-loading this very tall page for every width made
		# the single-threaded PHP server the bottleneck, not the layout.
		driver.set_window_size(WIDTHS[0], 1000)
		driver.get(URL_TEMPLATE.format(port=port))
		WebDriverWait(driver, 45).until(lambda d: d.execute_script(WAIT_FOR_FIGURES))
		time.sleep(0.8)
		for width in WIDTHS + tuple(reversed(WIDTHS)):
			driver.set_window_size(width, 1000)
			WebDriverWait(driver, 30).until(lambda d: d.execute_script(WAIT_FOR_FIGURES))
			time.sleep(0.9)
			data = driver.execute_script(MEASURE)
			client = data["clientWidth"]
			inner = data["innerWidth"]

			check(
				data["scrollWidth"] <= client + 2,
				f"{width}px: no horizontal page overflow",
				f"scrollWidth={data['scrollWidth']} clientWidth={client}",
			)

			by_src = {f["src"]: f for f in data["figures"]}
			margin = by_src.get("warrenmcculloch_afflictor.jpg")
			floatfig = by_src.get("navy.png")

			check(margin is not None, f"{width}px: margin figure present")
			check(floatfig is not None, f"{width}px: float figure present")
			if not margin or not floatfig:
				continue

			for label, fig in (("margin figure", margin), ("float figure", floatfig)):
				check(
					fig["figRight"] <= client - MIN_GAP,
					f"{width}px: {label} right edge inside viewport",
					f"right={fig['figRight']:.1f} clientWidth={client} "
					f"gap={fig['viewportGap']:.1f}px",
				)
				check(
					fig["imgRight"] <= client - MIN_GAP,
					f"{width}px: {label} image inside viewport",
					f"imgRight={fig['imgRight']:.1f} gap={fig['imgGap']:.1f}px",
				)
				check(
					fig["figLeft"] >= -1,
					f"{width}px: {label} left edge not off-screen",
					f"left={fig['figLeft']:.1f}",
				)

			if inner >= 1100:
				check(
					"sideimage-inline" not in margin["className"],
					f"{width}px: margin figure stays in the right margin",
					f"class={margin['className']}",
				)
				check(
					margin["position"] == "absolute" or margin["float"] == "right",
					f"{width}px: margin figure uses margin/wrap geometry",
					f"position={margin['position']} float={margin['float']}",
				)
				check(
					"sideimage-inline" not in floatfig["className"],
					f"{width}px: float figure stays a float",
					f"class={floatfig['className']}",
				)
			else:
				check(
					"sideimage-inline" in margin["className"],
					f"{width}px: margin figure degrades to inline below 1100px",
					f"class={margin['className']}",
				)

			print(
				f"     [{width}px] inner={inner} client={client} "
				f"margin={margin['className']} float={floatfig['className']}"
			)
	finally:
		if driver is not None:
			driver.quit()
		server.terminate()
		try:
			server.wait(timeout=5)
		except subprocess.TimeoutExpired:
			server.kill()

	print(f"\n{checks - failures} passed, {failures} failed")
	return 1 if failures else 0


if __name__ == "__main__":
	sys.exit(main())
