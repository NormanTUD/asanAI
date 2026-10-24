# /// script
# requires-python = ">=3.11"
# dependencies = ["requests"]
# ///
"""
Regression tests for the blog reverse proxy's analytics integration.

Starts a throw-away remote blog server and a proxy server, logs into /stats
through the proxy, exercises filters/reset/source removal, CSV and SQLite
backup, checks the rewritten analytics endpoint, and forwards a final
section/event beacon through the proxy into the remote database.

Usage:
    uv run blog/tests/proxy_stats_test.py
"""

from __future__ import annotations

import html
import json
import os
import re
import socket
import sqlite3
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


def free_port() -> int:
	with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
		sock.bind(("127.0.0.1", 0))
		return int(sock.getsockname()[1])


def wait_for(url: str, session: requests.Session, timeout: float = 15.0) -> None:
	deadline = time.time() + timeout
	last = ""
	while time.time() < deadline:
		try:
			response = session.get(url, timeout=5)
			if response.status_code < 500:
				return
			last = f"HTTP {response.status_code}"
		except requests.RequestException as exc:
			last = str(exc)
		time.sleep(0.2)
	raise RuntimeError(f"server not ready: {last}")


def chips(page: str) -> list[str]:
	out = []
	for raw in re.findall(r'<span class="chip">(.*?)</span>', page, re.S):
		text = re.sub(r"<[^>]+>", " ", raw)
		text = re.sub(r"\s+", " ", html.unescape(text)).strip()
		if text:
			out.append(text)
	return out


def has_chip(items: list[str], prefix: str) -> bool:
	return any(item.startswith(prefix) for item in items)


def main() -> int:
	remote_port = free_port()
	proxy_port = free_port()
	remote_base = f"http://127.0.0.1:{remote_port}/"
	proxy_url = f"http://127.0.0.1:{proxy_port}/asanai_blog_proxy.php"
	stats_url = f"{proxy_url}?stats.php"

	with tempfile.TemporaryDirectory(prefix="asanai-proxy-stats-") as tmp:
		tmp_path = Path(tmp)
		db_path = tmp_path / "analytics.sqlite"
		password_path = tmp_path / "blogpassword"
		password_path.write_text("proxy-test-password\n", encoding="utf-8")
		password_path.chmod(0o400)

		remote_env = os.environ.copy()
		remote_env["MN_ANALYTICS_DB"] = str(db_path)
		remote_env["BLOG_STATS_PASSWORD_FILE"] = str(password_path)
		remote_env["MN_ANALYTICS_TEST_MODE"] = "1"

		proxy_env = os.environ.copy()
		proxy_env["ASANAI_BLOG_PROXY_REMOTE"] = remote_base

		remote = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{remote_port}", "-t", str(ROOT)],
			env=remote_env,
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		proxy = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{proxy_port}", "-t", str(ROOT)],
			env=proxy_env,
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		session = requests.Session()
		try:
			wait_for(stats_url, session)
			login_page = session.get(stats_url, timeout=15).text
			csrf_match = re.search(r'name="csrf" value="([a-f0-9]{64})"', login_page)
			check(bool(csrf_match), "proxy login page has CSRF token")
			if not csrf_match:
				return 1
			login = session.post(
				stats_url,
				data={
					"action": "login",
					"password": "proxy-test-password",
					"csrf": csrf_match.group(1),
				},
				timeout=20,
				allow_redirects=True,
			)
			check("Blog-Analytics" in login.text and 'id="hero"' in login.text, "stats login works through proxy")
			check("__MN_STATS_BASE__" not in login.text, "stats base placeholder is replaced")
			check("asanai_blog_proxy.php?stats.php" in login.text, "stats JS uses proxy base")
			check('name="__proxy_path" value="stats.php"' in login.text, "stats form keeps remote path")
			check(all(cookie.path == "/" for cookie in session.cookies), "proxy rewrites session cookie path")

			filtered_url = (
				f"{proxy_url}?stats.php?range=30&source=transformer"
				"&path=history&hour=15&weekday=6&day=2026-10-24&humans=1"
			)
			filtered = session.get(filtered_url, timeout=20)
			filter_chips = chips(filtered.text)
			check(has_chip(filter_chips, "Page:"), "proxy page chip")
			check(has_chip(filter_chips, "Source:"), "proxy source chip")
			check(has_chip(filter_chips, "Hour:"), "proxy hour chip")
			check(has_chip(filter_chips, "Weekday:"), "proxy weekday chip")
			check(has_chip(filter_chips, "Day:"), "proxy day chip")
			check(has_chip(filter_chips, "Humans only"), "proxy humans chip")

			remove_match = re.search(r'<a href="([^"]+)" aria-label="Remove source filter">', filtered.text)
			check(bool(remove_match), "proxy source-removal link")
			if remove_match:
				remove = session.get(urljoin(filtered_url, html.unescape(remove_match.group(1))), timeout=20)
				remove_chips = chips(remove.text)
				check(not has_chip(remove_chips, "Source:"), "proxy source removal clears source")
				check(has_chip(remove_chips, "Hour:"), "proxy source removal preserves hour")

			reset_match = re.search(r'<a class="chip"[^>]*href="([^"]+)"[^>]*>Reset all filters</a>', filtered.text)
			check(bool(reset_match), "proxy reset link")
			if reset_match:
				reset = session.get(urljoin(filtered_url, html.unescape(reset_match.group(1))), timeout=20)
				check(chips(reset.text) == [], "proxy reset clears all chips")

			form_url = (
				f"{proxy_url}?__proxy_path=stats.php&range=30&day=&weekday=0&hour="
				"&humans=&path=history&ref_type=&source=&ref_path=&browser=&os=&device="
			)
			form = session.get(form_url, timeout=20)
			form_chips = chips(form.text)
			check(has_chip(form_chips, "Page:"), "proxy GET form keeps page")
			check(not has_chip(form_chips, "Source:"), "proxy GET form clears source")

			csrf_dashboard = re.search(r'name="csrf" value="([a-f0-9]{64})"', filtered.text)
			check(bool(csrf_dashboard), "dashboard CSRF token for exports")
			if csrf_dashboard:
				export = session.post(
					f"{proxy_url}?stats.php?range=30",
					data={"action": "export", "csrf": csrf_dashboard.group(1)},
					timeout=20,
				)
				check(export.status_code == 200 and "text/csv" in export.headers.get("content-type", ""), "CSV export through proxy", f"{export.status_code} {export.headers.get('content-type')}")
				backup = session.post(
					f"{proxy_url}?stats.php?range=30",
					data={"action": "backup", "csrf": csrf_dashboard.group(1)},
					timeout=20,
				)
				check(backup.status_code == 200 and backup.content.startswith(b"SQLite format 3\x00"), "SQLite backup through proxy", f"{backup.status_code} {backup.headers.get('content-type')}")

			public_session = requests.Session()
			public = public_session.get(f"{proxy_url}?index.php", timeout=30)
			check(public.status_code == 200 and "Fatal error" not in public.text, "public page through proxy")
			check('"endpoint":"asanai_blog_proxy.php?track.php"' in public.text, "analytics endpoint rewritten through proxy")
			check('"endpoint":"asanai_blog_proxy.php?feedback_track.php"' in public.text, "feedback endpoint rewritten through proxy")
			feedback_cfg_match = re.search(r"window\.__MNFeedback=(\{.*?\});</script>", public.text, re.S)
			check(bool(feedback_cfg_match), "public page exposes feedback config")
			if feedback_cfg_match:
				try:
					feedback_cfg = json.loads(feedback_cfg_match.group(1))
				except json.JSONDecodeError:
					feedback_cfg = {}
				feedback_endpoint = str(feedback_cfg.get("endpoint") or "")
				check(feedback_endpoint.endswith("feedback_track.php"), "feedback config points at the proxy", feedback_endpoint)
				if feedback_endpoint:
					feedback_response = public_session.post(
						f"http://127.0.0.1:{proxy_port}/" + feedback_endpoint,
						data=json.dumps({
							"token": feedback_cfg.get("token", ""),
							"request_id": "feedfacefeedfacefeedfacefeedface",
							"path": "history",
							"reaction": "helpful",
							"comment": "Proxy feedback test",
							"selection": {"text": "proxy passage", "start": 1, "end": 14},
						}),
						headers={"Content-Type": "application/json"},
						timeout=20,
					)
					try:
						feedback_json = feedback_response.json()
					except ValueError:
						feedback_json = {}
					check(feedback_response.status_code == 200 and feedback_json.get("ok") is True, "feedback submission through proxy", f"{feedback_response.status_code} {feedback_response.text[:120]}")
					if db_path.is_file():
						with sqlite3.connect(db_path) as db:
							feedback_count = db.execute("SELECT COUNT(*) FROM block_feedback WHERE comment = 'Proxy feedback test'").fetchone()[0]
						check(feedback_count == 1, "feedback reached remote DB through proxy", str(feedback_count))
			token_match = re.search(r'"token":"([a-f0-9]{32})"', public.text)
			check(bool(token_match), "public page exposes ephemeral pageview token")
			if token_match:
				track = public_session.post(
					f"{proxy_url}?track.php",
					data=json.dumps({
						"event": "leave",
						"token": token_match.group(1),
						"duration": 9,
						"scroll": 80,
						"sections": [{"i": 0, "k": "intro", "l": "Intro", "v": 100, "d": 5}],
						"events": [{"type": "external_link", "target": "example.com", "value": 1}],
					}),
					headers={"Content-Type": "application/json"},
					timeout=20,
				)
				check(track.status_code == 204, "track beacon through proxy", str(track.status_code))
				if db_path.is_file():
					with sqlite3.connect(db_path) as db:
						section_count = db.execute("SELECT COUNT(*) FROM pageview_sections").fetchone()[0]
						event_count = db.execute("SELECT COUNT(*) FROM pageview_events").fetchone()[0]
						external = db.execute("SELECT COUNT(*) FROM pageview_events WHERE kind='external_link' AND target='example.com'").fetchone()[0]
					check(section_count >= 1, "section detail reached remote DB", str(section_count))
					check(event_count >= 1 and external >= 1, "event detail reached remote DB", f"{event_count}/{external}")
		finally:
			session.close()
			for proc in (proxy, remote):
				proc.terminate()
				try:
					proc.wait(timeout=5)
				except subprocess.TimeoutExpired:
					proc.kill()

	print()
	print(f"{checks} checks, {failures} failure(s)")
	return 0 if failures == 0 else 1


if __name__ == "__main__":
	raise SystemExit(main())
