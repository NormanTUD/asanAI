import sys
import asyncio
import logging
from playwright.async_api import async_playwright

CHROME_PATH = "/usr/bin/chromium"

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stderr,
)

async def capture_console(page):
    page.on("console", lambda msg: logging.error(
        f"[console.{msg.type}] {msg.text}"
    ))
    page.on("pageerror", lambda exc: logging.error(f"[pageerror] {exc}"))
    page.on("crash", lambda: logging.error("[crash] Page crashed"))
    page.on("close", lambda: logging.debug("[close] Page closed"))

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
        )
        page = await browser.new_page()
        await capture_console(page)

        logging.info("Navigating to http://localhost:1122 ...")
        await page.goto("http://localhost:1122", timeout=15000)

        logging.info("Waiting 10s before running tests...")
        await page.wait_for_timeout(10_000)

        logging.info("Evaluating run_tests() ...")
        result = await page.evaluate("run_tests()")

        logging.info(f"run_tests() returned: {result}")
        await browser.close()
        return result

if __name__ == "__main__":
    try:
        code = asyncio.run(main())
    except Exception as e:
        logging.exception("Unhandled exception in main()")
        code = 1
    sys.exit(int(code))
