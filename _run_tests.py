import sys
import asyncio
import logging
import argparse
import tempfile
import shutil
import os
from typing import Optional
from playwright.async_api import async_playwright
import playwright._impl._errors

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
    parser.add_argument("--chromium-executable", default=DEFAULT_CHROMIUM_PATH, help="Path to Chromium executable (default: %(default)s)")
    parser.add_argument("--firefox-executable", default=None, help="Path to Firefox executable (optional; Playwright's installed Firefox used if omitted)")
    parser.add_argument("--url", default="http://localhost:1122", help="URL to open (default: %(default)s)")
    parser.add_argument("--wait", type=int, default=10_000, help="Wait time in milliseconds before running tests (default: %(default)s)")
    parser.add_argument("--no-smoke-tests", action="store_true", help="Disable smoke tests")
    parser.add_argument("--no-docker", action="store_true", help="Disable docker")
    parser.add_argument("--no-run-tests", action="store_true", help="Disable python script")
    parser.add_argument("--no_headless", default=False, action="store_true", help="Disable headless")

    parser.add_argument("--enable-fake-media", action="store_true", help="Enable fake webcam/microphone (inject video file and auto-accept permissions)")
    parser.add_argument("--fake-video", default=None, help="Path to a Y4M video file to use as fake webcam (used when --enable-fake-media is set)")

    parser.add_argument("--run-chrome-on-firefox-failure", action="store_true", help="If Firefox fails, still run Chromium (default: don't).")

    return parser.parse_args()


def capture_console(page, browser_name: str):
    def handle_console(msg):
        fn = LOG_LEVELS.get(msg.type, logging.info)
        fn(f"[{browser_name}] [console.{msg.type}] {msg.text}")

    page.on("console", handle_console)
    page.on("pageerror", lambda exc: logging.error(f"[{browser_name}] [pageerror] {exc}"))
    page.on("crash", lambda: logging.error(f"[{browser_name}] [crash] Page crashed"))
    page.on("close", lambda: logging.debug(f"[{browser_name}] [close] Page closed"))

async def run(browser_name: str, executable_path: Optional[str], url: str, wait_time: int, args):
    """
    Runs one browser session. For Firefox we use launch_persistent_context(...) so we can supply firefox_user_prefs.
    Returns the value returned by page.evaluate("run_tests()") or a non-zero int on error.
    """
    launch_args = []
    if browser_name == "chromium":
        launch_args.append("--enable-unsafe-swiftshader")
        if args.enable_fake_media:
            launch_args.extend([
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
            ])
            if args.fake_video:
                launch_args.append(f"--use-file-for-fake-video-capture={args.fake_video}")

    firefox_prefs = {
        "media.navigator.streams.fake": True,
        "media.navigator.permission.disabled": True,
        "media.navigator.video.default_width": 1280,
        "media.navigator.video.default_height": 720,
        "media.navigator.video.default_fps": 30,
    }

    tmp_user_dir = None
    context = None
    playwright = None

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
            browser_type = getattr(playwright, browser_name)
            browser = await browser_type.launch(
                executable_path=executable_path if executable_path is not None else None,
                headless=not args.no_headless,
                args=launch_args if launch_args else None,
            )
            context = await browser.new_context(permissions=["camera", "microphone"])

        page = await context.new_page()
        capture_console(page, browser_name)

        logging.info(f"[{browser_name}] Navigating to {url} ...")
        await page.goto(url, timeout=15000)

        logging.info(f"[{browser_name}] Waiting {wait_time/1000:.1f}s before running tests...")
        await page.wait_for_timeout(wait_time)

        logging.info(f"[{browser_name}] Evaluating run_tests() ...")
        try:
            result = await page.evaluate("run_tests()")
            logging.info(f"[{browser_name}] run_tests() returned: {result}")
            return result
        except playwright._impl._errors.Error as e:
            logging.error(f"[{browser_name}] Playwright evaluation error: {e}")
            return 1

    except Exception:
        logging.exception(f"[{browser_name}] Unhandled exception during run")
        return 1

    finally:
        if context:
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

    run_firefox = args.firefox or (not args.firefox and not args.chromium)
    run_chromium = args.chromium or (not args.firefox and not args.chromium)

    executed = []
    failures = []

    if run_firefox:
        try:
            r = await run("firefox", args.firefox_executable, args.url, args.wait, args)
            rc = to_int_exit(r)
            executed.append(("firefox", rc))
            if rc != 0:
                failures.append(("firefox", rc))
        except Exception:
            logging.exception("[firefox] Unhandled exception during run")
            executed.append(("firefox", 1))
            failures.append(("firefox", 1))

    if run_chromium:
        skip_chrome = False
        if run_firefox and any(name == "firefox" and rc != 0 for name, rc in executed) and not args.run_chrome_on_firefox_failure:
            logging.info("[main] Firefox failed and --run-chrome-on-firefox-failure not set; skipping Chromium run.")
            skip_chrome = True
            executed.append(("chromium", 1))
            failures.append(("chromium", 1))
        if not skip_chrome:
            try:
                r = await run("chromium", args.chromium_executable, args.url, args.wait, args)
                rc = to_int_exit(r)
                executed.append(("chromium", rc))
                if rc != 0:
                    failures.append(("chromium", rc))
            except Exception:
                logging.exception("[chromium] Unhandled exception during run")
                executed.append(("chromium", 1))
                failures.append(("chromium", 1))

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
