#!/usr/bin/env python3
import sys
import asyncio
import logging
import argparse
from playwright.async_api import async_playwright

DEFAULT_CHROME_PATH = "/usr/bin/chromium"

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

def parse_args():
    parser = argparse.ArgumentParser(description="Playwright parallel test runner with console capture.")
    parser.add_argument("--browser", choices=["chromium", "firefox", "webkit"], help="If given, run only this browser. Otherwise both chromium and firefox are run.")
    parser.add_argument("--executable", default=DEFAULT_CHROME_PATH, help="Path to browser executable (only for chromium).")
    parser.add_argument("--url", default="http://localhost:1122", help="URL to open (default: http://localhost:1122).")
    parser.add_argument("--wait", type=int, default=10_000, help="Wait time in milliseconds before running tests (default: 10000).")
    parser.add_argument("--no-smoke-tests", action="store_true", help="Disable smoke tests")
    parser.add_argument("--no-docker", action="store_true", help="Disable docker")
    parser.add_argument("--no-run-tests", action="store_true", help="Disable python script")
    parser.add_argument("--no_headless", default=False, action="store_true", help="Disable headless")
    parser.add_argument("--enable-fake-media", action="store_true", help="Enable fake webcam/microphone (auto-accept permissions).")
    parser.add_argument("--fake-video", default=None, help="Path to a Y4M video file to use as fake webcam (ONLY for Chromium).")
    return parser.parse_args()

async def capture_console(page):
    def handle_console(msg):
        fn = LOG_LEVELS.get(msg.type, logging.info)
        fn(f"[console.{msg.type}] {msg.text}")
    page.on("console", handle_console)
    page.on("pageerror", lambda exc: logging.error(f"[pageerror] {exc}"))
    page.on("crash", lambda: logging.error("[crash] Page crashed"))
    page.on("close", lambda: logging.debug("[close] Page closed"))

def _build_chromium_args(enable_fake_media: bool, fake_video: str | None) -> list:
    args = ["--enable-unsafe-swiftshader"]
    if enable_fake_media:
        args += ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
        if fake_video:
            args.append(f"--use-file-for-fake-video-capture={fake_video}")
    return args

def _build_firefox_prefs(enable_fake_media: bool) -> dict | None:
    if not enable_fake_media:
        return None
    return {
        "media.navigator.permission.disabled": True,
        "media.navigator.streams.fake": True,
    }

def normalize_result(result):
    try:
        return int(result)
    except Exception:
        if result is None:
            return 0
        if isinstance(result, bool):
            return 0 if result else 1
        return 1

async def run_one(p, browser_name, executable_path, url, wait_time, args):
    browser_type = getattr(p, browser_name)
    launch_kwargs = {}
    if browser_name == "chromium":
        chromium_args = _build_chromium_args(args.enable_fake_media, args.fake_video)
        if chromium_args:
            launch_kwargs["args"] = chromium_args
        if executable_path:
            launch_kwargs["executable_path"] = executable_path
    elif browser_name == "firefox":
        prefs = _build_firefox_prefs(args.enable_fake_media)
        if prefs:
            launch_kwargs["firefox_user_prefs"] = prefs
        if args.fake_video:
            logging.warning("Ignoring --fake-video for Firefox (file injection is only supported on Chromium).")
    # headless handling (same for all)
    launch_kwargs["headless"] = not args.no_headless

    logging.info(f"Launching {browser_name} with kwargs: { {k:v for k,v in launch_kwargs.items()} }")
    browser = await browser_type.launch(**launch_kwargs)
    try:
        context = await browser.new_context(permissions=["camera", "microphone"])
        page = await context.new_page()
        await capture_console(page)
        logging.info(f"[{browser_name}] Navigating to {url} ...")
        await page.goto(url, timeout=15000)
        logging.info(f"[{browser_name}] Waiting {wait_time/1000:.1f}s before running tests...")
        await page.wait_for_timeout(wait_time)
        logging.info(f"[{browser_name}] Evaluating run_tests() ...")
        result = await page.evaluate("run_tests()")
        code = normalize_result(result)
        logging.info(f"[{browser_name}] run_tests() returned: {result} -> exit {code}")
    finally:
        try:
            await context.close()
        except Exception:
            logging.exception(f"[{browser_name}] Error closing context")
        try:
            await browser.close()
        except Exception:
            logging.exception(f"[{browser_name}] Error closing browser")
    return code

async def run_parallel(browsers, executable_path, url, wait_time, args):
    async with async_playwright() as p:
        tasks = [asyncio.create_task(run_one(p, b, executable_path, url, wait_time, args)) for b in browsers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    final = {}
    failed = False
    for b, r in zip(browsers, results):
        if isinstance(r, Exception):
            logging.exception(f"[{b}] Exception during run")
            final[b] = 1
            failed = True
        else:
            final[b] = int(r)
            if final[b] != 0:
                failed = True
    logging.info(f"Runs completed: {final}")
    return 0 if not failed else 1

async def main():
    args = parse_args()
    browsers = [args.browser] if args.browser else ["chromium", "firefox"]
    return await run_parallel(browsers, args.executable, args.url, args.wait, args)

if __name__ == "__main__":
    try:
        code = asyncio.run(main())
    except Exception:
        logging.exception("Unhandled exception in main()")
        code = 1
    sys.exit(int(code))
