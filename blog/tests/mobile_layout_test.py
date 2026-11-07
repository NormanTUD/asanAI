#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""Mobile layout audit for the blog and the Ten Minutes pages.

The audit renders every reader-facing page at phone widths with real touch
emulation and reports hard layout failures plus strict aesthetic warnings.
It is a measuring tool, not a fixer: it never edits lesson files.

Hard failures
  * page overflow, elements outside the viewport
  * elements wider than the reading column (layout guardrail)
  * overlapping or off-screen fixed controls
  * form controls below 16px (iOS zoom)
  * prose below 16px on phones
  * console errors and unrendered TeX

Strict warnings (fail with --strict)
  * tap targets below 44x44 px
  * cramped or over-wide prose lines
  * multi-column grids narrower than 240px
  * tiny charts, iframes and images
  * ellipsized text
  * very wide horizontal scrollers
  * fixed bottom UI covering too much of the screen

Outputs
  test-artifacts/mobile/report.md    readable summary
  test-artifacts/mobile/report.json  every finding
  test-artifacts/mobile/shots/       screenshots (when --shots is used)

Run from the repository root:
    uv run blog/tests/mobile_layout_test.py blog/ --self-test
    uv run blog/tests/mobile_layout_test.py blog/ --pages /math_i.php --widths 390 --strict
    uv run blog/tests/mobile_layout_test.py blog/ --strict --shots top

The PHP built-in server does not honour .user.ini / .htaccess, so the audit
starts it with blog/tests/mobile_test_prepend.php, which mirrors the production
mobile.css / mobile.js wiring for top-level blog pages and keeps the Ten
Minutes sub-site on its own bootstrap and stylesheet.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote


def _ensure_uv_run() -> None:
    if os.environ.get("_UV_RUN_ACTIVE") == "1":
        return
    uv = shutil.which("uv")
    if uv is None:
        sys.stderr.write(
            "This script needs uv. Install it with:\n"
            "  curl -LsSf https://astral.sh/uv/install.sh | sh\n"
        )
        raise SystemExit(127)
    env = dict(os.environ)
    env["_UV_RUN_ACTIVE"] = "1"
    cmd = [uv, "run", "--script", str(Path(__file__).resolve()), *sys.argv[1:]]
    if sys.platform == "win32":
        raise SystemExit(subprocess.run(cmd, env=env).returncode)
    os.execvpe(uv, cmd, env)


_ensure_uv_run()

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
TENMINUTES = BLOG / "tenminutes"
TEST_DIR = Path(__file__).resolve().parent
PREPEND = TEST_DIR / "mobile_test_prepend.php"
ARTIFACTS = ROOT / "test-artifacts" / "mobile"

DEFAULT_WIDTHS = "320x568,360x740,390x844,430x932"
DEFAULT_LANGS = "en,de"

SKIP_TENMINUTES = {"bootstrap.php", "globals.php"}
STANDALONE_PAGES = ("/atlas.php", "/graph.php", "/knowledge_map.php", "/december.php")

BENIGN_CONSOLE = (
    "favicon",
    "WebGL",
    "clearColor",
    "Error creating WebGL Context",
    "Failed to load resource: net::ERR_ABORTED",
    "net::ERR_BLOCKED_BY_CLIENT",
    "the server responded with a status of 404",
    "[layout-guardrail]",
)


READY_JS = r"""
return {
    rs: document.readyState,
    body: !!document.body,
    ready: document.documentElement.classList.contains('is-ready'),
    contents: (function () {
        var c = document.getElementById('contents');
        if (!c) return false;
        var cs = getComputedStyle(c);
        var r = c.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0;
    })()
};
"""


PROBE_JS = r"""
return (function () {
    'use strict';

    var vw = Math.round(document.documentElement.clientWidth || window.innerWidth || 0);
    var vh = Math.round(document.documentElement.clientHeight || window.innerHeight || 0);
    var root = document.getElementById('contents')
        || document.getElementById('main')
        || document.querySelector('main')
        || document.body;
    var out = { viewport: {}, findings: [], scrollers: [], guardrail: null };
    var seen = {};
    var CAP = 40;

    out.viewport = {
        width: vw,
        height: vh,
        dpr: window.devicePixelRatio || 1,
        hoverNone: !!(window.matchMedia && window.matchMedia('(hover: none)').matches),
        pointerCoarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    };

    function selOf(el) {
        if (!el || !el.tagName) return '?';
        var s = el.tagName.toLowerCase();
        if (el.id) s += '#' + el.id;
        var cls = el.getAttribute && el.getAttribute('class');
        if (cls) {
            var parts = cls.trim().split(/\s+/).filter(Boolean).slice(0, 2);
            if (parts.length) s += '.' + parts.join('.');
        }
        return s;
    }

    function push(id, severity, el, message, value) {
        var selector = selOf(el);
        var key = id + '|' + selector + '|' + String(value == null ? '' : value);
        if (seen[key]) return;
        if ((seen[id] || 0) >= CAP) return;
        seen[key] = true;
        seen[id] = (seen[id] || 0) + 1;
        out.findings.push({
            id: id,
            severity: severity,
            selector: selector,
            message: message || '',
            value: value == null ? '' : String(value)
        });
    }

    function visible(el) {
        if (!el || !el.getBoundingClientRect) return false;
        var p = el;
        while (p && p.nodeType === 1) {
            var cs = getComputedStyle(p);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (parseFloat(cs.opacity || '1') <= 0.01) return false;
            p = p.parentElement;
        }
        var r = el.getBoundingClientRect();
        return r.width > 0.5 && r.height > 0.5;
    }

    function matchesAny(el, selector) {
        try { return !!(el.matches && el.matches(selector)); } catch (e) { return false; }
    }

    function closestAny(el, selector) {
        try { return !!(el.closest && el.closest(selector)); } catch (e) { return false; }
    }

    function textOf(el) {
        return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function inOverlay(el) {
        var p = el;
        while (p && p !== document.body && p !== root) {
            var cs = getComputedStyle(p);
            if (cs.position === 'fixed' || cs.position === 'absolute') return true;
            p = p.parentElement;
        }
        return false;
    }

    function containedByScroller(el) {
        var p = el.parentElement;
        while (p && p !== root && p !== document.body) {
            var cs = getComputedStyle(p);
            if (/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 1) {
                return true;
            }
            if (/(hidden|clip)/.test(cs.overflowX)
                    && p.getBoundingClientRect().right <= vw + 1) {
                return true;
            }
            p = p.parentElement;
        }
        return false;
    }

    var EXEMPT = '.lg-scroll, .lg-widescroll, #lg-banner, .mnp-overlay, '
        + '.search-overlay, .drawer-panel, #cl-lb';

    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta || !/width\s*=\s*device-width/i.test(meta.getAttribute('content') || '')) {
        push('viewport_meta', 'hard', meta || document.head || document.documentElement,
            'missing width=device-width viewport meta',
            meta ? meta.getAttribute('content') : '');
    }

    var root_overflow = false;
    if (root && root !== document.body) {
        var rr = root.getBoundingClientRect();
        if (rr.width > 0 && (rr.left < -1 || rr.right > vw + 1)) {
            root_overflow = true;
            push('content_root_overflow', 'hard', root,
                'content root extends outside the viewport',
                Math.round(rr.left) + '..' + Math.round(rr.right) + ' in ' + vw);
        }
    }

    var PRUNE = {
        svg: 1, canvas: 1, math: 1, script: 1, style: 1, noscript: 1,
        template: 1, object: 1, embed: 1, iframe: 1
    };

    function inspect(el) {
        if (!visible(el)) return;
        var cs = getComputedStyle(el);
        var r = el.getBoundingClientRect();

        if (!root_overflow && !inOverlay(el) && !containedByScroller(el)) {
            if (r.left < -1 || r.right > vw + 1) {
                push('off_viewport', 'hard', el, 'extends outside the viewport',
                    Math.round(r.left) + '..' + Math.round(r.right) + ' in ' + vw);
            }
        }

        if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1
                && textOf(el)) {
            push('truncated_text', 'warn', el, 'text is ellipsized',
                textOf(el).slice(0, 60));
        }

        if (el.localName === 'img' && el.naturalWidth >= 300 && r.width < 140) {
            push('small_image', 'warn', el, 'image rendered very small',
                Math.round(r.width) + 'px (natural ' + el.naturalWidth + 'px)');
        }

        if (cs.display.indexOf('grid') !== -1) {
            var tracks = (cs.gridTemplateColumns || '')
                .split(/\s+/)
                .filter(function (x) { return /px$/.test(x); })
                .map(function (x) { return parseFloat(x); })
                .filter(function (n) { return isFinite(n); });
            if (tracks.length >= 2 && textOf(el).length > 40) {
                var min = Math.min.apply(Math, tracks);
                if (min < 240) {
                    push('cramped_grid', 'warn', el,
                        'multi-column grid is cramped on a phone',
                        'min track ' + Math.round(min) + 'px');
                }
            }
        }
    }

    function walk(node) {
        var kids = node.children;
        for (var i = 0; i < kids.length; i++) {
            var el = kids[i];
            if (el.nodeType !== 1) continue;
            if (!closestAny(el, EXEMPT)) inspect(el);
            if (!PRUNE[el.localName]) walk(el);
        }
    }

    walk(root || document.body);

    var chrome_selectors = [
        '#drawer-toggle', '#search-trigger', '#theme-toggle', '#topics-toggle',
        '#reader-toggle', '#paths-toggle', '#rag-chat-toggle', '#rag-chat-panel',
        '#chsw-dock', '.mnq-hud', '.mnr-resume', '#training-progress-bar-container',
        '#cl-mini-toc'
    ];
    var chrome = [];
    chrome_selectors.forEach(function (selector) {
        Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
            if (visible(el) && chrome.indexOf(el) === -1) chrome.push(el);
        });
    });

    chrome.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var cs = getComputedStyle(el);
        if (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1) {
            push('chrome_offscreen', 'hard', el, 'fixed control is outside the viewport',
                Math.round(r.left) + ',' + Math.round(r.top) + '..'
                + Math.round(r.right) + ',' + Math.round(r.bottom));
        }
        if ((cs.position === 'fixed' || cs.position === 'sticky')
                && r.bottom > vh * 0.5 && r.height > vh * 0.22) {
            push('bottom_ui_height', 'warn', el,
                'bottom UI takes a large share of the viewport',
                Math.round(r.height) + '/' + vh + 'px');
        }
    });

    for (var ci = 0; ci < chrome.length; ci++) {
        for (var cj = ci + 1; cj < chrome.length; cj++) {
            if (chrome[ci].contains(chrome[cj]) || chrome[cj].contains(chrome[ci])) continue;
            var a = chrome[ci].getBoundingClientRect();
            var b = chrome[cj].getBoundingClientRect();
            var ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            var iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ix > 4 && iy > 4) {
                push('chrome_overlap', 'hard', chrome[ci],
                    'overlaps ' + selOf(chrome[cj]),
                    Math.round(ix) + 'x' + Math.round(iy) + 'px');
            }
        }
    }

    var tap_selector = 'button,'
        + 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),'
        + 'select,textarea,summary,a.course-tile,.course-tile,.module-nav-link,'
        + '.mnq-opt,.mnp-opt,#toc a,.drawer-module,.drawer-link,[role="button"]';
    Array.prototype.forEach.call(document.querySelectorAll(tap_selector), function (el) {
        if (!visible(el) || el.disabled) return;
        if (closestAny(el, '#lg-banner, .mnp-overlay, .search-overlay, .topics-overlay, .drawer-panel')) return;
        var cs = getComputedStyle(el);
        if (el.tagName === 'A' && cs.display === 'inline'
                && !matchesAny(el, '.course-tile, .module-nav-link, #toc a, .drawer-module, .drawer-link')) {
            return;
        }
        var r = el.getBoundingClientRect();
        if (r.width < 43.5 || r.height < 43.5) {
            push('tap_target', 'warn', el, 'tap target smaller than 44x44',
                Math.round(r.width) + 'x' + Math.round(r.height));
        }
    });

    var prose_selector = '#contents .md p, #contents .md li, .prose p, .prose li';
    Array.prototype.forEach.call(document.querySelectorAll(prose_selector), function (el) {
        if (!visible(el)) return;
        if (closestAny(el, '.sideimage, .sidenote, .cl-block, .optional, table, '
                + 'figcaption, .toggleable-quote, .mnq-panel, .mnp-overlay')) {
            return;
        }
        var t = textOf(el);
        if (t.length < 60) return;
        var cs = getComputedStyle(el);
        var fs = parseFloat(cs.fontSize);
        if (!fs) return;
        var r = el.getBoundingClientRect();
        if (vw <= 600 && fs < 16) {
            push('prose_font', 'hard', el, 'prose text is smaller than 16px',
                fs.toFixed(1) + 'px');
        } else if (vw <= 600 && fs < 18) {
            push('prose_font', 'warn', el, 'prose text is smaller than 18px',
                fs.toFixed(1) + 'px');
        }
        var chars = r.width / (fs * 0.5);
        if (chars < 28) {
            push('line_length', 'warn', el, 'text column is very narrow',
                Math.round(chars) + ' characters');
        } else if (chars > 95) {
            push('line_length', 'warn', el, 'text column is very wide',
                Math.round(chars) + ' characters');
        }
    });

    var text_input_types = {
        text: 1, search: 1, number: 1, email: 1, tel: 1, url: 1,
        password: 1, date: 1, 'datetime-local': 1, month: 1, time: 1, week: 1
    };
    Array.prototype.forEach.call(document.querySelectorAll('input,select,textarea'), function (el) {
        if (el.localName === 'input') {
            var type = (el.getAttribute('type') || 'text').toLowerCase();
            if (!text_input_types[type]) return;
        }
        if (!visible(el)) return;
        var fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 16) {
            push('input_zoom', 'hard', el,
                'form control below 16px triggers iOS zoom', fs.toFixed(1) + 'px');
        }
    });

    var media_selector = '.js-plotly-plot, canvas, iframe, video, .echarts, .echarts-container';
    Array.prototype.forEach.call(document.querySelectorAll(media_selector), function (el) {
        if (!visible(el)) return;
        if (closestAny(el, '#lg-banner, .mnp-overlay, .search-overlay, .topics-overlay')) return;
        var r = el.getBoundingClientRect();
        if (el.localName === 'canvas' && r.width < 80 && r.height < 80) return;
        if (r.width < 260 || r.height < 100) {
            push('small_media', 'warn', el, 'interactive graphic is very small',
                Math.round(r.width) + 'x' + Math.round(r.height));
        }
    });

    var scroller_selector = 'pre, table, .tml-display, mjx-container[display="true"], '
        + '.lg-scroll, .lg-widescroll';
    Array.prototype.forEach.call(document.querySelectorAll(scroller_selector), function (el) {
        if (!visible(el)) return;
        var over = el.scrollWidth - el.clientWidth;
        if (over <= 2) return;
        var ratio = el.clientWidth ? el.scrollWidth / el.clientWidth : 0;
        out.scrollers.push({
            selector: selOf(el),
            clientWidth: Math.round(el.clientWidth),
            scrollWidth: Math.round(el.scrollWidth),
            ratio: Math.round(ratio * 100) / 100
        });
        if (ratio > 2 && !matchesAny(el, '.lg-scroll, .lg-widescroll')) {
            push('wide_scroller', 'warn', el,
                'horizontal scroller is more than twice its visible width',
                (Math.round(ratio * 100) / 100) + 'x');
        }
    });

    return out;
})();
"""


GUARDRAIL_JS = r"""
return (function () {
    if (typeof window.__layoutGuardrailCheck !== 'function') return null;
    var g;
    try { g = window.__layoutGuardrailCheck(); }
    catch (e) { return { error: String(e) }; }
    var out = {
        ready: !!g.ready,
        ok: g.ok,
        mode: g.mode || '',
        allowedPx: Math.round(g.allowedPx || 0),
        offenders: (g.offenders || []).slice(0, 60)
    };
    var banner = document.getElementById('lg-banner');
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    var flagged = document.querySelectorAll('.lg-overflow-flag');
    for (var i = 0; i < flagged.length; i++) {
        flagged[i].classList.remove('lg-overflow-flag', 'lg-flash');
        flagged[i].style.outline = '';
        flagged[i].style.outlineOffset = '';
        flagged[i].style.cursor = '';
    }
    return out;
})();
"""


SELF_TEST_HTML = """<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body{margin:0;font-family:sans-serif}
.block{width:700px;height:20px;background:#ccc}
</style></head><body>
<button id="drawer-toggle" style="position:fixed;top:8px;left:8px;width:44px;height:44px">A</button>
<button id="search-trigger" style="position:fixed;top:8px;left:40px;width:44px;height:44px">B</button>
<div id="contents">
  <div class="block">wide block</div>
  <button style="width:20px;height:20px">tiny</button>
  <div class="md"><p style="font-size:10px">This deliberately long fixture paragraph exists only to make the audit report a prose font size below the mobile floor, so the self test proves the detector is alive.</p></div>
</div>
</body></html>"""


@dataclass
class Finding:
    id: str
    severity: str
    selector: str = ""
    message: str = ""
    value: str = ""


@dataclass
class Run:
    page: str
    url: str
    width: int
    height: int
    lang: str = ""
    findings: list[Finding] = field(default_factory=list)
    screenshot: str = ""
    duration: float = 0.0
    guardrail: dict | None = None
    scrollers: list[dict] = field(default_factory=list)
    viewport: dict = field(default_factory=dict)
    error: str = ""

    @property
    def hard(self) -> list[Finding]:
        return [f for f in self.findings if f.severity == "hard"]

    @property
    def warn(self) -> list[Finding]:
        return [f for f in self.findings if f.severity == "warn"]


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def start_php_server(port: int) -> subprocess.Popen:
    cmd = [
        "php",
        "-d", f"auto_prepend_file={PREPEND}",
        "-d", "display_errors=0",
        "-S", f"127.0.0.1:{port}",
        "-t", str(BLOG),
    ]
    print(f"[php-server] {' '.join(cmd)}")
    env = dict(os.environ)
    env.setdefault("PHP_CLI_SERVER_WORKERS", "8")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        env=env,
        start_new_session=(os.name == "posix"),
    )
    time.sleep(1.2)
    if proc.poll() is not None:
        stderr = proc.stderr.read().decode(errors="replace") if proc.stderr else ""
        raise RuntimeError(f"PHP server failed to start: {stderr}")
    return proc


def get_chrome_driver(headless: bool = True) -> webdriver.Chrome:
    options = Options()
    args = [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--hide-scrollbars",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-software-rasterizer",
        "--window-size=1280,1000",
        "--force-device-scale-factor=1",
    ]
    if headless:
        args.insert(0, "--headless=new")
    for arg in args:
        options.add_argument(arg)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    options.set_capability("pageLoadStrategy", "none")

    chrome_binary = (
        shutil.which("chromium-browser")
        or shutil.which("chromium")
        or shutil.which("google-chrome")
    )
    if chrome_binary:
        options.binary_location = chrome_binary

    try:
        service = Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install())
        return webdriver.Chrome(service=service, options=options)
    except Exception:
        try:
            service = Service(ChromeDriverManager().install())
            return webdriver.Chrome(service=service, options=options)
        except Exception:
            return webdriver.Chrome(options=options)


def apply_viewport(driver: webdriver.Chrome, width: int, height: int) -> None:
    driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
        "width": width,
        "height": height,
        "screenWidth": width,
        "screenHeight": height,
        "deviceScaleFactor": 1,
        "mobile": True,
        "positionX": 0,
        "positionY": 0,
    })
    try:
        driver.execute_cdp_cmd("Emulation.setTouchEmulationEnabled", {
            "enabled": True,
            "maxTouchPoints": 5,
        })
    except Exception:
        pass
    try:
        driver.execute_cdp_cmd("Emulation.setEmulatedMedia", {
            "features": [{"name": "prefers-reduced-motion", "value": "reduce"}],
        })
    except Exception:
        pass
    try:
        driver.execute_script("window.dispatchEvent(new Event('resize'));")
    except Exception:
        pass
    time.sleep(0.25)


def drain_logs(driver: webdriver.Chrome) -> None:
    try:
        driver.get_log("browser")
    except Exception:
        pass


def wait_ready(driver: webdriver.Chrome, is_blog: bool, timeout: int) -> tuple[bool, dict]:
    deadline = time.time() + timeout
    state: dict = {}
    while time.time() < deadline:
        try:
            state = driver.execute_script(READY_JS) or {}
        except Exception:
            time.sleep(0.2)
            continue
        if state.get("body"):
            if is_blog:
                if state.get("ready") and state.get("contents"):
                    return True, state
            elif state.get("rs") in ("interactive", "complete"):
                return True, state
        time.sleep(0.25)
    return False, state


def wait_fonts(driver: webdriver.Chrome, timeout: int = 4) -> None:
    try:
        driver.set_script_timeout(timeout)
        driver.execute_async_script(
            "var done = arguments[0];"
            "if (!document.fonts || !document.fonts.ready) { done(true); return; }"
            "document.fonts.ready.then(function () { done(true); })"
            ".catch(function () { done(false); });"
        )
    except Exception:
        pass


def wait_math(driver: webdriver.Chrome, timeout: int) -> int:
    deadline = time.time() + timeout
    pending = -1
    while time.time() < deadline:
        try:
            pending = int(driver.execute_script(
                "return document.querySelectorAll("
                "'[data-tex]:not([data-tex-rendered=\"1\"])').length;"
            ))
        except Exception:
            return -1
        if pending == 0:
            return 0
        time.sleep(0.25)
    return pending


def scroll_through(driver: webdriver.Chrome, settle: float) -> None:
    try:
        height = int(driver.execute_script(
            "return Math.max(document.body ? document.body.scrollHeight : 0,"
            " document.documentElement.scrollHeight);"
        ))
        viewport = int(driver.execute_script(
            "return document.documentElement.clientHeight || window.innerHeight;"
        ))
        if height <= viewport:
            return
        stops = min(4, max(2, int((height - viewport) / max(viewport, 1)) + 1))
        for i in range(1, stops + 1):
            y = (height - viewport) * i / stops
            driver.execute_script("window.scrollTo(0, arguments[0]);", y)
            time.sleep(settle)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(settle)
    except Exception:
        pass


def read_console_errors(driver: webdriver.Chrome) -> list[str]:
    try:
        logs = driver.get_log("browser")
    except Exception:
        return []
    errors: list[str] = []
    for entry in logs:
        if entry.get("level") != "SEVERE":
            continue
        message = entry.get("message", "")
        if any(token.lower() in message.lower() for token in BENIGN_CONSOLE):
            continue
        errors.append(re.sub(r"\s+", " ", message)[:240])
    return errors


def discover_blog_pages() -> list[str]:
    pages = ["/index.php"]
    for path in sorted(BLOG.glob("*.php")):
        if path.name == "index.php":
            continue
        try:
            head = path.read_text(encoding="utf-8", errors="ignore")[:4096]
        except OSError:
            continue
        if "COURSE_METADATA" in head:
            pages.append("/" + path.name)
    return pages


def discover_tenminutes() -> list[str]:
    return [
        "/tenminutes/" + path.name
        for path in sorted(TENMINUTES.glob("*.php"))
        if path.name not in SKIP_TENMINUTES
    ]


def parse_viewports(raw: str) -> list[tuple[int, int]]:
    viewports: list[tuple[int, int]] = []
    for part in raw.split(","):
        part = part.strip().lower()
        if not part:
            continue
        match = re.fullmatch(r"(\d+)(?:x(\d+))?", part)
        if not match:
            raise SystemExit(f"invalid viewport: {part}")
        width = int(match.group(1))
        height = int(match.group(2) or round(width * 2.164))
        viewports.append((width, height))
    if not viewports:
        raise SystemExit("no viewports selected")
    return viewports


def filter_pages(pages: list[str], wanted: list[str] | None) -> list[str]:
    if not wanted:
        return pages
    selected: list[str] = []
    for page in pages:
        norm = page.lstrip("/")
        stem = norm[:-4] if norm.endswith(".php") else norm
        for item in wanted:
            item = item.strip().lstrip("/")
            if not item:
                continue
            item_stem = item[:-4] if item.endswith(".php") else item
            if "/" in item:
                if norm == item or norm == item_stem + ".php":
                    selected.append(page)
                    break
            elif page.count("/") == 1 and stem == item_stem:
                selected.append(page)
                break
    return selected


def slug_for(page: str, lang: str) -> str:
    slug = page.strip("/").replace("/", "__")
    if slug.endswith(".php"):
        slug = slug[:-4]
    if lang:
        slug += "__" + lang
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", slug)


def capture_screenshots(
    driver: webdriver.Chrome,
    page: str,
    lang: str,
    width: int,
    mode: str,
) -> str:
    if mode == "none":
        return ""
    outdir = ARTIFACTS / "shots" / str(width)
    outdir.mkdir(parents=True, exist_ok=True)
    slug = slug_for(page, lang)
    positions = [("top", 0.0)]
    if mode == "three":
        positions = [("top", 0.0), ("middle", 0.5), ("bottom", 1.0)]
    paths: list[str] = []
    for label, fraction in positions:
        try:
            driver.execute_script(
                "var h = Math.max(document.body ? document.body.scrollHeight : 0,"
                " document.documentElement.scrollHeight);"
                "var vh = document.documentElement.clientHeight || window.innerHeight;"
                "window.scrollTo(0, Math.max(0, (h - vh) * arguments[0]));",
                fraction,
            )
            time.sleep(0.15)
            data = driver.execute_cdp_cmd("Page.captureScreenshot", {
                "format": "png",
                "fromSurface": True,
                "captureBeyondViewport": False,
            })
            path = outdir / f"{slug}__{label}.png"
            path.write_bytes(base64.b64decode(data["data"]))
            paths.append(str(path.relative_to(ROOT)))
        except Exception:
            continue
    try:
        driver.execute_script("window.scrollTo(0, 0);")
    except Exception:
        pass
    return paths[0] if paths else ""


def load_page(driver: webdriver.Chrome, url: str) -> None:
    """Start a navigation and wait until the new document is the active one.

    pageLoadStrategy=none returns from driver.get() as soon as the navigation
    is accepted. Without this check the first execute_script can still run
    against the previous document, which produces occasional false
    not_ready results on heavy pages.
    """
    try:
        driver.get(url)
    except Exception:
        return
    target = url.split("#", 1)[0]
    deadline = time.time() + 5
    while time.time() < deadline:
        try:
            href = driver.execute_script("return location.href;") or ""
        except Exception:
            time.sleep(0.1)
            continue
        if href.split("#", 1)[0] == target:
            return
        time.sleep(0.1)


def run_page(
    driver: webdriver.Chrome,
    base: str,
    page: str,
    width: int,
    height: int,
    lang: str,
    args: argparse.Namespace,
) -> Run:
    started = time.time()
    is_blog = not page.startswith("/tenminutes/")
    url = base + page
    if lang:
        url += ("&" if "?" in url else "?") + "lang=" + lang
    run = Run(page=page, url=url, width=width, height=height, lang=lang)

    try:
        driver.get("about:blank")
    except Exception:
        pass
    drain_logs(driver)
    try:
        driver.set_window_rect(0, 0, width, height)
    except Exception:
        pass
    try:
        load_page(driver, url)
    except Exception as exc:
        run.error = f"navigation failed: {exc}"
        run.findings.append(Finding("load_error", "hard", message=run.error))
        run.duration = time.time() - started
        return run

    apply_viewport(driver, width, height)
    ready, state = wait_ready(driver, is_blog, args.timeout)
    if not ready:
        # A single reload clears the occasional race after a heavy page.
        load_page(driver, url)
        apply_viewport(driver, width, height)
        ready, state = wait_ready(driver, is_blog, max(8, args.timeout // 2))
    if not ready:
        if (is_blog and not state.get("contents")) or (not is_blog and not state.get("body")):
            run.error = f"page did not become measurable: {state}"
            run.findings.append(Finding("not_ready", "hard", message=run.error))
            run.duration = time.time() - started
            return run
        run.findings.append(Finding(
            "not_ready", "warn", message="page did not signal full readiness",
            value=str(state),
        ))

    apply_viewport(driver, width, height)
    wait_fonts(driver)
    scroll_through(driver, args.settle)

    if not is_blog:
        pending = wait_math(driver, args.math_timeout)
        if pending > 0:
            run.findings.append(Finding(
                "unrendered_math", "hard",
                message=f"{pending} TeX element(s) were not rendered",
            ))

    try:
        probe = driver.execute_script(PROBE_JS) or {}
    except Exception as exc:
        probe = {}
        run.findings.append(Finding("probe_error", "hard", message=f"probe failed: {exc}"))

    for raw in probe.get("findings", []):
        run.findings.append(Finding(
            id=str(raw.get("id", "?")),
            severity=str(raw.get("severity", "warn")),
            selector=str(raw.get("selector", "")),
            message=str(raw.get("message", "")),
            value=str(raw.get("value", "")),
        ))
    run.scrollers = probe.get("scrollers", []) or []
    run.viewport = probe.get("viewport", {}) or {}

    if width <= 600 and (
        not run.viewport.get("hoverNone") or not run.viewport.get("pointerCoarse")
    ):
        run.findings.append(Finding(
            "touch_emulation", "warn",
            message="emulation did not report hover:none / pointer:coarse",
            value=f"hover:none={run.viewport.get('hoverNone')}, "
                  f"pointer:coarse={run.viewport.get('pointerCoarse')}",
        ))

    for message in read_console_errors(driver):
        run.findings.append(Finding("console_error", "hard", message=message))

    run.screenshot = capture_screenshots(driver, page, lang, width, args.shots)

    if is_blog:
        try:
            guardrail = driver.execute_script(GUARDRAIL_JS)
        except Exception as exc:
            guardrail = None
            run.findings.append(Finding(
                "guardrail_error", "warn",
                message=f"layout guardrail failed: {exc}",
            ))
        run.guardrail = guardrail
        if guardrail:
            if guardrail.get("ready") and guardrail.get("ok") is False:
                allowed = str(guardrail.get("allowedPx", ""))
                for selector in guardrail.get("offenders", []):
                    run.findings.append(Finding(
                        "guardrail_overflow", "hard", selector=selector,
                        message="element is wider than the reading column",
                        value=allowed + "px",
                    ))
            elif not guardrail.get("ready"):
                run.findings.append(Finding(
                    "guardrail_not_ready", "warn", selector="#contents",
                    message="layout guardrail could not measure the column",
                ))

    run.duration = time.time() - started
    return run


def self_test(driver: webdriver.Chrome) -> int:
    try:
        driver.set_window_rect(0, 0, 390, 844)
    except Exception:
        pass
    url = "data:text/html;charset=utf-8," + quote(SELF_TEST_HTML)
    try:
        driver.get(url)
        apply_viewport(driver, 390, 844)
        time.sleep(0.5)
        probe = driver.execute_script(PROBE_JS) or {}
    except Exception as exc:
        print(f"[self-test] FAIL: probe crashed: {exc}")
        return 1

    findings = probe.get("findings", [])
    ids = {item.get("id") for item in findings}
    required = {"off_viewport", "tap_target", "chrome_overlap", "prose_font"}
    missing = required - ids
    viewport = probe.get("viewport", {})

    print(f"[self-test] findings: {sorted(ids)}")
    print(f"[self-test] viewport: {viewport}")
    if missing:
        print(f"[self-test] FAIL: detector missed {sorted(missing)}")
        return 1
    if not viewport.get("hoverNone") or not viewport.get("pointerCoarse"):
        print("[self-test] FAIL: touch emulation is not active "
              "(hover:none / pointer:coarse missing)")
        return 1
    print("[self-test] PASS: overflow, tap target, chrome overlap and "
          "prose font detectors are alive")
    return 0


def write_reports(
    runs: list[Run],
    args: argparse.Namespace,
    started: datetime,
    elapsed: float,
) -> tuple[int, int]:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    hard_total = sum(len(run.hard) for run in runs)
    warn_total = sum(len(run.warn) for run in runs)
    pages = sorted({run.page for run in runs})
    failing_pages = sorted({
        run.page for run in runs if run.hard or (args.strict and run.warn)
    })

    patterns: Counter[tuple[str, str]] = Counter()
    pattern_pages: defaultdict[tuple[str, str], list[str]] = defaultdict(list)
    for run in runs:
        for finding in run.findings:
            if finding.severity == "info":
                continue
            key = (finding.id, finding.selector)
            patterns[key] += 1
            if len(pattern_pages[key]) < 6 and run.page not in pattern_pages[key]:
                pattern_pages[key].append(run.page)

    per_page: defaultdict[str, dict[str, int]] = defaultdict(
        lambda: {"runs": 0, "hard": 0, "warn": 0}
    )
    per_page_widths: defaultdict[str, set[int]] = defaultdict(set)
    for run in runs:
        entry = per_page[run.page]
        entry["runs"] += 1
        entry["hard"] += len(run.hard)
        entry["warn"] += len(run.warn)
        if run.hard or run.warn:
            per_page_widths[run.page].add(run.width)

    baseline_diff: dict[str, list[str]] = {}
    baseline_path = Path(args.baseline).resolve() if args.baseline else None
    if baseline_path and baseline_path.is_file():
        try:
            previous = json.loads(baseline_path.read_text(encoding="utf-8"))
            old = {
                (item.get("page"), item.get("width"), item.get("lang"),
                 item.get("id"), item.get("selector"))
                for item in previous.get("findings", [])
            }
            new = {
                (run.page, run.width, run.lang, finding.id, finding.selector)
                for run in runs for finding in run.findings
                if finding.severity != "info"
            }
            baseline_diff["new"] = sorted(
                f"{page} @{width}px {lang or '-'} {fid} {selector}"
                for page, width, lang, fid, selector in new - old
            )[:200]
            baseline_diff["fixed"] = sorted(
                f"{page} @{width}px {lang or '-'} {fid} {selector}"
                for page, width, lang, fid, selector in old - new
            )[:200]
        except Exception as exc:
            baseline_diff["error"] = [f"could not read baseline: {exc}"]

    if args.write_baseline:
        baseline_out = Path(args.write_baseline).resolve()
        baseline_out.parent.mkdir(parents=True, exist_ok=True)
        baseline_out.write_text(json.dumps({
            "generated_at": started.isoformat(timespec="seconds"),
            "findings": [
                {
                    "page": run.page,
                    "width": run.width,
                    "lang": run.lang,
                    "id": finding.id,
                    "selector": finding.selector,
                }
                for run in runs for finding in run.findings
                if finding.severity != "info"
            ],
        }, indent=2) + "\n", encoding="utf-8")

    data = {
        "generated_at": started.isoformat(timespec="seconds"),
        "elapsed_seconds": round(elapsed, 1),
        "command": " ".join(sys.argv),
        "viewports": [{"width": w, "height": h} for w, h in parse_viewports(args.widths)],
        "strict": bool(args.strict),
        "summary": {
            "runs": len(runs),
            "pages": len(pages),
            "failing_pages": len(failing_pages),
            "hard": hard_total,
            "warn": warn_total,
        },
        "runs": [
            {
                "page": run.page,
                "url": run.url,
                "width": run.width,
                "height": run.height,
                "lang": run.lang,
                "duration": round(run.duration, 2),
                "screenshot": run.screenshot,
                "guardrail": run.guardrail,
                "viewport": run.viewport,
                "scrollers": run.scrollers,
                "error": run.error,
                "findings": [finding.__dict__ for finding in run.findings],
            }
            for run in runs
        ],
    }
    (ARTIFACTS / "report.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    lines: list[str] = [
        "# Mobile layout report",
        "",
        f"Generated: {started.isoformat(timespec='seconds')}",
        f"Elapsed: {elapsed / 60:.1f} min",
        f"Command: `{data['command']}`",
        "",
        "## Summary",
        "",
        f"- Runs: **{len(runs)}** across **{len(pages)}** pages and "
        f"**{len(data['viewports'])}** viewports",
        f"- Hard findings: **{hard_total}**",
        f"- Strict warnings: **{warn_total}**",
        f"- Pages with findings: **{len(failing_pages)}**",
        f"- Strict mode: **{'on' if args.strict else 'off'}**",
        "",
        "Full data: `test-artifacts/mobile/report.json`. "
        "Screenshots: `test-artifacts/mobile/shots/`.",
        "",
        "## Top patterns",
        "",
        "| Check | Selector | Count | Example pages |",
        "|---|---|---:|---|",
    ]
    for (fid, selector), count in patterns.most_common(30):
        examples = ", ".join(f"`{page}`" for page in pattern_pages[(fid, selector)][:4])
        lines.append(f"| `{fid}` | `{selector}` | {count} | {examples} |")

    lines.extend([
        "",
        "## Pages with the most findings",
        "",
        "| Page | Widths | Hard | Warn |",
        "|---|---|---:|---:|",
    ])
    ranked = sorted(
        per_page.items(),
        key=lambda item: (item[1]["hard"], item[1]["warn"]),
        reverse=True,
    )
    for page, counts in ranked[:40]:
        if counts["hard"] == 0 and counts["warn"] == 0:
            continue
        widths = ", ".join(str(w) for w in sorted(per_page_widths[page]))
        lines.append(
            f"| `{page}` | {widths} | {counts['hard']} | {counts['warn']} |"
        )

    if baseline_diff.get("new") or baseline_diff.get("fixed") or baseline_diff.get("error"):
        lines.extend(["", "## Baseline diff", ""])
        if baseline_diff.get("error"):
            lines.append(f"- {baseline_diff['error'][0]}")
        if baseline_diff.get("new"):
            lines.extend(["New findings:"] + [f"- `{item}`" for item in baseline_diff["new"][:40]])
        if baseline_diff.get("fixed"):
            lines.extend(["Resolved findings:"] + [f"- `{item}`" for item in baseline_diff["fixed"][:40]])

    lines.extend(["", "## Details", ""])
    detail_runs = sorted(
        (run for run in runs if run.hard or run.warn),
        key=lambda run: (len(run.hard), len(run.warn)),
        reverse=True,
    )
    for run in detail_runs[:25]:
        label = run.page + (f" [{run.lang}]" if run.lang else "")
        lines.append(f"### `{label}` at {run.width}x{run.height}")
        lines.append("")
        if run.error:
            lines.append(f"- ERROR: {run.error}")
        shown = 0
        for finding in run.findings:
            if finding.severity == "info":
                continue
            if shown >= 12:
                lines.append("- ...")
                break
            extra = f" ({finding.value})" if finding.value else ""
            selector = f" `{finding.selector}`" if finding.selector else ""
            lines.append(
                f"- **{finding.severity.upper()}** `{finding.id}`{selector}: "
                f"{finding.message}{extra}"
            )
            shown += 1
        if run.screenshot:
            lines.append(f"- Screenshot: `{run.screenshot}`")
        lines.append("")

    report = "\n".join(lines).rstrip() + "\n"
    (ARTIFACTS / "report.md").write_text(report, encoding="utf-8")
    if args.report:
        target = Path(args.report)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(report, encoding="utf-8")

    print("")
    print("=" * 70)
    print("MOBILE AUDIT SUMMARY")
    print("=" * 70)
    print(f"  runs          : {len(runs)}")
    print(f"  pages         : {len(pages)}")
    print(f"  hard findings : {hard_total}")
    print(f"  warnings      : {warn_total}")
    print(f"  failing pages : {len(failing_pages)}")
    print("")
    print("  Top patterns:")
    for (fid, selector), count in patterns.most_common(12):
        print(f"    {count:4d}  {fid}  {selector}")
    print("")
    print(f"  Report: {ARTIFACTS / 'report.md'}")
    print(f"  JSON  : {ARTIFACTS / 'report.json'}")
    if args.write_baseline:
        print(f"  Baseline written: {Path(args.write_baseline).resolve()}")

    return hard_total, warn_total


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit the blog and Ten Minutes pages at phone widths.",
    )
    parser.add_argument("document_root", nargs="?", default="blog",
                        help="PHP document root (default: blog)")
    parser.add_argument("--pages", nargs="*", default=None,
                        help="only these pages (e.g. /math_i.php tenminutes/intuition)")
    parser.add_argument("--widths", default=DEFAULT_WIDTHS,
                        help=f"comma-separated WIDTHxHEIGHT list (default: {DEFAULT_WIDTHS})")
    parser.add_argument("--langs", default=DEFAULT_LANGS,
                        help="comma-separated Ten Minutes languages (default: en,de)")
    parser.add_argument("--no-tenminutes", action="store_true",
                        help="skip the Ten Minutes sub-site")
    parser.add_argument("--standalone", action="store_true",
                        help="also audit atlas, graph, knowledge_map and december")
    parser.add_argument("--strict", action="store_true",
                        help="treat aesthetic warnings as failures (exit 3)")
    parser.add_argument("--shots", choices=("none", "top", "three"), default="top",
                        help="screenshot mode (default: top)")
    parser.add_argument("--settle", type=float, default=0.2,
                        help="seconds to wait after each scroll step (default: 0.35)")
    parser.add_argument("--timeout", type=int, default=20,
                        help="seconds to wait for a page to become measurable")
    parser.add_argument("--math-timeout", type=int, default=8,
                        help="seconds to wait for TeX rendering")
    parser.add_argument("--max-pages", type=int, default=0,
                        help="limit the number of pages (0 = all)")
    parser.add_argument("--report", default=None,
                        help="also write the markdown report to this path")
    parser.add_argument("--baseline", default=None,
                        help="compare against a previously written baseline JSON")
    parser.add_argument("--write-baseline", default=None,
                        help="write the current findings as a baseline JSON")
    parser.add_argument("--self-test", action="store_true",
                        help="run the detector self-test and exit")
    parser.add_argument("--no-headless", action="store_true",
                        help="run a visible browser for debugging")
    parser.add_argument("--verbose", action="store_true",
                        help="print every finding while running")
    args = parser.parse_args()

    document_root = Path(args.document_root)
    if document_root.resolve() != BLOG.resolve():
        parser.error(f"document_root must be {BLOG} (the test prepend mirrors it)")
    if not PREPEND.is_file():
        parser.error(f"missing test prepend: {PREPEND}")
    if not shutil.which("php"):
        parser.error("PHP CLI not found")

    viewports = parse_viewports(args.widths)
    langs = [item.strip() for item in args.langs.split(",") if item.strip()]

    if args.self_test:
        driver = get_chrome_driver(headless=not args.no_headless)
        try:
            return self_test(driver)
        finally:
            driver.quit()

    pages = discover_blog_pages()
    if not args.no_tenminutes:
        pages += discover_tenminutes()
    if args.standalone:
        pages += list(STANDALONE_PAGES)
    pages = filter_pages(pages, args.pages)
    if not pages:
        parser.error("no pages selected")
    if args.max_pages and args.max_pages > 0:
        pages = pages[:args.max_pages]

    port = free_port()
    base = f"http://127.0.0.1:{port}"
    started = datetime.now(timezone.utc)
    started_at = time.time()

    server = start_php_server(port)
    driver = None
    runs: list[Run] = []
    try:
        driver = get_chrome_driver(headless=not args.no_headless)
        total = sum(
            len(langs) if page.startswith("/tenminutes/") else 1
            for page in pages
        ) * len(viewports)
        done = 0
        for page in pages:
            page_langs = langs if page.startswith("/tenminutes/") else [""]
            for width, height in viewports:
                for lang in page_langs:
                    done += 1
                    run = run_page(driver, base, page, width, height, lang, args)
                    runs.append(run)
                    flag = "HARD" if run.hard else ("warn" if run.warn else "ok")
                    label = page + (f" [{lang}]" if lang else "")
                    print(
                        f"[{done:>3}/{total}] {label} @ {width}x{height}: "
                        f"{flag} hard={len(run.hard)} warn={len(run.warn)} "
                        f"({run.duration:.1f}s)"
                    )
                    if args.verbose:
                        for finding in run.findings:
                            print(f"    {finding.severity:4s} {finding.id} "
                                  f"{finding.selector} {finding.message} {finding.value}")
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        try:
            if os.name == "posix":
                os.killpg(os.getpgid(server.pid), 15)
            else:
                server.terminate()
            server.wait(timeout=5)
        except Exception:
            try:
                server.kill()
            except Exception:
                pass

    elapsed = time.time() - started_at
    hard_total, warn_total = write_reports(runs, args, started, elapsed)

    if hard_total:
        print(f"\nFAIL: {hard_total} hard finding(s)")
        return 2
    if args.strict and warn_total:
        print(f"\nFAIL (strict): {warn_total} warning(s)")
        return 3
    print("\nPASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
