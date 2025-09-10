import sys, asyncio
from playwright.async_api import async_playwright

CHROME_PATH = "/usr/bin/chromium"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True
        )
        page = await browser.new_page()
        await page.goto("http://localhost:1122", timeout=15000)
        await page.wait_for_timeout(10_000)
        result = await page.evaluate("run_tests()")
        await browser.close()
        return result

if __name__ == "__main__":
    try:
        code = asyncio.run(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        code = 1
    sys.exit(int(code))
