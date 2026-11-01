#!/usr/bin/env python3
"""Real offline smoke test for the asanAI toolkit PWA.

Usage (server must already be running):
    python tests/pwa_offline_test.py --url http://127.0.0.1:1122/index.php
"""

import argparse
import asyncio
import sys

from playwright.async_api import async_playwright


async def wait_for_boot(page, timeout_ms=180_000):
    await page.wait_for_function(
        "() => (typeof window.boot_settled !== 'undefined' && window.boot_settled) || window.finished_loading === true",
        timeout=timeout_ms,
    )


async def wait_for_service_worker(page, timeout_ms=20_000):
    return await page.evaluate(
        """async (timeout) => {
            if (!('serviceWorker' in navigator)) return false;
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise(resolve => setTimeout(() => resolve(null), timeout))
            ]);
            return !!registration;
        }""",
        timeout_ms,
    )


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:1122/index.php")
    parser.add_argument("--browser", default="chromium", choices=["chromium", "firefox", "webkit"])
    args = parser.parse_args()

    failed_requests = []
    page_errors = []
    bad_responses = []

    async with async_playwright() as playwright:
        browser = await getattr(playwright, args.browser).launch(headless=True)
        context = await browser.new_context(viewport={"width": 1600, "height": 1000})
        page = await context.new_page()

        page.on("requestfailed", lambda request: failed_requests.append((request.url, request.failure)))
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on("response", lambda response: bad_responses.append((response.status, response.url)) if response.status >= 400 else None)

        await page.goto(args.url, wait_until="load")
        await wait_for_boot(page)
        await page.wait_for_timeout(1000)

        if not await wait_for_service_worker(page):
            print("FAIL: service worker did not register", file=sys.stderr)
            await browser.close()
            return 1

        # Let pwa.js send the resources and the service worker prefetch the
        # current dataset (including the architecture presets and images).
        await page.wait_for_timeout(15_000)

        await context.set_offline(True)

        failed_requests.clear()
        page_errors.clear()
        bad_responses.clear()

        try:
            await page.reload(wait_until="load", timeout=30_000)
        except Exception as error:
            print("FAIL: offline reload failed: " + str(error), file=sys.stderr)
            await browser.close()
            return 1

        try:
            await page.wait_for_function(
                "() => (typeof window.boot_settled !== 'undefined' && window.boot_settled) || window.finished_loading === true",
                timeout=30_000,
            )
        except Exception:
            pass

        await page.wait_for_timeout(1_000)

        body = await page.evaluate("() => document.body.innerText")
        title = await page.title()

        if "asanAI" not in body and "asanAI" not in title:
            print("FAIL: offline page did not boot the toolkit; body=" + repr(body[:300]), file=sys.stderr)
            print("failed=" + repr(failed_requests[:5]), file=sys.stderr)
            print("errors=" + repr(page_errors[:5]), file=sys.stderr)
            await browser.close()
            return 1

        if failed_requests:
            print("FAIL: requests failed offline: " + repr(failed_requests[:5]), file=sys.stderr)
            await browser.close()
            return 1

        if page_errors:
            print("FAIL: page errors offline: " + repr(page_errors[:5]), file=sys.stderr)
            await browser.close()
            return 1

        # A default architecture change must also work from the cache.
        bad_responses.clear()
        page_errors.clear()
        await page.evaluate("() => { $('#dataset').val('and_xor').trigger('change'); }")
        await page.wait_for_timeout(12_000)

        dataset = await page.evaluate("() => document.querySelector('#dataset').value")
        if dataset != "and_xor":
            print("FAIL: offline architecture change did not select and_xor: " + str(dataset), file=sys.stderr)
            await browser.close()
            return 1

        if page_errors:
            print("FAIL: page errors during offline architecture change: " + repr(page_errors[:5]), file=sys.stderr)
            await browser.close()
            return 1

        if bad_responses:
            print("FAIL: 4xx/5xx responses during offline architecture change: " + repr(bad_responses[:5]), file=sys.stderr)
            await browser.close()
            return 1

        if not await page.evaluate("() => typeof show_offline_data_message === 'function'"):
            print("FAIL: offline data message helper is missing", file=sys.stderr)
            await browser.close()
            return 1

        await browser.close()

    print("PWA offline test passed")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
