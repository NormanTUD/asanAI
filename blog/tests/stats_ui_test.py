# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""
Browser regression test for the stats Overview modes, lazy charts, Compare
tab, saved-view manager, Present/Light modes and mobile overflow.

Uses a temporary SQLite database seeded with synthetic anonymous pageviews.
No production data is touched.

Usage:
    uv run blog/tests/stats_ui_test.py
"""

from __future__ import annotations

import os
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
from datetime import datetime, timedelta
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
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
		"--window-size=1440,1000",
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


def seed(db_path: Path) -> None:
	env = os.environ.copy()
	env["MN_ANALYTICS_DB"] = str(db_path)
	env["MN_ANALYTICS_TEST_MODE"] = "1"
	subprocess.run(
		["php", "-r", "require 'lib/analytics.php'; mn_analytics_open_db();"],
		cwd=str(ROOT),
		env=env,
		check=True,
	)
	now = datetime.now()
	rows = []
	for index in range(14):
		day = (now - timedelta(days=index % 7)).strftime("%Y-%m-%d")
		hour = 9 + (index % 10)
		path = ["history", "attentionlab", "intuition", "math_i"][index % 4]
		ref_type = ["direct", "search", "internal", "social"][index % 4]
		ref_path = "history" if ref_type == "internal" else ""
		source = "google" if ref_type == "search" else ("example.com" if ref_type == "social" else "")
		device = ["desktop", "mobile", "tablet"][index % 3]
		browser = ["Chrome", "Safari", "Firefox"][index % 3]
		os_name = ["Linux", "iOS", "Windows"][index % 3]
		ts = int((now - timedelta(days=index % 7, hours=index % 4)).timestamp())
		rows.append((ts, day, hour, path, ref_type, source, "", ref_path, browser, 131, os_name, "test", device, 0, "", 40 + index, 60 + index, 1, ""))
	with sqlite3.connect(db_path) as db:
		db.executemany(
			"INSERT INTO pageviews (ts, day, hour, path, ref_type, ref_source, ref_host, ref_path, browser, browser_major, os, os_version, device, is_bot, bot_reason, duration_sec, scroll_pct, completed, token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
			rows,
		)
		ids = [row[0] for row in db.execute("SELECT id FROM pageviews ORDER BY id LIMIT 5")]
		for pageview_id in ids:
			for section in range(3):
				db.execute(
					"INSERT OR IGNORE INTO pageview_sections (pageview_id,path,section_index,section_key,section_label,visible_pct,dwell_sec) VALUES (?,?,?,?,?,?,?)",
					(pageview_id, "history", section, f"section-{section}", f"Section {section + 1}", 100 - section * 20, 10 - section),
				)
		for pageview_id in ids[:3]:
			db.execute(
				"INSERT OR IGNORE INTO pageview_events (pageview_id,path,kind,target,value) VALUES (?,?,?,?,?)",
				(pageview_id, "history", "internal_link", "intuition", 1),
			)
			db.execute(
				"INSERT OR IGNORE INTO pageview_events (pageview_id,path,kind,target,value) VALUES (?,?,?,?,?)",
				(pageview_id, "history", "quiz_answer", "history-cp1:0", 1),
			)
		feedback_rows = [
			("seed-feedback-bug", "history", "bug", "Chart stays blank on mobile."),
			("seed-feedback-confusing", "attentionlab", "confusing", "Too much math before the intuition."),
			("seed-feedback-helpful", "intuition", "helpful", "The example made it click."),
		]
		for request_id, path, reaction, comment in feedback_rows:
			ts = int((now - timedelta(hours=1)).timestamp())
			db.execute(
				"INSERT INTO block_feedback (request_id, ts, day, path, reaction, comment, status) VALUES (?,?,?,?,?,?,?)",
				(request_id, ts, now.strftime("%Y-%m-%d"), path, reaction, comment, "new"),
			)
		db.commit()


def seed_questions(db_path: Path) -> None:
	with sqlite3.connect(db_path) as db:
		db.execute(
			"CREATE TABLE rag_queries ("
			"id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, day TEXT NOT NULL, "
			"question TEXT NOT NULL, answer TEXT NOT NULL, lang TEXT NOT NULL, "
			"grounded INTEGER NOT NULL DEFAULT 0, cached INTEGER NOT NULL DEFAULT 0, "
			"semantic INTEGER NOT NULL DEFAULT 0, model TEXT NOT NULL, query_en TEXT, "
			"sources TEXT, queue_seconds REAL, generation_seconds REAL, error TEXT)"
		)
		now = int(time.time())
		db.executemany(
			"INSERT INTO rag_queries (ts, day, question, answer, lang, grounded, cached, "
			"semantic, model, query_en, sources, queue_seconds, generation_seconds, error) "
			"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			[
				(
					now,
					time.strftime("%Y-%m-%d"),
					"what is a perceptron?",
					"A **perceptron** is a *linear* classifier [S1].\n\n"
					"![Portrait](frank_rosenblatt_portrait.jpg)",
					"en",
					1,
					0,
					0,
					"qwen2.5:1.5b",
					"what is a perceptron?",
					'[{"id":"S1","title":"Brief History of AI","heading":"The Perceptron","url":"history#the-perceptron"}]',
					0.0,
					12.5,
					"",
				),
				(
					now - 60,
					time.strftime("%Y-%m-%d"),
					"how does backpropagation work?",
					"Backpropagation [cached answer].",
					"en",
					1,
					1,
					0,
					"qwen2.5:1.5b",
					"how does backpropagation work?",
					"[]",
					0.0,
					0.0,
					"",
				),
			],
		)


def seed_answer_cache(db_path: Path) -> None:
	with sqlite3.connect(db_path) as db:
		db.execute(
			"CREATE TABLE answers (key TEXT PRIMARY KEY, answer TEXT, grounded INTEGER, "
			"sources TEXT, lang TEXT, query_en TEXT, created INTEGER, "
			"embedding BLOB, history_hash TEXT)"
		)
		db.execute(
			"INSERT INTO answers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			("seed-key", "cached answer", 1, "[]", "en", "cached", int(time.time()), None, ""),
		)


def main() -> int:
	port = free_port()
	base = f"http://127.0.0.1:{port}/stats.php"
	with tempfile.TemporaryDirectory(prefix="asanai-stats-ui-") as tmp:
		tmp_path = Path(tmp)
		db_path = tmp_path / "analytics.sqlite"
		password_path = tmp_path / "blogpassword"
		password_path.write_text("ui-test-password\n", encoding="utf-8")
		password_path.chmod(0o400)
		seed(db_path)
		questions_db = tmp_path / "queries.sqlite"
		seed_questions(questions_db)
		cache_db = tmp_path / "cache.sqlite"
		seed_answer_cache(cache_db)

		env = os.environ.copy()
		env["MN_ANALYTICS_DB"] = str(db_path)
		env["ASANAI_RAG_QUERIES_DB"] = str(questions_db)
		env["ASANAI_RAG_CACHE"] = str(cache_db)
		env["BLOG_STATS_PASSWORD_FILE"] = str(password_path)
		env["MN_ANALYTICS_DISABLED"] = "1"
		server = subprocess.Popen(
			["php", "-S", f"127.0.0.1:{port}", "-t", str(ROOT)],
			env=env,
			stdout=subprocess.DEVNULL,
			stderr=subprocess.DEVNULL,
		)
		browser = None
		try:
			time.sleep(1)
			browser = driver()
			browser.get(base)
			WebDriverWait(browser, 15).until(EC.presence_of_element_located((By.ID, "password")))
			browser.find_element(By.ID, "password").send_keys("ui-test-password")
			browser.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
			WebDriverWait(browser, 25).until(EC.presence_of_element_located((By.ID, "hero")))
			time.sleep(1.5)

			check(browser.execute_script("return document.body.classList.contains('overview-briefing')"), "default mode is briefing")
			check(browser.find_element(By.ID, "story-cards").is_displayed(), "story cards visible")
			priorities = browser.find_element(By.ID, "priorities")
			check(priorities.is_displayed(), "priorities card visible in briefing")
			priorities_text = priorities.text
			check("Brief History of AI" in priorities_text and "bug" in priorities_text.lower(), "priorities list surfaces open bugs", priorities_text)
			check("Read feedback" in priorities_text, "priorities list links to triage")
			check(not browser.find_element(By.ID, "overview").is_displayed(), "KPI grid hidden in briefing")
			briefing_charts = browser.execute_script("return document.querySelectorAll('.chart canvas').length")
			check(briefing_charts <= 4, "briefing initializes at most four charts", str(briefing_charts))
			browser.find_element(By.CSS_SELECTOR, '[data-overview-mode="explore"]').click()
			time.sleep(1.5)
			explore_charts = browser.execute_script("return document.querySelectorAll('.chart canvas').length")
			check(explore_charts > briefing_charts, "explore initializes more charts", f"{briefing_charts} -> {explore_charts}")
			check(browser.find_element(By.ID, "overview").is_displayed(), "KPI grid visible in explore")
			browser.find_element(By.CSS_SELECTOR, '[data-tab="pages"]').click()
			time.sleep(0.5)
			check(len(browser.find_elements(By.CSS_SELECTOR, "#chart-pages canvas")) == 1, "pages chart initializes on tab activation")
			browser.find_element(By.CSS_SELECTOR, '[data-tab="referrers"]').click()
			time.sleep(0.5)
			check(len(browser.find_elements(By.CSS_SELECTOR, "#chart-transition-matrix canvas")) == 1, "transition matrix initializes on tab activation")

			browser.find_element(By.CSS_SELECTOR, '[data-tab="compare"]').click()
			time.sleep(0.5)
			check(browser.find_element(By.ID, "compare-tab").is_displayed(), "compare tab visible")
			check(len(browser.find_elements(By.CSS_SELECTOR, "#compare-tab .compare-row--detail")) >= 5, "previous comparison rows")
			browser.get(base + "?cmp_mode=entity&cmp_kind=path&cmp_a=history&cmp_b=attentionlab")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))
			browser.find_element(By.CSS_SELECTOR, '[data-tab="compare"]').click()
			time.sleep(0.5)
			check("Brief History of AI" in browser.find_element(By.CSS_SELECTOR, "#compare-tab .compare-head").text, "entity compare labels")
			browser.get(base + "?cmp_mode=range&cmp_from_a=2026-10-01&cmp_to_a=2026-10-14&cmp_from_b=2026-09-01&cmp_to_b=2026-09-14")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))
			browser.find_element(By.CSS_SELECTOR, '[data-tab="compare"]').click()
			time.sleep(0.5)
			check("2026-10-01" in browser.find_element(By.CSS_SELECTOR, "#compare-tab .compare-head").text, "range compare labels")

			browser.find_element(By.CSS_SELECTOR, '[data-tab="overview"]').click()
			time.sleep(0.3)
			cohort_rows = browser.find_elements(By.CSS_SELECTOR, '#cohorts .filter-row[data-filter-kind="device"]')
			check(bool(cohort_rows), "cohort filter rows exist")
			if cohort_rows:
				cohort_rows[0].click()
				WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))
				time.sleep(0.5)
				check("Device:" in browser.find_element(By.CSS_SELECTOR, ".chips").text, "cohort row applies device filter")
				browser.execute_script("document.querySelector('[data-reset-filters]').click()")
				WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))
				time.sleep(0.5)
				check(not browser.find_elements(By.CSS_SELECTOR, ".chip"), "reset clears cross-filter chips")

			browser.execute_script("localStorage.setItem('mn_stats_views', JSON.stringify([{name:'Seed',query:'range=30'}])); location.reload();")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))
			time.sleep(0.5)
			browser.find_element(By.ID, "manage-views").click()
			time.sleep(0.2)
			check(browser.execute_script("return document.getElementById('saved-views-dialog').open"), "saved-view manager opens")
			rows = browser.find_elements(By.CSS_SELECTOR, ".saved-view-row")
			check(len(rows) == 1, "saved view loaded")
			if rows:
				inputs = rows[0].find_elements(By.TAG_NAME, "input")
				inputs[0].clear()
				inputs[0].send_keys("Renamed")
				buttons = rows[0].find_elements(By.TAG_NAME, "button")
				if len(buttons) >= 2:
					buttons[1].click()
					time.sleep(0.2)
					check(browser.find_elements(By.CSS_SELECTOR, ".saved-view-row input")[0].get_attribute("value") == "Renamed", "saved view rename")
					rows = browser.find_elements(By.CSS_SELECTOR, ".saved-view-row")
					buttons = rows[0].find_elements(By.TAG_NAME, "button")
					if len(buttons) >= 3:
						buttons[2].click()
						time.sleep(0.2)
						check("No saved views yet." in browser.find_element(By.ID, "saved-views-list").text, "saved view delete")
			browser.execute_script("document.getElementById('saved-views-dialog').close()")

			browser.find_element(By.CSS_SELECTOR, '[data-tab="overview"]').click()
			time.sleep(0.3)
			browser.find_element(By.ID, "present-toggle").click()
			time.sleep(0.5)
			check(browser.execute_script("return document.body.classList.contains('present')"), "present mode opens")
			browser.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
			time.sleep(0.3)
			check(not browser.execute_script("return document.body.classList.contains('present')"), "present mode exits")
			browser.find_element(By.ID, "theme-toggle").click()
			time.sleep(0.4)
			check(browser.execute_script("return document.body.classList.contains('light')"), "light mode opens")
			browser.find_element(By.ID, "theme-toggle").click()
			time.sleep(0.3)

			browser.get(f"http://127.0.0.1:{port}/questions.php")
			WebDriverWait(browser, 15).until(
				EC.presence_of_element_located((By.CSS_SELECTOR, ".card"))
			)
			check("what is a perceptron?" in browser.find_element(By.TAG_NAME, "main").text,
				"course questions admin lists logged questions")
			check("Brief History of AI" in browser.find_element(By.TAG_NAME, "main").text,
				"course questions admin shows sources")
			check(bool(browser.find_elements(By.CSS_SELECTOR, ".card .a strong")),
				"course questions renders answer markdown")
			check(bool(browser.find_elements(By.CSS_SELECTOR, ".card .a em")),
				"course questions renders answer emphasis")
			check("**" not in browser.find_element(By.CSS_SELECTOR, ".card .a").text,
				"course questions leaves no markdown asterisks")
			check(bool(browser.find_elements(By.CSS_SELECTOR, ".card .a .answer-image")),
				"course questions renders answer images")

			browser.find_element(By.XPATH, "//button[contains(., 'Clear answer cache')]").click()
			WebDriverWait(browser, 10).until(
				EC.presence_of_element_located((By.CSS_SELECTOR, ".flash"))
			)
			check("Cleared 1 cached answer" in browser.find_element(By.CSS_SELECTOR, ".flash").text,
				"course questions clears the answer cache")
			with sqlite3.connect(cache_db) as db:
				check(db.execute("SELECT COUNT(*) FROM answers").fetchone()[0] == 0,
					"answer cache is empty after clearing")

			browser.find_element(By.XPATH, "//button[contains(., 'Delete cached log entries')]").click()
			WebDriverWait(browser, 10).until(
				EC.presence_of_element_located((By.CSS_SELECTOR, ".flash"))
			)
			check("Deleted 1 cached log entry" in browser.find_element(By.CSS_SELECTOR, ".flash").text,
				"course questions deletes cached log entries")
			main_text = browser.find_element(By.TAG_NAME, "main").text
			check("backpropagation" not in main_text and "perceptron" in main_text,
				"cached log deletion leaves uncached questions")

			browser.find_element(By.XPATH,
				"//article[contains(., 'what is a perceptron?')]//button[contains(., 'Delete this question')]"
			).click()
			WebDriverWait(browser, 10).until(
				EC.presence_of_element_located((By.CSS_SELECTOR, ".flash"))
			)
			check("Question deleted" in browser.find_element(By.CSS_SELECTOR, ".flash").text,
				"course questions deletes a single question")
			check("No questions match these filters." in browser.find_element(By.TAG_NAME, "main").text,
				"question log is empty after deleting the last row")

			severe = [entry for entry in browser.get_log("browser") if entry.get("level") == "SEVERE"]
			check(not severe, "no severe console errors", str(severe))
			check(not browser.execute_script("return document.documentElement.scrollWidth > document.documentElement.clientWidth"), "no overflow at 1440")
			browser.set_window_size(390, 900)
			time.sleep(0.7)
			check(not browser.execute_script("return document.documentElement.scrollWidth > document.documentElement.clientWidth"), "no overflow at 390")
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
