import sys
import asyncio
import logging
import argparse
import tempfile
import shutil
import os
import json
import time
import urllib.parse
from typing import Optional
from playwright.async_api import async_playwright, Error

DEFAULT_CHROMIUM_PATH = "/usr/bin/chromium"

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stderr,
)

LOG_LEVELS = {
    "debug": logging.debug,
    "info": logging.info,
    "log": logging.info,
    "warning": logging.warning,
    "error": logging.error,
}


def to_int_exit(value) -> int:
    try:
        return int(value)
    except Exception:
        return 1


def parse_args():
    parser = argparse.ArgumentParser(description="Playwright test runner with console capture.")
    parser.add_argument("--firefox", action="store_true", help="Run Firefox (if omitted and --chromium not given, both are run).")
    parser.add_argument("--chromium", action="store_true", help="Run Chromium (if omitted and --firefox not given, both are run).")
    parser.add_argument(
        "--browser",
        action="append",
        default=[],
        choices=["chromium", "firefox", "webkit", "chrome", "msedge", "opera"],
        help="Run a specific browser. Repeatable. chromium/firefox/webkit are bundled; chrome/msedge use the installed branded channel; opera is launched best-effort.",
    )
    parser.add_argument("--chromium-executable", default=DEFAULT_CHROMIUM_PATH, help="Path to Chromium executable (default: %(default)s)")
    parser.add_argument("--firefox-executable", default=None, help="Path to Firefox executable (optional; Playwright's installed Firefox used if omitted)")
    parser.add_argument("--opera-executable", default=None, help="Path to Opera executable (optional; auto-detected on Windows/macOS if omitted)")
    parser.add_argument("--url", default="http://localhost:1122", help="URL to open (default: %(default)s)")
    parser.add_argument("--wait", type=int, default=10_000, help="Wait time in milliseconds before running tests (default: %(default)s)")
    parser.add_argument("--quick", action="store_true", help="Run the quick test subset (run_tests(1)) instead of the full suite.")
    parser.add_argument("--parallel", type=int, default=1, help="Run up to N selected browsers concurrently (default: 1).")
    parser.add_argument("--timings-json", default=None, help="Write per-browser exit codes and durations to this JSON file.")
    parser.add_argument("--timings-os", default=os.environ.get("RUNNER_OS", "").lower(), help="OS label stored in each timing entry.")
    parser.add_argument("--stop-on-failure", action="store_true", help="Do not start further browsers after one fails.")
    parser.add_argument("--artifacts-dir", default="test-artifacts", help="Directory for failure screenshots and Playwright traces.")
    parser.add_argument("--no-smoke-tests", action="store_true", help="Disable smoke tests")
    parser.add_argument("--no-docker", action="store_true", help="Disable docker")
    parser.add_argument("--no-run-tests", action="store_true", help="Disable python script")
    parser.add_argument("--no_headless", default=False, action="store_true", help="Disable headless")

    parser.add_argument("--enable-fake-media", action="store_true", help="Enable fake webcam/microphone (inject video file and auto-accept permissions)")
    parser.add_argument("--fake-video", default=None, help="Path to a Y4M video file to use as fake webcam (used when --enable-fake-media is set)")

    parser.add_argument("--run-chrome-on-firefox-failure", action="store_true", help="If Firefox fails, still run Chromium (default: don't).")
    parser.add_argument("--from-test", default=None, help="Resume tests from the given test name (forward match against the test_equal description). Prepended as ?from_test=NAME on the URL.")
    parser.add_argument("--only-test", action="append", default=[], help="Run only this test_equal (substring match); can be given multiple times. Prepended as ?only_test=A&only_test=B on the URL.")
    parser.add_argument("--only-test-count", type=int, default=0, help="Stop after this many test_equal calls (after the resume point). 0 means run all from --from-test onwards.")

    return parser.parse_args()


def find_opera_executable(args):
    if args.opera_executable:
        return args.opera_executable

    candidates = [
        shutil.which("opera"),
        "/Applications/Opera.app/Contents/MacOS/Opera",
        os.path.expandvars(r"%PROGRAMFILES%\Opera\launcher.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\Opera\opera.exe"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Opera\launcher.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Opera\launcher.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Opera\opera.exe"),
    ]

    for candidate in candidates:
        if candidate and os.path.isfile(candidate):
            return candidate

    return None


def resolve_chromium_executable(args):
    # Keep the historical Linux default, but let Playwright use its bundled
    # Chromium on Windows/macOS where /usr/bin/chromium does not exist.
    path = args.chromium_executable
    if path and os.path.isfile(path):
        return path
    return None


def capture_console(page, browser_name: str):
    def handle_console(msg):
        fn = LOG_LEVELS.get(msg.type, logging.info)
        fn(f"[{browser_name}] [console.{msg.type}] {msg.text}")

    page.on("console", handle_console)
    page.on("pageerror", lambda exc: logging.error(f"[{browser_name}] [pageerror] {exc}"))
    page.on("crash", lambda: logging.error(f"[{browser_name}] [crash] Page crashed"))
    page.on("close", lambda: logging.debug(f"[{browser_name}] [close] Page closed"))

async def _save_failure_artifacts(page, context, browser_name, args):
	artifacts_dir = os.path.abspath(args.artifacts_dir)

	try:
		os.makedirs(artifacts_dir, exist_ok=True)
	except Exception:
		logging.exception(f"[{browser_name}] Could not create artifacts dir {artifacts_dir}")
		return False

	stamp = time.strftime("%Y%m%d-%H%M%S")
	saved = False

	if page is not None:
		try:
			await page.screenshot(path=os.path.join(artifacts_dir, f"failure-{browser_name}-{stamp}.png"), full_page=False, timeout=5000)
			saved = True
		except Exception:
			logging.exception(f"[{browser_name}] Could not save failure screenshot")

		try:
			with open(os.path.join(artifacts_dir, f"failure-{browser_name}-{stamp}.html"), "w", encoding="utf-8") as handle:
				handle.write(await page.content())
			saved = True
		except Exception:
			logging.exception(f"[{browser_name}] Could not save failure page HTML")

	if context is not None:
		try:
			await context.tracing.stop(path=os.path.join(artifacts_dir, f"trace-{browser_name}-{stamp}.zip"))
			saved = True
		except Exception:
			logging.exception(f"[{browser_name}] Could not save Playwright trace")

	return saved


async def run(browser_name: str, executable_path: Optional[str], url: str, wait_time: int, args):
    """
    Runs one browser session. For Firefox we use launch_persistent_context(...) so we can supply firefox_user_prefs.
    Returns the value returned by page.evaluate("run_tests()") or a non-zero int on error.
    """
    chromium_based = browser_name in ("chromium", "chrome", "msedge", "opera")
    launch_args = []
    if chromium_based:
        launch_args.append("--enable-unsafe-swiftshader")
        if args.enable_fake_media:
            launch_args.extend([
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
            ])
            if args.fake_video:
                launch_args.append("--use-file-for-fake-video-capture=" + os.path.abspath(args.fake_video))

    firefox_prefs = {
        "media.navigator.streams.fake": True,
        "media.navigator.permission.disabled": True,
        "media.navigator.video.default_width": 1280,
        "media.navigator.video.default_height": 720,
        "media.navigator.video.default_fps": 30,
    }

    tmp_user_dir = None
    context = None
    page = None
    playwright = None
    tracing_started = False
    tracing_saved = False

    try:
        playwright = await async_playwright().start()

        if browser_name == "firefox":
            if args.enable_fake_media and args.fake_video:
                logging.warning(f"[{browser_name}] --fake-video provided but Firefox cannot use a file for fake webcam; file will be ignored and a static test image will be used.")
            tmp_user_dir = tempfile.mkdtemp(prefix="pw_firefox_profile_")
            context = await playwright.firefox.launch_persistent_context(
                tmp_user_dir,
                headless=not args.no_headless,
                executable_path=executable_path if executable_path else None,
                firefox_user_prefs=firefox_prefs,
                args=launch_args if launch_args else None,
            )
        else:
            launch_kwargs = {
                "headless": not args.no_headless,
                "args": launch_args if launch_args else None,
            }

            if browser_name == "webkit":
                browser_type = playwright.webkit
            else:
                browser_type = playwright.chromium
                if browser_name in ("chrome", "msedge"):
                    launch_kwargs["channel"] = browser_name
                elif browser_name == "opera":
                    executable_path = executable_path or find_opera_executable(args)
                    if not executable_path:
                        logging.error("[opera] Opera executable not found. Install Opera or pass --opera-executable.")
                        return 1
                    launch_kwargs["executable_path"] = executable_path
                elif executable_path:
                    launch_kwargs["executable_path"] = executable_path

            browser = await browser_type.launch(**launch_kwargs)
            context = await browser.new_context(permissions=["camera", "microphone"])

        page = await context.new_page()
        capture_console(page, browser_name)

        try:
            await context.tracing.start(screenshots=False, snapshots=True, sources=True)
            tracing_started = True
        except Exception:
            logging.warning(f"[{browser_name}] Could not start Playwright tracing")

        logging.info(f"[{browser_name}] Navigating to {url} ...")
        await page.goto(url, timeout=15000)

        logging.info(f"[{browser_name}] Waiting {wait_time/1000:.1f}s before running tests...")
        await page.wait_for_timeout(wait_time)

        test_expression = "run_tests(1)" if args.quick else "run_tests()"
        logging.info(f"[{browser_name}] Evaluating {test_expression} ...")
        try:
            result = await page.evaluate(test_expression)
            logging.info(f"[{browser_name}] {test_expression} returned: {result}")
            if to_int_exit(result) != 0:
                await _save_failure_artifacts(page, context, browser_name, args)
                tracing_saved = tracing_started
            return result
        except Error as e:
            logging.error(f"[{browser_name}] Playwright evaluation error: {e}")
            await _save_failure_artifacts(page, context, browser_name, args)
            tracing_saved = tracing_started
            return 1

    except Exception:
        logging.exception(f"[{browser_name}] Unhandled exception during run")
        try:
            await _save_failure_artifacts(page, context, browser_name, args)
            tracing_saved = tracing_started
        except Exception:
            logging.exception(f"[{browser_name}] Could not save failure artifacts")
        return 1

    finally:
        if context:
            if tracing_started and not tracing_saved:
                try:
                    await context.tracing.stop()
                except Exception:
                    pass
            try:
                await context.close()
                logging.debug(f"[{browser_name}] Context closed successfully.")
            except Exception:
                logging.exception(f"[{browser_name}] Failed to close context")

        # 🔧 Delay to allow pending Playwright transport writes to flush
        await asyncio.sleep(0.2)

        if playwright:
            try:
                await playwright.stop()
                logging.debug(f"[{browser_name}] Playwright stopped cleanly.")
            except Exception:
                logging.exception(f"[{browser_name}] Failed to stop Playwright cleanly")

        if tmp_user_dir and os.path.isdir(tmp_user_dir):
            try:
                shutil.rmtree(tmp_user_dir)
            except Exception:
                logging.exception(f"[{browser_name}] Failed to remove temp profile dir {tmp_user_dir}")

async def main():
    args = parse_args()

    # If --from-test / --only-test are given, append them as URL query
    # strings so tests.js can read them on load and skip/restrICT tests
    # accordingly. We preserve any pre-existing query string on --url.
    query_parts = []
    if args.from_test:
        query_parts.append("from_test=" + urllib.parse.quote(args.from_test, safe=''))
        logging.info(f"[main] Resuming tests from: {args.from_test}")
    for ot in args.only_test:
        query_parts.append("only_test=" + urllib.parse.quote(ot, safe=''))
        logging.info(f"[main] Restricting to test: {ot}")
    if args.only_test_count:
        query_parts.append("only_test_count=" + str(args.only_test_count))
        logging.info(f"[main] Will stop after {args.only_test_count} test_equal calls past resume point")
    if query_parts:
        sep = "&" if "?" in args.url else "?"
        url_with_from_test = args.url + sep + "&".join(query_parts)
    else:
        url_with_from_test = args.url

    if args.browser:
        selected = []
        for browser in args.browser:
            if browser not in selected:
                selected.append(browser)
    else:
        run_firefox = args.firefox or (not args.firefox and not args.chromium)
        run_chromium = args.chromium or (not args.firefox and not args.chromium)
        selected = []
        if run_firefox:
            selected.append("firefox")
        if run_chromium:
            selected.append("chromium")

    parallel = max(1, args.parallel)
    semaphore = asyncio.Semaphore(parallel)
    failure_event = asyncio.Event()

    async def _run_one (browser_name):
        async with semaphore:
            if args.stop_on_failure and failure_event.is_set():
                return (browser_name, 1, 0.0, True)

            executable_path = None
            if browser_name == "chromium":
                executable_path = resolve_chromium_executable(args)
            elif browser_name == "firefox":
                executable_path = args.firefox_executable

            started = time.monotonic()
            try:
                r = await run(browser_name, executable_path, url_with_from_test, args.wait, args)
                rc = to_int_exit(r)
            except Exception:
                logging.exception(f"[{browser_name}] Unhandled exception during run")
                rc = 1

            duration = time.monotonic() - started
            if rc != 0 and args.stop_on_failure:
                failure_event.set()
            return (browser_name, rc, duration, False)

    executed = []
    failures = []
    timings = []
    results = []

    if not args.browser and parallel == 1:
        # Preserve the historical sequential default: skip Chromium when the
        # implicit Firefox run failed.
        for browser_name in selected:
            if browser_name == "chromium" and any(name == "firefox" and rc != 0 for name, rc, _, _ in results) and not args.run_chrome_on_firefox_failure:
                logging.info("[main] Firefox failed and --run-chrome-on-firefox-failure not set; skipping Chromium run.")
                results.append((browser_name, 1, 0.0, True))
                continue
            results.append(await _run_one(browser_name))
    else:
        results = await asyncio.gather(*[_run_one(browser_name) for browser_name in selected])

    for browser_name, rc, duration, skipped in results:
        executed.append((browser_name, rc))
        timings.append({
            "os": args.timings_os,
            "browser": browser_name,
            "exit_code": rc,
            "duration_seconds": round(duration, 1),
            "skipped": skipped
        })
        if rc != 0 and not skipped:
            failures.append((browser_name, rc))

    if args.timings_json:
        try:
            with open(args.timings_json, "w", encoding="utf-8") as handle:
                json.dump(timings, handle, indent=2)
                handle.write("\n")
        except Exception:
            logging.exception("[main] Could not write timings JSON")

    if not executed:
        logging.error("[main] No browsers were selected to run; nothing done.")
        return 1

    if failures:
        for name, rc in executed:
            logging.info(f"[main] {name} exit code: {rc}")
        logging.error("[main] One or more runs failed.")
        return 1

    for name, rc in executed:
        logging.info(f"[main] {name} exit code: {rc}")
    logging.info("[main] All requested runs succeeded.")
    return 0


if __name__ == "__main__":
    try:
        code = asyncio.run(main())
    except Exception:
        logging.exception("Unhandled exception in main()")
        code = 1
    sys.exit(int(code))
