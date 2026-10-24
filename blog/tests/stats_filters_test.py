# /// script
# requires-python = ">=3.11"
# dependencies = ["requests"]
# ///
"""
Regression tests for the password-protected stats filters.

Runs a temporary PHP server with a throw-away SQLite database and password
file, logs in over HTTP, then checks that filter chips and reset/source-removal
links reflect the actual query string. This specifically guards against the
old variable-shadowing bug where `$source` / `$hour` / `$day` were overwritten
by later dashboard loops.

Usage:
    uv run blog/tests/stats_filters_test.py
"""

from __future__ import annotations

import html
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import urljoin

import requests


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


def find_free_port() -> int:
	with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
		sock.bind(("127.0.0.1", 0))
		return int(sock.getsockname()[1])


def wait_for(url: str, session: requests.Session, timeout: float = 15.0) -> None:
	deadline = time.time() + timeout
	last_error = ""
	while time.time() < deadline:
		try:
			response = session.get(url, timeout=5)
			if response.status_code < 500:
				return
			last_error = f"HTTP {response.status_code}"
		except requests.RequestException as exc:
			last_error = str(exc)
		time.sleep(0.2)
	raise RuntimeError(f"PHP server did not become ready: {last_error}")


def visible_chips(page: str) -> list[str]:
	chips = []
	for raw in re.findall(r'<span class="chip">(.*?)</span>', page, re.S):
		text = re.sub(r"<[^>]+>", " ", raw)
		text = re.sub(r"\s+", " ", html.unescape(text)).strip()
		if text:
			chips.append(text)
	return chips


def has_chip(chips: list[str], prefix: str) -> bool:
	return any(chip.startswith(prefix) for chip in chips)


def main() -> int:
	port = find_free_port()
	base = f"http://127.0.0.1:{port}/stats.php"
	with tempfile.TemporaryDirectory(prefix="asanai-stats-filters-") as tmp:
		tmp_path = Path(tmp)
		db_path = tmp_path / "analytics.sqlite"
		password_path = tmp_path / "blogpassword"
		password_path.write_text("filter-test-password\n", encoding="utf-8")
		password_path.chmod(0o400)

		env = os.environ.copy()
		env["MN_ANALYTICS_DB"] = str(db_path)
		env["BLOG_STATS_PASSWORD_FILE"] = str(password_path)
		env["MN_ANALYTICS_TEST_MODE"] = "1"

		server = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{port}", "-t", str(ROOT)],
			env=env,
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		session = requests.Session()
		try:
			wait_for(base, session)
			login_page = session.get(base, timeout=10).text
			csrf_match = re.search(r'name="csrf" value="([a-f0-9]{64})"', login_page)
			check(bool(csrf_match), "login page has CSRF token")
			if not csrf_match:
				return 1

			login = session.post(
				base,
				data={
					"action": "login",
					"password": "filter-test-password",
					"csrf": csrf_match.group(1),
				},
				timeout=15,
				allow_redirects=True,
			)
			check("Blog-Analytics" in login.text and 'id="hero"' in login.text, "login reaches dashboard")
			if failures:
				return 1

			filtered_url = (
				f"{base}?range=30&source=transformer&path=history"
				"&hour=15&weekday=6&day=2026-10-24&humans=1"
			)
			filtered = session.get(filtered_url, timeout=15)
			chips = visible_chips(filtered.text)
			check(has_chip(chips, "Page:"), "page chip is rendered", str(chips))
			check(has_chip(chips, "Source:"), "source chip is rendered", str(chips))
			check(has_chip(chips, "Hour:"), "hour chip is rendered", str(chips))
			check(has_chip(chips, "Weekday:"), "weekday chip is rendered", str(chips))
			check(has_chip(chips, "Day:"), "day chip is rendered", str(chips))
			check(has_chip(chips, "Humans only"), "humans chip is rendered", str(chips))

			without_source = session.get(f"{base}?range=30&path=history&hour=15", timeout=15)
			chips = visible_chips(without_source.text)
			check(has_chip(chips, "Page:"), "page chip survives source removal", str(chips))
			check(has_chip(chips, "Hour:"), "hour chip survives source removal", str(chips))
			check(not has_chip(chips, "Source:"), "source chip is absent without source", str(chips))
			check(not has_chip(chips, "Weekday:"), "weekday chip is absent without weekday", str(chips))
			check(not has_chip(chips, "Day:"), "day chip is absent without day", str(chips))
			check(not has_chip(chips, "Humans only"), "humans chip is absent without humans=1", str(chips))

			no_filters = session.get(f"{base}?range=30", timeout=15)
			chips = visible_chips(no_filters.text)
			check(chips == [], "range-only URL has no filter chips", str(chips))

			hour_zero = session.get(f"{base}?range=30&hour=0", timeout=15)
			check(has_chip(visible_chips(hour_zero.text), "Hour: 00:00"), "hour=0 is a valid filter")

			# Follow the actual source-removal link from the rendered page.
			remove_match = re.search(
				r'<a href="([^"]+)" aria-label="Remove source filter">',
				filtered.text,
			)
			check(bool(remove_match), "source-removal link exists")
			if remove_match:
				remove_url = urljoin(filtered_url, html.unescape(remove_match.group(1)))
				after_remove = session.get(remove_url, timeout=15)
				chips = visible_chips(after_remove.text)
				check(not has_chip(chips, "Source:"), "source link removes source chip", str(chips))
				check(has_chip(chips, "Hour:"), "source link preserves other filters", str(chips))

			# Follow the Reset all filters link.
			reset_match = re.search(r'<a class="chip"[^>]*href="([^"]+)"[^>]*>Reset all filters</a>', filtered.text)
			check(bool(reset_match), "reset-all link exists")
			if reset_match:
				reset_url = urljoin(filtered_url, html.unescape(reset_match.group(1)))
				after_reset = session.get(reset_url, timeout=15)
				check(visible_chips(after_reset.text) == [], "reset-all link clears every filter chip")

			# Simulate the GET form with an empty source field and the hidden fields.
			form_url = (
				f"{base}?__proxy_path=__MN_STATS_BASE_PATH__&range=30&day="
				"&weekday=0&hour=&humans=&path=history&ref_type=&source="
				"&ref_path=&browser=&os=&device="
			)
			after_form = session.get(form_url, timeout=15)
			chips = visible_chips(after_form.text)
			check(has_chip(chips, "Page:"), "empty-source form keeps page filter", str(chips))
			check(not has_chip(chips, "Source:"), "empty-source form removes source", str(chips))
			check(not has_chip(chips, "Hour:"), "empty-source form does not resurrect hour", str(chips))

			# A filtered URL must never resurrect stale source/hour/day values.
			stale = session.get(f"{base}?range=30&path=history", timeout=15)
			chips = visible_chips(stale.text)
			check(not any(chip.startswith(("Source:", "Hour:", "Day:", "Weekday:", "Humans only")) for chip in chips), "no stale filter chips", str(chips))
		finally:
			session.close()
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
