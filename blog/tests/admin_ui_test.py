# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""
Browser regression test for the unified admin presentation and reader-feedback
dashboard.

It boots a temporary PHP server with a throw-away SQLite database, logs in with
the shared admin session, then exercises:

  * global analytics search results
  * presentation slides, keyboard navigation, overview and URL state
  * the shared card styling for quotes, signals and takeaways
  * reader-feedback tabs, search, details, prompt generation, editing,
    status changes, bug context and deletion

Usage:
    uv run blog/tests/admin_ui_test.py
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
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select, WebDriverWait
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
	for index in range(16):
		day = (now - timedelta(days=index % 7)).strftime("%Y-%m-%d")
		hour = 9 + (index % 10)
		path = ["history", "attentionlab", "intuition", "math_i"][index % 4]
		ref_type = ["direct", "search", "internal", "social", "external"][index % 5]
		ref_path = "history" if ref_type == "internal" else ""
		source = (
			"google"
			if ref_type == "search"
			else ("example.com" if ref_type in ("social", "external") else "")
		)
		device = ["desktop", "mobile", "tablet"][index % 3]
		browser = ["Chrome", "Safari", "Firefox"][index % 3]
		os_name = ["Linux", "iOS", "Windows"][index % 3]
		ts = int((now - timedelta(days=index % 7, hours=index % 4)).timestamp())
		rows.append(
			(
				ts,
				day,
				hour,
				path,
				ref_type,
				source,
				"example.com" if ref_type in ("social", "external") else "",
				ref_path,
				browser,
				131,
				os_name,
				"test",
				device,
				0,
				"",
				40 + index,
				55 + index,
				1,
				"",
			)
		)
	with sqlite3.connect(db_path) as db:
		db.executemany(
			"INSERT INTO pageviews (ts, day, hour, path, ref_type, ref_source, ref_host, ref_path, browser, browser_major, os, os_version, device, is_bot, bot_reason, duration_sec, scroll_pct, completed, token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
			rows,
		)
		pageview_ids = [
			int(row[0])
			for row in db.execute("SELECT id FROM pageviews ORDER BY id LIMIT 6")
		]
		for pageview_id in pageview_ids:
			for section in range(3):
				db.execute(
					"INSERT OR IGNORE INTO pageview_sections (pageview_id,path,section_index,section_key,section_label,visible_pct,dwell_sec) VALUES (?,?,?,?,?,?,?)",
					(
						pageview_id,
						"history",
						section,
						f"section-{section}",
						["Eine Frage", "Der Geist im Kopf", "Verlässlichkeit"][section],
						100 - section * 20,
						10 - section,
					),
				)
		for pageview_id in pageview_ids[:3]:
			db.execute(
				"INSERT OR IGNORE INTO pageview_events (pageview_id,path,kind,target,value) VALUES (?,?,?,?,?)",
				(pageview_id, "history", "internal_link", "intuition", 1),
			)
			db.execute(
				"INSERT OR IGNORE INTO pageview_events (pageview_id,path,kind,target,value) VALUES (?,?,?,?,?)",
				(pageview_id, "history", "quiz_answer", "history-cp1:0", 1),
			)

		feedback_rows = [
			(
				"request-helpful",
				"history",
				"Brief History of AI",
				"Eine Frage",
				"Der Geist ist ein Gespenst.",
				"The worked example made backprop click.",
				"reader@example.test",
				"helpful",
				"new",
			),
			(
				"request-confusing",
				"attentionlab",
				"Attention",
				"Aufmerksamkeit",
				"Ein Query sucht nach Relevanz.",
				"Too much math before the intuition.",
				"",
				"confusing",
				"accepted",
			),
			(
				"request-bug",
				"history",
				"Brief History of AI",
				"Eine Frage",
				"Der Geist ist ein Gespenst.",
				"Chart stays blank on mobile.",
				"",
				"bug",
				"new",
			),
			(
				"request-done",
				"history",
				"Brief History of AI",
				"Eine Frage",
				"Der Geist ist ein Gespenst.",
				"Loved the McCulloch story.",
				"",
				"helpful",
				"done",
			),
		]
		for index, (
			request_id,
			path,
			lesson_title,
			section_title,
			block_text,
			comment,
			email,
			reaction,
			status,
		) in enumerate(feedback_rows):
			ts = int((now - timedelta(hours=index)).timestamp())
			feedback_id = db.execute(
				"INSERT INTO block_feedback (request_id, ts, day, path, lesson_title, part, part_title, block_index, block_key, block_selector, section_title, section_anchor, block_text, block_html, reaction, comment, email, status, admin_note, admin_prompt, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
				(
					request_id,
					ts,
					(now - timedelta(hours=index)).strftime("%Y-%m-%d"),
					path,
					lesson_title,
					2,
					"Geschichte",
					index + 1,
					f"block-{index + 1}",
					f".block-{index + 1}",
					section_title,
					"section",
					block_text,
					f"<p>{block_text}</p>",
					reaction,
					comment,
					email,
					status,
					"",
					"",
					ts,
					ts,
				),
			).lastrowid
			db.execute(
				"INSERT INTO feedback_selections (feedback_id, selected_text, selected_html, start_offset, end_offset, prefix, suffix, block_text_length, range_count, direction, selection_rect_json, block_rect_json, scroll_y, viewport_w, viewport_h, source_file, source_mtime) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
				(
					feedback_id,
					block_text,
					f"<em>{block_text}</em>",
					10,
					42,
					"",
					"",
					len(block_text),
					1,
					"forward",
					"{}",
					"{}",
					0,
					1440,
					1000,
					f"blog/{path}.php",
					0,
				),
			)
			db.execute(
				"INSERT INTO feedback_history (feedback_id, ts, action, from_status, to_status, note) VALUES (?,?,?,?,?,?)",
				(feedback_id, ts, "created", "", "new", reaction),
			)
			if reaction == "bug":
				db.execute(
					"INSERT INTO feedback_bug_context (feedback_id, consent, user_agent, url, viewport, console_logs_json, last_clicks_json, last_error_json, captured_at) VALUES (?,?,?,?,?,?,?,?,?)",
					(
						feedback_id,
						1,
						"Mozilla/5.0 test",
						f"https://example.test/{path}",
						"390x844",
						'[{"level":"error","message":"chart is undefined"}]',
						'[{"target":"#chart","kind":"click"}]',
						'{"message":"chart is undefined"}',
						ts,
					),
				)
		db.commit()


def login(browser: webdriver.Chrome, base: str) -> None:
	browser.get(base)
	WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "password")))
	browser.find_element(By.ID, "password").send_keys("admin-ui-test-password")
	browser.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
	WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))


def main() -> int:
	port = free_port()
	stats_url = f"http://127.0.0.1:{port}/stats.php"
	feedback_url = f"http://127.0.0.1:{port}/feedback.php?embed=1"
	with tempfile.TemporaryDirectory(prefix="asanai-admin-ui-") as tmp:
		tmp_path = Path(tmp)
		db_path = tmp_path / "analytics.sqlite"
		password_path = tmp_path / "blogpassword"
		password_path.write_text("admin-ui-test-password\n", encoding="utf-8")
		password_path.chmod(0o400)
		seed(db_path)

		env = os.environ.copy()
		env["MN_ANALYTICS_DB"] = str(db_path)
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
			login(browser, stats_url)

			# Global analytics search.
			browser.get(f"{stats_url}?q=backprop")
			WebDriverWait(browser, 20).until(
				EC.presence_of_element_located((By.ID, "search-results"))
			)
			check("backprop" in browser.find_element(By.ID, "search-results").text, "analytics search finds feedback")
			check(
				bool(browser.find_elements(By.CSS_SELECTOR, "#search-results mark")),
				"analytics search highlights matches",
			)

			# Presentation deck.
			browser.get(stats_url)
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.ID, "hero")))
			browser.find_element(By.ID, "present-toggle").click()
			presentation = WebDriverWait(browser, 20).until(
				EC.visibility_of_element_located((By.ID, "mn-present"))
			)
			check("is-open" in presentation.get_attribute("class"), "presentation opens")
			slides = browser.find_elements(By.CSS_SELECTOR, "#mn-present .mn-pres-slide")
			check(len(slides) >= 8, "presentation renders enough slides", str(len(slides)))
			check(
				browser.find_element(By.ID, "mn-present").get_attribute("data-slide-total") == str(len(slides)),
				"presentation exposes slide total",
			)
			check(
				"full dashboard is behind this presentation" not in presentation.text,
				"removed stale presentation copy",
			)
			check(
				bool(browser.find_elements(By.CSS_SELECTOR, "#mn-present .mn-pres-quote.mn-pres-card")),
				"reader quotes use the shared card",
			)
			check(
				bool(browser.find_elements(By.CSS_SELECTOR, "#mn-present .mn-pres-takeaway.mn-pres-card")),
				"takeaways use the shared card",
			)
			card_styles = browser.execute_script(
				"""
				var quote = document.querySelector('#mn-present .mn-pres-quote.mn-pres-card');
				var takeaway = document.querySelector('#mn-present .mn-pres-takeaway.mn-pres-card');
				if (!quote || !takeaway) return null;
				function picked(el) {
					var s = getComputedStyle(el);
					return [s.borderRadius, s.paddingTop, s.borderTopWidth, s.borderTopStyle];
				}
				return { quote: picked(quote), takeaway: picked(takeaway) };
				"""
			)
			check(
				card_styles is not None and card_styles["quote"] == card_styles["takeaway"],
				"quote and takeaway cards share one visual system",
				str(card_styles),
			)
			browser.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
			WebDriverWait(browser, 5).until(
				EC.text_to_be_present_in_element(
					(By.CSS_SELECTOR, "#mn-present .mn-pres-slide.is-active"),
					"Questions, ideas, next revisions.",
				)
			)
			last_active = browser.find_element(By.CSS_SELECTOR, "#mn-present .mn-pres-slide.is-active")
			check("full dashboard is behind" not in last_active.text, "closing slide is clean")
			browser.find_element(By.TAG_NAME, "body").send_keys(Keys.ARROW_LEFT)
			time.sleep(0.2)
			check(
				"Questions, ideas, next revisions." not in browser.find_element(By.CSS_SELECTOR, "#mn-present .mn-pres-slide.is-active").text,
				"arrow-left navigates back",
			)
			browser.find_element(By.TAG_NAME, "body").send_keys("o")
			overview = WebDriverWait(browser, 5).until(
				EC.visibility_of_element_located((By.CSS_SELECTOR, "#mn-present .mn-pres-overview.is-open"))
			)
			check(
				len(browser.find_elements(By.CSS_SELECTOR, "#mn-present .mn-pres-thumb")) == len(slides),
				"overview shows every slide",
			)
			browser.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
			time.sleep(0.2)
			check("is-open" not in overview.get_attribute("class"), "escape closes the overview first")
			browser.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
			time.sleep(0.3)
			check(not browser.find_element(By.ID, "mn-present").is_displayed(), "escape closes the presentation")

			# Deep link into a later slide.
			browser.get(f"{stats_url}?present=3")
			WebDriverWait(browser, 20).until(EC.visibility_of_element_located((By.ID, "mn-present")))
			check(
				browser.find_element(By.CSS_SELECTOR, "#mn-present .mn-pres-counter").text.startswith("3 /"),
				"presentation URL opens the requested slide",
			)
			browser.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
			time.sleep(0.3)

			# Reader feedback dashboard.
			browser.get(f"{feedback_url}&tab=all")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "nav.tabs")))
			check(
				browser.find_element(By.TAG_NAME, "html").get_attribute("data-embed") == "1",
				"feedback page is embeddable",
			)
			tab_labels = " ".join(
				link.text for link in browser.find_elements(By.CSS_SELECTOR, "nav.tabs a")
			)
			for tab_label in ["Overview", "Inbox", "Accepted", "Pages", "Resolved", "Bugs", "All"]:
				check(tab_label in tab_labels, f"feedback tab {tab_label} exists")

			search = browser.find_element(By.CSS_SELECTOR, "input[name=q]")
			search.clear()
			search.send_keys("backprop")
			search_form = search.find_element(By.XPATH, "./ancestor::form")
			submit = search_form.find_element(By.CSS_SELECTOR, "button[type=submit]")
			browser.execute_script("arguments[0].click();", submit)
			WebDriverWait(browser, 20).until(lambda d: "q=backprop" in d.current_url)
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "details.item")))
			item = browser.find_elements(By.CSS_SELECTOR, "details.item")[0]
			browser.execute_script("arguments[0].open = true;", item)
			WebDriverWait(browser, 20).until(
				EC.text_to_be_present_in_element((By.CSS_SELECTOR, "details.item"), "The worked example made backprop click.")
			)
			check("The worked example made backprop click." in item.text, "feedback search finds a comment")

			browser.get(f"{feedback_url}&tab=all")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "details.item")))
			item = browser.find_element(
				By.XPATH,
				"//details[contains(@class,'item')][contains(.,'The worked example made backprop click.')]",
			)
			browser.execute_script("arguments[0].open = true;", item)
			accept = item.find_element(By.XPATH, ".//button[contains(., 'Accept')]")
			accept.click()
			WebDriverWait(browser, 20).until(
				EC.presence_of_element_located(
					(By.XPATH, "//details[contains(@class,'item')][contains(.,'reader@example.test')]")
				)
			)
			prompt_item = browser.find_element(
				By.XPATH,
				"//details[contains(@class,'item')][contains(.,'reader@example.test')]",
			)
			browser.execute_script("arguments[0].open = true;", prompt_item)
			prompt_value = WebDriverWait(browser, 20).until(
				lambda d: d.execute_script(
					"var e=arguments[0].querySelector('textarea[name=admin_prompt]'); return e ? e.value : '';",
					prompt_item,
				) or False
			)
			check("history" in prompt_value and "backprop" in prompt_value, "accept prepares an editable prompt")
			check("blog/history.php" in prompt_value, "prompt names the source file")

			item = browser.find_element(
				By.XPATH,
				"//details[contains(@class,'item')][contains(.,'The worked example made backprop click.')]",
			)
			Select(item.find_element(By.CSS_SELECTOR, "select[name=reaction]")).select_by_value("insight")
			comment = item.find_element(By.CSS_SELECTOR, "textarea[name=comment]")
			comment.clear()
			comment.send_keys("Now clearer.")
			item.find_element(By.XPATH, ".//button[contains(., 'Save changes')]").click()
			WebDriverWait(browser, 20).until(
				EC.presence_of_element_located(
					(By.XPATH, "//details[contains(@class,'item')][contains(.,'Der Geist ist ein Gespenst.')]")
				)
			)
			item = browser.find_element(
				By.XPATH,
				"//details[contains(@class,'item')][contains(.,'Der Geist ist ein Gespenst.')]",
			)
			browser.execute_script("arguments[0].open = true;", item)
			WebDriverWait(browser, 20).until(lambda d: "Now clearer." in item.text)
			check("Now clearer." in item.text, "feedback editing persists")

			item.find_element(By.XPATH, ".//button[contains(., 'Mark done')]").click()
			WebDriverWait(browser, 20).until(
				EC.presence_of_element_located(
					(By.XPATH, "//details[contains(@class,'item')][contains(.,'Der Geist ist ein Gespenst.')][contains(.,'Done')]")
				)
			)
			done_item = browser.find_element(
				By.XPATH,
				"//details[contains(@class,'item')][contains(.,'Der Geist ist ein Gespenst.')]",
			)
			check("done" in done_item.text.lower(), "feedback can be marked done")

			browser.get(f"{feedback_url}&tab=bugs")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "details.item")))
			bug_item = browser.find_elements(By.CSS_SELECTOR, "details.item")[0]
			browser.execute_script("arguments[0].open = true;", bug_item)
			WebDriverWait(browser, 20).until(lambda d: "Chart stays blank on mobile." in bug_item.text)
			check("log attached" in bug_item.text.lower(), "bug report is marked as having a log")
			browser.execute_script(
				"arguments[0].querySelector('details').open = true;",
				bug_item,
			)
			check("chart is undefined" in bug_item.text, "bug context exposes console output")

			browser.get(f"{feedback_url}&tab=all")
			WebDriverWait(browser, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "details.item")))
			item = browser.find_element(
				By.XPATH,
				"//details[contains(@class,'item')][contains(.,'Der Geist ist ein Gespenst.')]",
			)
			browser.execute_script("arguments[0].open = true;", item)
			WebDriverWait(browser, 20).until(lambda d: "Now clearer." in item.text)
			browser.execute_script("window.confirm = function(){ return true; };")
			item.find_element(By.XPATH, ".//button[contains(., 'Delete')]").click()
			try:
				WebDriverWait(browser, 10).until_not(
					EC.presence_of_element_located(
						(By.XPATH, "//details[contains(@class,'item')][contains(.,'reader@example.test')]")
					)
				)
			except TimeoutException:
				pass
			check(
				not browser.find_elements(
					By.XPATH,
					"//details[contains(@class,'item')][contains(.,'reader@example.test')]",
				),
				"feedback can be deleted",
			)

			severe = [entry for entry in browser.get_log("browser") if entry.get("level") == "SEVERE"]
			check(not severe, "no severe console errors", str(severe))
		finally:
			if browser is not None:
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
