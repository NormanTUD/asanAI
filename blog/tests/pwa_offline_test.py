#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Browser test: every visited blog page and its assets work offline.

The test deliberately registers the Toolkit service worker at scope "/" first.
The blog worker lives at "/blog/", so the first blog page is controlled by the
Toolkit worker until the blog worker activates. That is the race the blog
registration has to survive.

Checks:
  * the visited lesson page and its images are in the blog caches;
  * an offline reload serves the lesson and its images without page errors;
  * an unvisited lesson falls back to offline.html;
  * the automatic cache adds no visible UI.

Run from the repository root:
    uv run blog/tests/pwa_offline_test.py
"""

from __future__ import annotations

import contextlib
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
LESSON = "/blog/math_i.php"
UNVISITED = "/blog/history.php"


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def ensure_chromium() -> None:
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            browser.close()
            return
    except Exception:
        pass

    subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )


@contextlib.contextmanager
def local_server(port: int):
    php = shutil.which("php")
    if php is None:
        print("ERROR: php is not on PATH", file=sys.stderr)
        raise SystemExit(1)

    process = subprocess.Popen(
        [php, "-S", f"127.0.0.1:{port}", "-t", str(REPO_ROOT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    try:
        deadline = time.time() + 10
        while time.time() < deadline:
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                    break
            except OSError:
                time.sleep(0.1)
        else:
            print("ERROR: php server did not start", file=sys.stderr)
            raise SystemExit(1)
        yield
    finally:
        process.terminate()
        with contextlib.suppress(Exception):
            process.wait(timeout=3)


def wait_until_cached(page, url: str, prefix: str, timeout_ms: int = 120000) -> bool:
    page.wait_for_function(
        """async ({ url, prefix }) => {
            const names = await caches.keys();
            for (const name of names) {
                if (!name.startsWith(prefix)) continue;
                const cache = await caches.open(name);
                if (await cache.match(url, { ignoreSearch: true })) return true;
            }
            return false;
        }""",
        arg={"url": url, "prefix": prefix},
        timeout=timeout_ms,
    )
    return True


def main() -> int:
    ensure_chromium()
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

    failures: list[str] = []
    page_errors: list[str] = []
    port = free_port()
    base = f"http://127.0.0.1:{port}"

    with local_server(port), sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        try:
            # Register the Toolkit worker first, so the blog page starts under
            # a foreign controller. This is the common real-world case.
            page.goto(base + "/offline.html", wait_until="load", timeout=30000)
            page.evaluate(
                """async () => {
                    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
                    if (!reg.active) {
                        const worker = reg.installing || reg.waiting;
                        if (worker) {
                            await new Promise((resolve) => {
                                worker.addEventListener("statechange", () => {
                                    if (worker.state === "activated") resolve();
                                });
                            });
                        }
                    }
                    await navigator.serviceWorker.ready;
                }"""
            )
            page.wait_for_function(
                "() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.endsWith('/sw.js')",
                timeout=30000,
            )

            page.goto(base + LESSON, wait_until="load", timeout=30000)
            lesson_url = page.url.split("#")[0]

            page.wait_for_function(
                """async () => {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    return regs.some((reg) => reg.scope.endsWith("/blog/") && reg.active);
                }""",
                timeout=30000,
            )

            wait_until_cached(page, lesson_url, "asanai-blog-pages-")
            wait_until_cached(page, base + "/blog/euler.jpg", "asanai-blog-assets-")

            page.wait_for_function(
                "() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.endsWith('/blog/sw.js')",
                timeout=30000,
            )

            if page.evaluate("!!document.querySelector('.pwa-footer')"):
                failures.append("automatic caching added a .pwa-footer element")

            body = page.inner_text("body")
            for label in ("Save page offline", "Install app"):
                if label in body:
                    failures.append(f"unexpected PWA UI text: {label}")

            context.set_offline(True)
            page.reload(wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("() => document.body.innerText.length > 100", timeout=30000)

            try:
                page.wait_for_function(
                    """() => {
                        const image = document.querySelector('img[src="euler.jpg"]');
                        return !!(image && image.complete && image.naturalWidth > 0);
                    }""",
                    timeout=30000,
                )
            except PlaywrightTimeout:
                failures.append("cached lesson image did not render offline")

            try:
                page.goto(base + UNVISITED, wait_until="domcontentloaded", timeout=30000)
                offline_text = page.inner_text("body")
                if "not saved on your device" not in offline_text:
                    failures.append("unvisited lesson did not show offline.html")
            except PlaywrightTimeout:
                failures.append("unvisited lesson did not load offline")
            except Exception as error:
                failures.append(f"unvisited lesson failed offline: {error}")

            if page_errors:
                failures.append(f"page errors: {page_errors[:3]}")
        except PlaywrightTimeout as error:
            failures.append(f"timeout: {error}")
        except Exception as error:
            failures.append(f"unexpected error: {error}")
        finally:
            context.set_offline(False)
            browser.close()

    if failures:
        for failure in failures:
            print(f"FAIL {failure}", file=sys.stderr)
        return 1

    print("PASS blog PWA: visited lesson and assets are available offline")
    return 0


if __name__ == "__main__":
    sys.exit(main())
