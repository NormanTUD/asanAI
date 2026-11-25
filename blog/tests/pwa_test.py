#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""PWA guard: keep the installable offline app wired together.

The blog is served as PHP templates, so the PWA has three moving parts that
can silently drift apart: the web app manifest, the service worker, and the
small registration script that loads on every page. This test checks the
contract between them without a browser:

  * the manifest parses, has installable fields and real PNG icons whose
    declared sizes match the files;
  * the service worker handles install/activate/fetch/message, falls back to
    offline.html and never caches private or dynamic endpoints;
  * pwa.js registers the worker for its own scope and automatically hands the
    current page and its assets to the worker, without adding any page UI;
  * every shared page head loads the manifest and pwa.js through
    load_base_js();
  * .htaccess serves .webmanifest as application/manifest+json.

Run:
    uv run blog/tests/pwa_test.py [blog/]

Exit code 0 = all checks pass, 1 = at least one failed.
"""

from __future__ import annotations

import json
import re
import shutil
import struct
import subprocess
import sys
from pathlib import Path

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def png_size(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()[:24]
    if len(data) < 24 or not data.startswith(PNG_SIGNATURE):
        return None
    width, height = struct.unpack(">II", data[16:24])
    return width, height


def check_manifest(root: Path) -> list[str]:
    errors: list[str] = []
    manifest_path = root / "manifest.webmanifest"
    if not manifest_path.is_file():
        return ["manifest.webmanifest is missing"]

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"manifest.webmanifest is not valid JSON: {exc}"]

    for key in ("name", "short_name", "start_url", "scope", "display", "theme_color", "background_color"):
        if not manifest.get(key):
            errors.append(f"manifest.webmanifest: missing {key}")

    if manifest.get("display") not in {"standalone", "fullscreen", "minimal-ui"}:
        errors.append(f"manifest.webmanifest: unsupported display {manifest.get('display')!r}")

    for key in ("start_url", "scope"):
        value = manifest.get(key, "")
        if isinstance(value, str) and re.match(r"^[a-z]+://", value, re.IGNORECASE):
            errors.append(f"manifest.webmanifest: {key} must stay relative, got {value!r}")

    icons = manifest.get("icons")
    if not isinstance(icons, list) or not icons:
        errors.append("manifest.webmanifest: icons must be a non-empty list")
        return errors

    seen: set[tuple[str, str]] = set()
    for icon in icons:
        if not isinstance(icon, dict):
            errors.append("manifest.webmanifest: icon entries must be objects")
            continue
        src = icon.get("src")
        sizes = icon.get("sizes")
        purpose = icon.get("purpose", "any")
        if not isinstance(src, str) or not isinstance(sizes, str):
            errors.append(f"manifest.webmanifest: malformed icon {icon!r}")
            continue
        if not sizes.endswith("x"):
            parts = sizes.split("x")
            if len(parts) != 2 or not all(part.isdigit() for part in parts):
                errors.append(f"manifest.webmanifest: bad sizes {sizes!r} for {src}")
                continue
            expected = (int(parts[0]), int(parts[1]))
        else:
            continue
        icon_path = root / src
        if not icon_path.is_file():
            errors.append(f"manifest.webmanifest: icon file missing: {src}")
            continue
        actual = png_size(icon_path)
        if actual != expected:
            errors.append(f"manifest.webmanifest: {src} is {actual}, expected {expected}")
        seen.add((sizes, purpose))

    for required in (("192x192", "any"), ("512x512", "any"), ("512x512", "maskable")):
        if required not in seen:
            errors.append(f"manifest.webmanifest: missing icon {required[0]} purpose={required[1]}")

    for asset in ("pwa/apple-touch-icon-180.png",):
        if not (root / asset).is_file():
            errors.append(f"missing {asset}")

    return errors


def check_service_worker(root: Path) -> list[str]:
    errors: list[str] = []
    path = root / "sw.js"
    if not path.is_file():
        return ["sw.js is missing"]
    source = path.read_text(encoding="utf-8")

    for event in ("install", "activate", "fetch", "message"):
        if not re.search(rf'addEventListener\(\s*"{event}"', source):
            errors.append(f"sw.js: no {event} listener")

    for marker in (
        "CACHE_VERSION",
        "offline.html",
        "CACHE_PAGE",
        "CACHE_PAGE_DONE",
        "isCacheable",
        "ignoreSearch",
        "isImmutableAsset",
        "enforceStorageBudget",
    ):
        if marker not in source:
            errors.append(f"sw.js: missing {marker}")

    for endpoint in (
        "track.php",
        "feedback_track.php",
        "ask.php",
        "search.php",
        "stats.php",
        "questions.php",
        "asanai_blog_proxy.php",
        ".search_cache.json",
    ):
        if endpoint not in source:
            errors.append(f"sw.js: {endpoint} must be excluded from the cache")

    return errors


def check_registration(root: Path) -> list[str]:
    errors: list[str] = []
    path = root / "pwa.js"
    if not path.is_file():
        return ["pwa.js is missing"]
    source = path.read_text(encoding="utf-8")

    for marker in (
        "serviceWorker.register",
        "waitForActive",
        "CACHE_PAGE",
        "collectAssetUrls",
    ):
        if marker not in source:
            errors.append(f"pwa.js: missing {marker}")

    return errors


def check_no_gui(root: Path) -> list[str]:
    errors: list[str] = []
    pwa = root / "pwa.js"
    if pwa.is_file():
        source = pwa.read_text(encoding="utf-8")
        for marker in ("Save page offline", "Install app", "pwa-footer", "beforeinstallprompt"):
            if marker in source:
                errors.append(f"pwa.js: unexpected UI marker {marker!r}")

    style = root / "style.css"
    if style.is_file() and ".pwa-footer" in style.read_text(encoding="utf-8"):
        errors.append("style.css: unexpected PWA footer styles")

    return errors


def check_page_integration(root: Path) -> list[str]:
    errors: list[str] = []
    functions = root / "functions.php"
    if not functions.is_file():
        return ["functions.php is missing"]
    source = functions.read_text(encoding="utf-8")

    if "function print_pwa_head" not in source:
        errors.append("functions.php: print_pwa_head() is missing")
    if "rel='manifest' href='manifest.webmanifest'" not in source:
        errors.append("functions.php: the manifest link is not emitted")
    if 'js("pwa", null, $defer)' not in source:
        errors.append("functions.php: pwa.js is not loaded by load_base_js()")
    if 'js("view_transitions", null, false)' not in source:
        errors.append("functions.php: view_transitions.js is not loaded early by load_base_js()")
    if "print_pwa_head();" not in source:
        errors.append("functions.php: load_base_js() does not call print_pwa_head()")

    transitions = root / "view_transitions.js"
    if not transitions.is_file():
        errors.append("view_transitions.js is missing")
    else:
        transitions_source = transitions.read_text(encoding="utf-8")
        for marker in ("pagereveal", "viewTransitionName", ".course-tile", "MNViewTransition"):
            if marker not in transitions_source:
                errors.append(f"view_transitions.js: missing {marker}")

    offline = root / "offline.html"
    if not offline.is_file():
        errors.append("offline.html is missing")
    else:
        offline_source = offline.read_text(encoding="utf-8")
        if re.search(r"https?://", offline_source):
            errors.append("offline.html must not depend on external resources")

    htaccess = root / ".htaccess"
    if htaccess.is_file():
        if "application/manifest+json" not in htaccess.read_text(encoding="utf-8"):
            errors.append(".htaccess: .webmanifest is not served as application/manifest+json")
    else:
        errors.append(".htaccess is missing")

    style = root / "style.css"
    if style.is_file():
        style_source = style.read_text(encoding="utf-8")
        if "@view-transition" not in style_source or "navigation: auto" not in style_source:
            errors.append("style.css: cross-document view transitions are not enabled")
        if "#mn-vt-title" not in style_source:
            errors.append("style.css: the shared-element loader title is not styled")
    else:
        errors.append("style.css is missing")

    return errors


def check_syntax(root: Path) -> list[str]:
    node = shutil.which("node")
    if node is None:
        return []
    errors: list[str] = []
    for name in ("sw.js", "pwa.js"):
        result = subprocess.run(
            [node, "--check", str(root / name)],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            errors.append(f"{name}: node --check failed:\n{result.stderr.strip()}")
    return errors


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    errors: list[str] = []
    errors.extend(check_manifest(root))
    errors.extend(check_service_worker(root))
    errors.extend(check_registration(root))
    errors.extend(check_no_gui(root))
    errors.extend(check_page_integration(root))
    errors.extend(check_syntax(root))

    for error in errors:
        print(f"  FAIL {error}")

    if errors:
        print(f"[FAIL] PWA: {len(errors)} issue(s)")
        return 1

    print("[PASS] PWA: manifest, service worker, registration and page shell agree")
    return 0


if __name__ == "__main__":
    sys.exit(main())
