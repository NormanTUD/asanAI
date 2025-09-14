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

async def capture_console(page):
    def handle_console(msg):
        fn = LOG_LEVELS.get(msg.type, logging.info)
        fn(f"[console.{msg.type}] {msg.text}")

    page.on("console", handle_console)
    page.on("pageerror", lambda exc: logging.error(f"[pageerror] {exc}"))
    page.on("crash", lambda: logging.error("[crash] Page crashed"))
    page.on("close", lambda: logging.debug("[close] Page closed"))

async def run(browser_name, executable_path, url, wait_time):
    async with async_playwright() as p:
        browser_type = getattr(p, browser_name)
        browser = await browser_type.launch(
            executable_path=executable_path if browser_name == "chromium" else None,
            headless=args.headless,
            args=["--enable-unsafe-swiftshader"] if browser_name == "chromium" else None,
        )
        page = await browser.new_page()
        await capture_console(page)

        logging.info(f"Navigating to {url} ...")
        await page.goto(url, timeout=15000)

        logging.info(f"Waiting {wait_time/1000:.1f}s before running tests...")
        await page.wait_for_timeout(wait_time)

        logging.info("Evaluating run_tests() ...")
        result = await page.evaluate("run_tests()")

        logging.info(f"run_tests() returned: {result}")
        await browser.close()
        return result

def parse_args():
    parser = argparse.ArgumentParser(description="Playwright test runner with console capture.")

    parser.add_argument("--browser", choices=["chromium", "firefox", "webkit"], default="chromium", help="Browser to use (default: chromium)")
    parser.add_argument("--executable", default=DEFAULT_CHROME_PATH, help="Path to browser executable (only for chromium)")
    parser.add_argument("--url", default="http://localhost:1122", help="URL to open (default: http://localhost:1122)")
    parser.add_argument("--wait", type=int, default=10_000, help="Wait time in milliseconds before running tests (default: 10000)")
    parser.add_argument("--no-smoke-tests", action="store_true", help="Disable smoke tests")
    parser.add_argument("--no-docker", action="store_true", help="Disable docker")
    parser.add_argument("--no-run-tests", action="store_true", help="Disable python script")
    parser.add_argument("--headless", default=True, action="store_false", help="Disable headless")

    return parser.parse_args()

async def main():
    args = parse_args()
    return await run(args.browser, args.executable, args.url, args.wait)

if __name__ == "__main__":
    try:
        code = asyncio.run(main())
    except Exception:
        logging.exception("Unhandled exception in main()")
        code = 1
    sys.exit(int(code))
