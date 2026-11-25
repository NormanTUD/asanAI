#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright",
# ]
# ///
"""Stress and interaction tests for the eoy media/phone demo.

Covers the first "Wie funktionieren Sprachmodelle?" slide: the search page,
the swipe-up navigation bar, the phone desktop, the KI-Chat app and the code
desktop. The tests deliberately do the things a reader does badly: double
click, sprint through the deck, click randomly, resize, switch tabs during an
animation, call the public API with invalid values, and repeat transitions.

Local editing is turned off for every page through an init script that pins
``window.TM_LOCAL_EDITOR`` to false. The test never touches the developer's
``.local-editor`` file.

Run from the repository root:

    uv run --with playwright python3 blog/tests/eoy_media_interactions_test.py
    uv run --with playwright python3 blog/tests/eoy_media_interactions_test.py --langs de
    uv run --with playwright python3 blog/tests/eoy_media_interactions_test.py --deep
"""

import argparse
import json
import math
import random
import shutil
import socket
import subprocess
import sys
import time
import traceback
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
PAGE = "/eoy/1.php"
INDEX = "/eoy/index.php"

BENIGN = (
    "favicon",
    "Failed to load resource: net::ERR_ABORTED",
    "net::ERR_ABORTED",
    "WebGL",
    "Error creating WebGL Context",
    "Permissions policy violation",
    "AudioContext",
)

INIT_SCRIPT = r"""
try {
  Object.defineProperty(window, "TM_LOCAL_EDITOR", {
    configurable: true,
    get: function () { return false; },
    set: function () {}
  });
} catch (e) {}
try {
  window.__eoyCls = 0;
  new PerformanceObserver(function (list) {
    list.getEntries().forEach(function (entry) {
      if (!entry.hadRecentInput) window.__eoyCls += entry.value;
    });
  }).observe({ type: "layout-shift", buffered: true });
} catch (e) {}
document.addEventListener("click", function (event) {
  var anchor = event.target && event.target.closest ? event.target.closest("a") : null;
  if (anchor) event.preventDefault();
}, true);
"""

VISIBLE_CONTROLS = r"""
function eoyVisible(el) {
  var r = el.getBoundingClientRect();
  var cs = getComputedStyle(el);
  if (r.width < 3 || r.height < 3) return false;
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  if (parseFloat(cs.opacity || "1") < 0.05) return false;
  if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
  return true;
}
function eoyControls() {
  return Array.prototype.slice.call(document.querySelectorAll(
    "button,[role=button],a,input,select,textarea,summary,.ls-chip,.ls-term,.ls-dot," +
    "[data-pos],.ls-cal-card,.optional-header"
  )).filter(eoyVisible);
}
"""


class Results:
    def __init__(self):
        self.checks = 0
        self.failures = []

    def check(self, tag, name, ok, detail=""):
        self.checks += 1
        if ok:
            return True
        self.failures.append((tag, name, detail))
        print(f"  FAIL {tag} :: {name}" + (f" — {detail}" if detail else ""))
        return False

    def fail(self, tag, name, detail=""):
        return self.check(tag, name, False, detail)


class PageLog:
    def __init__(self, page, extra_benign=()):
        self.messages = []
        self.benign = tuple(BENIGN) + tuple(extra_benign)
        page.on("pageerror", lambda exc: self.messages.append("pageerror: " + str(exc)))
        page.on("console", lambda msg: self.messages.append("console: " + msg.text) if msg.type == "error" else None)

    def take(self):
        fresh = [m for m in self.messages if not any(token in m for token in self.benign)]
        self.messages = []
        return fresh


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def serve(port):
    php = shutil.which("php")
    if not php:
        raise SystemExit("php is not on PATH")
    return subprocess.Popen(
        [php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_server(port, timeout=10):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return True
        except OSError:
            time.sleep(0.05)
    return False


def launch_browser(playwright):
    attempts = [
        {"channel": "chrome"},
        {"executable_path": shutil.which("chromium")},
        {"executable_path": shutil.which("chromium-browser")},
        {},
    ]
    errors = []
    for attempt in attempts:
        if attempt.get("executable_path") is None and "executable_path" in attempt:
            continue
        try:
            return playwright.chromium.launch(headless=True, args=["--no-sandbox"], **attempt)
        except Exception as exc:
            errors.append(str(exc).splitlines()[0])
    try:
        subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
        )
        return playwright.chromium.launch(headless=True, args=["--no-sandbox"])
    except Exception:
        raise SystemExit("Could not launch Chromium: " + " | ".join(errors))


def wait_any(page):
    page.wait_for_function(
        "() => window.LearnSys && document.querySelector('#ls-title')",
        timeout=30000,
    )
    page.wait_for_timeout(400)


def open_page(browser, base, lang, viewport=None, reduced_motion="no-preference", mobile=False, path=PAGE, wait_media=True):
    context = browser.new_context(
        viewport=viewport or {"width": 1440, "height": 1000},
        reduced_motion=reduced_motion,
        has_touch=mobile,
        is_mobile=mobile,
        device_scale_factor=2 if mobile else 1,
    )
    page = context.new_page()
    page.set_default_timeout(6000)
    page.add_init_script(INIT_SCRIPT)
    logs = PageLog(page)
    sep = "&" if "?" in path else "?"
    page.goto(f"{base}{path}{sep}lang={lang}", wait_until="load", timeout=30000)
    if wait_media:
        wait_ready(page)
    else:
        wait_any(page)
    return context, page, logs


def wait_ready(page):
    page.wait_for_function(
        "() => window.LearnSys && document.querySelector('#ls-title')",
        timeout=30000,
    )
    page.wait_for_function("() => !!document.querySelector('.ls-media-scene')", timeout=15000)
    page.wait_for_timeout(250)


def state(page):
    return page.evaluate(
        r"""
() => {
  var q = function (s) { return document.querySelector(s); };
  var search = q("#ia-phone");
  var chat = q("#ia-chat-phone");
  var home = q("#ia-home");
  var nav = q(".ia-phone-navbar");
  var code = q('[data-layer="code"]');
  var status = q(".ia-home-status");
  var time = q(".ia-home-time");
  var stage = q(".ls-media-stage");
  var phone = q(".ia-phone");
  function rect(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }
  return {
    present: !!q(".ls-media-scene"),
    search: !!(search && search.classList.contains("is-active")),
    chat: !!(chat && chat.classList.contains("is-active")),
    home: !!(home && home.classList.contains("is-active")),
    codeVisible: !!(code && !code.hidden),
    navHidden: nav ? nav.hidden : null,
    navUp: nav ? nav.classList.contains("is-up") : null,
    navBottom: nav ? parseFloat(getComputedStyle(nav).bottom) : null,
    navRect: rect(nav),
    statusTop: status ? parseFloat(getComputedStyle(status).top) : null,
    statusHeight: status ? Math.round(status.getBoundingClientRect().height) : null,
    time: time ? time.textContent.trim() : "",
    signal: !!q(".ia-status-signal"),
    wifi: !!q(".ia-status-wifi"),
    battery: !!q(".ia-status-battery"),
    progress: q(".ls-media-progress") ? q(".ls-media-progress").textContent : "",
    chip: (function () { var c = q(".ls-media-tabs .is-on"); return c ? c.getAttribute("data-media") : null; })(),
    phoneRect: rect(phone),
    stageRect: rect(stage),
    title: (q("#ls-title") || {}).textContent || "",
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    localEditor: window.TM_LOCAL_EDITOR,
    editVisible: !!(q("#ls-edit-btn") && q("#ls-edit-btn").offsetParent !== null),
  };
}
"""
    )


def invariant(page):
    current = state(page)
    if not current["present"]:
        return True, current, ""
    active = int(current["search"]) + int(current["chat"]) + int(current["home"])
    if current["codeVisible"]:
        if active > 1:
            return False, current, "more than one phone screen active while code is visible"
    elif active != 1:
        return False, current, f"expected exactly one phone screen active, got {active}"
    if current["navHidden"] and current["navUp"]:
        return False, current, "nav is hidden but still marked as up"
    return True, current, ""


def test_initial(page, logs, results, tag):
    current = state(page)
    results.check(tag, "media scene present", current["present"], str(current))
    results.check(
        tag,
        "search screen is active first",
        current["search"] and not current["chat"] and not current["home"] and not current["codeVisible"],
        str(current),
    )
    results.check(tag, "nav bar is hidden before advancing", current["navHidden"], str(current))
    results.check(tag, "local editing is disabled", current["localEditor"] is False and not current["editVisible"], str(current))
    page.wait_for_timeout(1800)
    current = state(page)
    results.check(tag, "nav bar stays hidden while the search page is idle", current["navHidden"], str(current))
    results.check(tag, "nav bar lives at the bottom", 0 < (current["navBottom"] or 0) < 300, str(current["navBottom"]))
    results.check(
        tag,
        "status bar is a top lane with time and phone icons",
        current["statusTop"] == 0
        and (current["statusHeight"] or 0) >= 40
        and bool(current["time"])
        and current["signal"]
        and current["wifi"]
        and current["battery"],
        str(current),
    )
    results.check(tag, "initial page has no horizontal overflow", current["overflow"] <= 2, str(current["overflow"]))
    errors = logs.take()
    results.check(tag, "initial page has no console errors", not errors, " | ".join(errors)[:400])


def test_accessibility(page, logs, results, tag):
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    info = page.evaluate(
        r"""
() => {
  var home = document.querySelector('#ia-home');
  var search = document.querySelector('#ia-phone');
  var app = document.querySelector('[data-home-app="chat"]');
  return {
    homeAria: home.getAttribute('aria-hidden'),
    homeInert: home.inert,
    appTab: app.tabIndex,
    searchAria: search.getAttribute('aria-hidden'),
    searchInert: search.inert
  };
}
"""
    )
    results.check(tag, "inactive home screen is inert", info["homeInert"] is True and info["homeAria"] == "true", str(info))
    results.check(tag, "inactive KI-Chat app is not tabbable", info["appTab"] == -1, str(info))
    results.check(tag, "active search screen is not inert", info["searchInert"] is False and info["searchAria"] == "false", str(info))

    page.evaluate("() => { document.body.setAttribute('tabindex', '-1'); document.body.focus(); }")
    landed_home = None
    for _ in range(15):
        page.keyboard.press("Tab")
        active = page.evaluate(
            r"""
() => {
  var a = document.activeElement;
  return {
    tag: a.tagName,
    text: (a.textContent || '').trim().slice(0, 36),
    inHome: !!(a.closest && a.closest('#ia-home')),
    inChat: !!(a.closest && a.closest('#ia-chat-phone'))
  };
}
"""
        )
        if active["inHome"]:
            landed_home = active
            break
    results.check(tag, "tab order never enters the inactive home screen", landed_home is None, str(landed_home))

    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(750)
    mid = page.evaluate(
        r"""
() => {
  var home = document.querySelector('#ia-home');
  var app = document.querySelector('[data-home-app="chat"]');
  return {
    active: home.classList.contains('is-active'),
    aria: home.getAttribute('aria-hidden'),
    inert: home.inert,
    tab: app.tabIndex
  };
}
"""
    )
    results.check(
        tag,
        "desktop becomes interactive while it is shown",
        mid["active"] and mid["aria"] == "false" and mid["inert"] is False and mid["tab"] == 0,
        str(mid),
    )
    page.wait_for_timeout(1800)
    after = page.evaluate(
        r"""
() => {
  var home = document.querySelector('#ia-home');
  var app = document.querySelector('[data-home-app="chat"]');
  return { aria: home.getAttribute('aria-hidden'), inert: home.inert, tab: app.tabIndex };
}
"""
    )
    results.check(
        tag,
        "desktop becomes inert again after the chat opens",
        after["aria"] == "true" and after["inert"] is True and after["tab"] == -1,
        str(after),
    )
    errors = logs.take()
    results.check(tag, "accessibility pass has no console errors", not errors, " | ".join(errors)[:400])


def sample_launch(page, trigger="chip"):
    return page.evaluate(
        r"""
(triggerName) => new Promise((resolve) => {
  var q = function (s) { return document.querySelector(s); };
  var home = q("#ia-home");
  var chat = q("#ia-chat-phone");
  var search = q("#ia-phone");
  var nav = q(".ia-phone-navbar");
  var chip = q('[data-media="chat"]');
  var baselineCls = window.__eoyCls || 0;
  var start = performance.now();
  var last = start;
  var frames = 0;
  var maxFrame = 0;
  var sumFrame = 0;
  var sawHome = false;
  var navOnSearch = false;
  var navOnHome = false;
  var navOnChat = false;
  var sawNav = false;
  var sawNavSlide = false;
  var minSum = 99;
  var samples = 0;

  function navOffset() {
    var transform = getComputedStyle(nav).transform;
    if (!transform || transform === "none") return 0;
    try { return new DOMMatrixReadOnly(transform).m42; } catch (e) { return 0; }
  }

  function sample() {
    var now = performance.now();
    var dt = now - last;
    last = now;
    if (frames > 0) {
      maxFrame = Math.max(maxFrame, dt);
      sumFrame += dt;
    }
    frames++;
    samples++;
    var h = home.classList.contains("is-active");
    var c = chat.classList.contains("is-active");
    var s = search.classList.contains("is-active");
    var oh = parseFloat(getComputedStyle(home).opacity) || 0;
    var oc = parseFloat(getComputedStyle(chat).opacity) || 0;
    var os = parseFloat(getComputedStyle(search).opacity) || 0;
    var sum = oh + oc + os;
    minSum = Math.min(minSum, sum);
    if (h) sawHome = true;
    if (nav.classList.contains("is-up")) {
      sawNav = true;
      if (s) navOnSearch = true;
      if (h) navOnHome = true;
      if (c) navOnChat = true;
    }
    if (Math.abs(navOffset()) > 4) sawNavSlide = true;
    if (c && oc > 0.9) {
      resolve({
        ms: now - start,
        sawHome: sawHome,
        sawNav: sawNav,
        sawNavSlide: sawNavSlide,
        navOnSearch: navOnSearch,
        navOnHome: navOnHome,
        navOnChat: navOnChat,
        minSum: minSum,
        maxFrame: maxFrame,
        avgFrame: frames > 1 ? sumFrame / (frames - 1) : 0,
        cls: (window.__eoyCls || 0) - baselineCls,
        samples: samples
      });
      return;
    }
    if (now - start > 3200) {
      resolve({
        ms: now - start,
        sawHome: sawHome,
        sawNav: sawNav,
        sawNavSlide: sawNavSlide,
        navOnSearch: navOnSearch,
        navOnHome: navOnHome,
        navOnChat: navOnChat,
        minSum: minSum,
        maxFrame: maxFrame,
        avgFrame: frames > 1 ? sumFrame / (frames - 1) : 0,
        cls: (window.__eoyCls || 0) - baselineCls,
        samples: samples,
        timedOut: true
      });
      return;
    }
    requestAnimationFrame(sample);
  }

  window.__eoyCls = 0;
  if (triggerName === "next") LearnSys.next();
  else chip.click();
  requestAnimationFrame(sample);
})
""",
        trigger,
    )


def test_launch(page, logs, results, tag):
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(700)
    page.evaluate("() => { window.__eoyCls = 0; }")
    result = sample_launch(page, "chip")
    detail = str(result)
    results.check(tag, "launch reaches the phone desktop", result.get("sawHome"), detail)
    results.check(tag, "nav bar swipes up on the search page", result.get("sawNav") and result.get("navOnSearch"), detail)
    results.check(tag, "nav bar visibly slides up", result.get("sawNavSlide"), detail)
    results.check(tag, "nav bar stays on the desktop", result.get("sawNav") and result.get("navOnHome"), detail)
    results.check(tag, "KI-Chat opens", not result.get("timedOut"), detail)
    results.check(tag, "app switch lasts between 1.2 and 2.2 seconds", 1200 <= result.get("ms", 0) <= 2200, detail)
    results.check(tag, "phone screens never blank or dim during the switch", result.get("minSum", 0) >= 0.9, detail)
    results.check(tag, "switch has no large layout shift", result.get("cls", 0) < 0.1, detail)
    results.check(tag, "switch keeps frame times reasonable", result.get("maxFrame", 0) < 250, detail)
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "chat is active after the switch", current["chat"] and not current["home"], str(current))
    results.check(tag, "nav bar is gone once the chat app is open", current["navHidden"] and not current["navUp"], str(current))
    results.check(tag, "chat tab is selected", current["chip"] == "chat" and current["progress"] == ("Chat" if tag.endswith("de") else "Chat"), str(current))
    try:
        page.wait_for_function(
            "() => { var el = document.querySelector('.ia-chat-answer'); return el && el.textContent.trim().length > 40; }",
            timeout=9000,
        )
        answer = page.evaluate("() => document.querySelector('.ia-chat-answer').textContent")
        results.check(tag, "chat answer finishes", len(answer) > 40, answer[:120])
    except PlaywrightError:
        results.fail(tag, "chat answer finishes", "answer stayed empty")
    errors = logs.take()
    results.check(tag, "launch has no console errors", not errors, " | ".join(errors)[:500])


def test_tabs_and_code(page, logs, results, tag):
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(500)
    current = state(page)
    results.check(tag, "back to search works", current["search"] and not current["home"] and not current["chat"], str(current))
    results.check(tag, "nav stays hidden on the returned search page", current["navHidden"], str(current))

    page.evaluate("() => document.querySelector('[data-media=code]').click()")
    page.wait_for_timeout(600)
    current = state(page)
    results.check(
        tag,
        "code desktop opens directly",
        current["codeVisible"] and (current["phoneRect"] is None or current["phoneRect"]["w"] == 0),
        str(current),
    )
    results.check(tag, "nav bar is not on the code desktop", current["navHidden"], str(current))
    try:
        page.wait_for_function(
            "() => document.querySelectorAll('.ls-code-token.is-visible').length > 20",
            timeout=8000,
        )
        results.check(tag, "code scene types its program", True)
    except PlaywrightError:
        results.fail(tag, "code scene types its program", "too few visible tokens")

    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    current = state(page)
    results.check(tag, "search returns after the code desktop", current["search"] and not current["codeVisible"], str(current))
    results.check(tag, "nav stays hidden after leaving code", current["navHidden"], str(current))
    errors = logs.take()
    results.check(tag, "tab switching has no console errors", not errors, " | ".join(errors)[:500])


def test_phone_screen_clicks(page, logs, results, tag):
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(600)
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    page.evaluate("() => document.querySelector('#ia-phone').click()")
    page.wait_for_timeout(2500)
    current = state(page)
    results.check(tag, "clicking the search screen advances to the chat", current["chat"] and current["navHidden"], str(current)[:300])
    page.evaluate("() => document.querySelector('#ia-chat-phone').click()")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "clicking the chat screen advances to code", current["codeVisible"], str(current)[:300])
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    current = state(page)
    results.check(tag, "search returns after the chat screen click", current["search"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "phone screen clicks have no console errors", not errors, " | ".join(errors)[:400])


def test_hidden_media_buttons(page, logs, results, tag):
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(600)
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    page.evaluate("() => { var b = document.querySelector('.ls-media-next'); if (b) b.click(); }")
    page.wait_for_timeout(2500)
    current = state(page)
    results.check(tag, "hidden media next advances to the chat", current["chat"] or current["codeVisible"], str(current)[:300])
    page.evaluate("() => { var b = document.querySelector('.ls-media-prev'); if (b) b.click(); }")
    page.wait_for_timeout(600)
    ok, current, why = invariant(page)
    results.check(tag, "hidden media prev keeps a valid state", ok, why or str(current)[:300])
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    current = state(page)
    results.check(tag, "search returns after hidden media buttons", current["search"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "hidden media buttons have no console errors", not errors, " | ".join(errors)[:400])


def test_interrupted(page, logs, results, tag):
    def reset_search():
        page.evaluate("() => document.querySelector('[data-media=search]').click()")
        page.wait_for_timeout(500)

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(120)
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "search interrupts the launch", current["search"] and not current["home"] and current["navHidden"], str(current))

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(120)
    page.evaluate("() => document.querySelector('[data-media=code]').click()")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "code interrupts the launch", current["codeVisible"] and current["navHidden"], str(current))

    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(2600)
    current = state(page)
    results.check(tag, "chat still opens after a code interruption", current["chat"] and current["navHidden"], str(current))

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(100)
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(80)
    page.evaluate("() => LearnSys.prev()")
    page.wait_for_timeout(800)
    ok, current, why = invariant(page)
    results.check(tag, "next/prev during the launch leaves a valid state", ok, why or str(current))

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(900)
    mid = state(page)
    results.check(tag, "the desktop is active before the mid-desktop abort", mid["home"] and not mid["navHidden"], str(mid)[:300])
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "search aborts from the desktop phase", current["search"] and current["navHidden"], str(current)[:300])

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(900)
    page.evaluate("() => document.querySelector('[data-media=code]').click()")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "code aborts from the desktop phase", current["codeVisible"] and current["navHidden"], str(current)[:300])

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(900)
    page.evaluate("() => { var b = document.querySelector('#ls-quick-next'); if (b) b.click(); }")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "quick next aborts from the desktop phase to code", current["codeVisible"], str(current)[:300])

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(120)
    for key in ("Escape", "e", "+", "-"):
        page.keyboard.press(key)
        page.wait_for_timeout(40)
    page.wait_for_timeout(2800)
    current = state(page)
    results.check(tag, "keyboard noise does not stop the launch", current["chat"] and current["navHidden"], str(current)[:300])

    errors = logs.take()
    results.check(tag, "interrupted launches have no console errors", not errors, " | ".join(errors)[:500])


def test_keyboard_media(page, logs, results, tag):
    def reset_search():
        page.evaluate("() => document.querySelector('[data-media=search]').click()")
        page.wait_for_timeout(600)

    reset_search()
    nav_aria = page.evaluate("() => document.querySelector('.ia-phone-chrome').getAttribute('aria-hidden')")
    results.check(tag, "the decorative nav bar is aria-hidden", nav_aria == "true", str(nav_aria))
    icons = page.evaluate(
        "() => Array.prototype.every.call(document.querySelectorAll('.ia-status-signal i, .ia-status-wifi, .ia-status-battery'),"
        " function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })"
    )
    results.check(tag, "status bar icons are visibly laid out", icons, str(icons))

    page.evaluate("() => document.querySelector('[data-media=chat]').focus()")
    page.keyboard.press("Enter")
    page.wait_for_timeout(2600)
    current = state(page)
    results.check(tag, "Enter on the chat tab opens KI-Chat", current["chat"] and current["navHidden"], str(current)[:300])

    reset_search()
    page.evaluate("() => document.querySelector('[data-media=chat]').focus()")
    page.keyboard.press("Space")
    page.wait_for_timeout(2600)
    current = state(page)
    results.check(tag, "Space on the chat tab opens KI-Chat", current["chat"] and current["navHidden"], str(current)[:300])

    page.evaluate("() => document.querySelector('[data-media=code]').click()")
    page.wait_for_timeout(500)
    tabs = page.evaluate(
        "() => Array.prototype.map.call(document.querySelectorAll('[data-media]'), function (b) {"
        " return [b.getAttribute('data-media'), b.getAttribute('aria-selected')]; })"
    )
    results.check(tag, "only the code tab is aria-selected", dict(tabs).get("code") == "true" and dict(tabs).get("search") == "false", str(tabs))
    errors = logs.take()
    results.check(tag, "keyboard media pass has no console errors", not errors, " | ".join(errors)[:400])


def test_double_click(page, logs, results, tag):
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(600)
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    page.dblclick('[data-media="chat"]')
    page.wait_for_timeout(2600)
    current = state(page)
    results.check(tag, "double clicking the chat tab opens a single chat", current["chat"] and current["navHidden"], str(current)[:300])
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(600)
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    try:
        page.dblclick("#ls-quick-next")
    except PlaywrightError:
        page.evaluate("() => { var b = document.querySelector('#ls-quick-next'); if (b) { b.click(); b.click(); } }")
    page.wait_for_timeout(900)
    current = state(page)
    results.check(tag, "double clicking the quick next button keeps a valid page", bool(current["title"]), str(current)[:300])
    ok, current, why = invariant(page)
    results.check(tag, "double clicking quick next keeps a valid phone state", ok, why or str(current))
    errors = logs.take()
    results.check(tag, "double clicks have no console errors", not errors, " | ".join(errors)[:400])


def test_nav_race(page, logs, results, tag):
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(700)
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    try:
        page.wait_for_function(
            "() => document.querySelector('#ia-chat-phone').classList.contains('is-active')",
            timeout=5000,
        )
    except PlaywrightError:
        results.fail(tag, "first chat opens for the nav race", "chat never became active")
        return
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(80)
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(320)
    current = state(page)
    results.check(
        tag,
        "a pending nav hide does not cancel a rapid relaunch",
        (not current["navHidden"]) and current["navUp"],
        str(current)[:300],
    )
    page.wait_for_timeout(2300)
    current = state(page)
    results.check(tag, "the rapid relaunch still reaches chat", current["chat"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "the nav race has no console errors", not errors, " | ".join(errors)[:400])


def test_rapid_sprint(page, logs, results, tag):
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(400)
    page.evaluate("() => { for (var i = 0; i < 80; i++) LearnSys.next(); }")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "80 synchronous next calls leave a title", bool(current["title"]), str(current)[:200])
    results.check(tag, "80 synchronous next calls keep the layout", current["overflow"] <= 2, str(current["overflow"]))

    page.evaluate("() => { for (var i = 0; i < 80; i++) LearnSys.prev(); }")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "80 synchronous prev calls leave a title", bool(current["title"]), str(current)[:200])

    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(400)
    page.evaluate("() => { for (var i = 0; i < 50; i++) { var b = document.querySelector('#ls-quick-next'); if (b) b.click(); } }")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "50 quick-nav clicks leave a valid page", bool(current["title"]) and current["overflow"] <= 2, str(current)[:200])

    page.evaluate("() => { for (var i = 0; i < 80; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })); }")
    page.evaluate("() => { for (var i = 0; i < 80; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); }")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "80 arrow keys leave a title", bool(current["title"]), str(current)[:200])

    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(900)
    current = state(page)
    results.check(tag, "media demo recovers after the sprint", current["present"], str(current)[:200])
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(700)
    current = state(page)
    results.check(tag, "media demo resets to search after the sprint", current["search"] and current["navHidden"], str(current)[:200])
    reset = sample_launch(page, "next")
    results.check(tag, "launch still works after the sprint", not reset.get("timedOut") and reset.get("sawHome") and reset.get("sawNav"), str(reset))
    errors = logs.take()
    results.check(tag, "sprint has no console errors", not errors, " | ".join(errors)[:500])


def fuzz_controls(page):
    return page.evaluate(
        VISIBLE_CONTROLS
        + r"""
return eoyControls().map(function (el, i) {
  var r = el.getBoundingClientRect();
  return {
    i: i,
    tag: el.tagName,
    text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48),
    cls: (el.className || "").toString().slice(0, 80),
    disabled: !!el.disabled,
    x: Math.round(r.x + r.width / 2),
    y: Math.round(r.y + r.height / 2)
  };
});
"""
    )


def click_control(page, index):
    page.evaluate(
        VISIBLE_CONTROLS
        + r"""
(index) => {
  var all = eoyControls();
  var el = all[index];
  if (!el) return { clicked: false };
  if (el.tagName === "INPUT") {
    if (el.type === "range" || el.type === "number") {
      var min = el.min === "" ? 0 : parseFloat(el.min);
      var max = el.max === "" ? 100 : parseFloat(el.max);
      if (!isFinite(min)) min = 0;
      if (!isFinite(max)) max = 100;
      el.value = String(min + Math.random() * (max - min));
    } else if (el.type === "checkbox" || el.type === "radio") {
      el.checked = !el.checked;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (el.tagName === "SELECT") {
    var options = Array.prototype.slice.call(el.options);
    if (options.length) el.value = options[Math.floor(Math.random() * options.length)].value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  el.click();
  return { clicked: true, tag: el.tagName, text: (el.textContent || "").trim().slice(0, 48) };
}
""",
        index,
    )


def test_fuzz(browser, base, lang, results, steps, path=PAGE, label="fuzz"):
    context, page, logs = open_page(browser, base, lang, path=path)
    tag = f"{label}-{lang}"
    rng = random.Random(20261122 + (0 if lang == "de" else 1))
    actions = [
        "click",
        "click",
        "click",
        "point",
        "key",
        "key",
        "api",
        "wait",
        "resize",
        "api-invalid",
    ]
    keys = [
        "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "Enter",
        "Escape", "Home", "End", "PageDown", "PageUp", "?", "h", "e", "f",
        "r", "d", "+", "-", "0", "1", "2", "3",
    ]
    api_calls = [
        "LearnSys.next()",
        "LearnSys.prev()",
        "LearnSys.go(0, 0, 0)",
        "LearnSys.go(999, 999, 999)",
        "LearnSys.go(-5, -5, -5)",
        "LearnSys.setFont(0)",
        "LearnSys.setFont(4)",
        "LearnSys.setDepth('short')",
        "LearnSys.setDepth('standard')",
        "LearnSys.setDepth('deep')",
        "LearnSys.shuffle()",
    ]
    invalid_calls = [
        "LearnSys.go(NaN, 0, 0)",
        "LearnSys.go(0, NaN, 0)",
        "LearnSys.go(0, 0, NaN)",
        "LearnSys.go('x', 'y', 'z')",
        "LearnSys.go(Infinity, -Infinity, Infinity)",
        "LearnSys.go(0.5, 1.5, 0.5)",
        "LearnSys.setDepth(null)",
        "LearnSys.setDepth({})",
        "LearnSys.setFont(NaN)",
        "LearnSys.setFont('x')",
        "LearnSys.setFont(999999)",
        "LearnSys.goDay('does-not-exist')",
    ]
    viewports = [
        {"width": 1440, "height": 1000},
        {"width": 1200, "height": 900},
        {"width": 1024, "height": 768},
        {"width": 820, "height": 1180},
        {"width": 390, "height": 844},
    ]
    seen_errors = set()
    for step in range(steps):
        action = rng.choice(actions)
        description = action
        try:
            if action == "click":
                controls = fuzz_controls(page)
                if controls:
                    control = rng.choice(controls)
                    description = f"click {control['tag']} '{control['text']}'"
                    click_control(page, control["i"])
                else:
                    description = "click (no controls)"
            elif action == "point":
                width = page.viewport_size["width"]
                height = page.viewport_size["height"]
                x = rng.randint(4, max(5, width - 5))
                y = rng.randint(4, max(5, height - 5))
                description = f"point {x},{y}"
                page.mouse.click(x, y)
            elif action == "key":
                key = rng.choice(keys)
                description = f"key {key}"
                page.keyboard.press(key)
            elif action == "api":
                call = rng.choice(api_calls)
                description = f"api {call}"
                page.evaluate(call)
            elif action == "api-invalid":
                call = rng.choice(invalid_calls)
                description = f"invalid {call}"
                page.evaluate(call)
            elif action == "resize":
                vp = rng.choice(viewports)
                description = f"resize {vp['width']}x{vp['height']}"
                page.set_viewport_size(vp)
            else:
                description = "wait"
                page.wait_for_timeout(rng.randint(0, 90))
        except Exception as exc:
            description += " threw " + str(exc).splitlines()[0]
        page.wait_for_timeout(rng.randint(0, 60))
        errors = logs.take()
        for error in errors:
            key = error[:180]
            if key not in seen_errors:
                seen_errors.add(key)
                results.fail(tag, f"console/page error after {description}", error[:500])
        current = state(page)
        results.check(tag, f"step {step}: title remains", bool(current.get("title")), str(current)[:300])
        results.check(tag, f"step {step}: no horizontal overflow", current.get("overflow", 0) <= 2, str(current.get("overflow")))
        ok, current, why = invariant(page)
        if not ok:
            results.fail(tag, f"step {step}: phone state after {description}", why + " " + str(current))

    page.set_viewport_size({"width": 1440, "height": 1000})
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(900)
    current = state(page)
    results.check(tag, "media demo is still mounted after the fuzz", current["present"], str(current)[:300])
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(800)
    current = state(page)
    results.check(tag, "media demo resets to search after the fuzz", current["present"] and current["search"] and current["navHidden"], str(current)[:300])
    launch = sample_launch(page, "next")
    results.check(tag, "launch still works after the fuzz", not launch.get("timedOut") and launch.get("sawHome") and launch.get("sawNav"), str(launch))
    errors = logs.take()
    results.check(tag, "fuzz ends without console errors", not errors, " | ".join(errors)[:500])
    context.close()


def test_invalid_api(browser, base, lang, results):
    calls = [
        "LearnSys.go(NaN, 0, 0)",
        "LearnSys.go(0, NaN, 0)",
        "LearnSys.go(0, 0, NaN)",
        "LearnSys.go('x', 'y', 'z')",
        "LearnSys.go(Infinity, -Infinity, Infinity)",
        "LearnSys.go(undefined, undefined, undefined)",
        "LearnSys.go(0.5, 1.5, 0.5)",
        "LearnSys.go(0, 0, 1.5)",
        "LearnSys.setDepth(null)",
        "LearnSys.setDepth({})",
        "LearnSys.setDepth([])",
        "LearnSys.setFont(NaN)",
        "LearnSys.setFont('x')",
        "LearnSys.setFont(999999)",
        "LearnSys.goDay('does-not-exist')",
        "LearnSys.goDay(null)",
        "LearnSys.shuffle()",
    ]
    for page_name, path in (("1", PAGE), ("index", INDEX)):
        context, page, logs = open_page(browser, base, lang, path=path)
        tag = f"invalid-{page_name}-{lang}"
        for call in calls:
            try:
                page.evaluate(call)
                threw = ""
            except Exception as exc:
                threw = str(exc).splitlines()[0]
            current = state(page)
            day = page.evaluate("() => LearnSys.state().day")
            step = page.evaluate("() => LearnSys.state().step")
            substep = page.evaluate("() => LearnSys.state().substep")
            depth = page.evaluate("() => LearnSys.state().depth")
            results.check(tag, f"{call} does not throw", not threw, threw)
            results.check(tag, f"{call} keeps a title", bool(current.get("title")), str(current)[:300])
            results.check(tag, f"{call} keeps an integer day", isinstance(day, (int, float)) and math.isfinite(day) and float(day).is_integer(), str(day))
            results.check(tag, f"{call} keeps an integer step", isinstance(step, (int, float)) and math.isfinite(step) and float(step).is_integer(), str(step))
            results.check(tag, f"{call} keeps an integer substep", isinstance(substep, (int, float)) and math.isfinite(substep) and float(substep).is_integer(), str(substep))
            results.check(tag, f"{call} keeps a valid depth", depth in ("short", "standard", "deep"), str(depth))
            ok, current, why = invariant(page)
            results.check(tag, f"{call} keeps a valid phone state", ok, why or str(current))
            errors = logs.take()
            results.check(tag, f"{call} has no console errors", not errors, " | ".join(errors)[:400])
            page.evaluate("() => LearnSys.go(0, 0, 0)")
            page.wait_for_timeout(120)
        page.wait_for_timeout(500)
        current = state(page)
        results.check(tag, "media demo is still mounted after invalid calls", current["present"], str(current)[:300])
        page.evaluate("() => document.querySelector('[data-media=search]').click()")
        page.wait_for_timeout(500)
        current = state(page)
        results.check(tag, "media demo still reaches search after invalid calls", current["present"] and current["search"], str(current)[:300])
        context.close()


def test_reduced_motion(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, reduced_motion="reduce")
    tag = f"reduced-{lang}"
    current = state(page)
    results.check(tag, "reduced motion still mounts the media demo", current["present"], str(current))
    result = sample_launch(page, "chip")
    results.check(tag, "reduced motion reaches the chat", not result.get("timedOut"), str(result))
    current = state(page)
    results.check(tag, "reduced motion leaves the nav bar hidden", current["navHidden"] and not current["navUp"], str(current))
    errors = logs.take()
    results.check(tag, "reduced motion has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_corrupted_prefs(browser, base, lang, results):
    raw_cases = [
        ("invalid json", "not json at all"),
        ("negative day and steps", '{"day":-7,"step":-7,"substep":-7,"font":999,"depth":"nope","track":"nope"}'),
        ("huge day and steps", '{"day":9999,"step":9999,"substep":9999,"font":999,"depth":[],"track":{}}'),
        ("wrong types", '{"day":"x","step":"y","substep":"z","font":"q","depth":null,"track":[]}'),
        ("fractional values", '{"day":1.7,"step":2.9,"substep":1.3,"font":2.4,"depth":"deep","track":"all"}'),
        ("valid values", '{"day":0,"step":0,"substep":0,"font":1,"depth":"standard","track":"all"}'),
    ]
    for name, raw in raw_cases:
        context = browser.new_context(viewport={"width": 1200, "height": 900})
        page = context.new_page()
        page.set_default_timeout(6000)
        page.add_init_script(INIT_SCRIPT)
        page.add_init_script(
            "try { localStorage.setItem('tm_learnsys_pref_v1', %s); } catch (e) {}" % json.dumps(raw)
        )
        logs = PageLog(page)
        tag = f"prefs-{lang}"
        page.goto(f"{base}{INDEX}?lang={lang}", wait_until="load", timeout=30000)
        ready = True
        try:
            page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=25000)
        except PlaywrightError:
            ready = False
        results.check(tag, f"{name}: app boots", ready, "no LearnSys/title")
        if ready:
            current = state(page)
            snapshot = page.evaluate(
                r"""
() => {
  var s = LearnSys.state();
  var days = LearnSys.days();
  return {
    day: s.day,
    step: s.step,
    substep: s.substep,
    font: s.font,
    depth: s.depth,
    track: s.track,
    days: days.length,
    steps: days[s.day] ? days[s.day].steps : null
  };
}
"""
            )
            results.check(tag, f"{name}: keeps a title", bool(current.get("title")), str(current)[:200])
            results.check(tag, f"{name}: keeps a day in range", isinstance(snapshot["day"], int) and 0 <= snapshot["day"] < snapshot["days"], str(snapshot))
            results.check(tag, f"{name}: keeps a step in range", isinstance(snapshot["step"], int) and 0 <= snapshot["step"] < snapshot["steps"], str(snapshot))
            results.check(tag, f"{name}: keeps a substep in range", isinstance(snapshot["substep"], int) and snapshot["substep"] >= 0, str(snapshot))
            results.check(tag, f"{name}: keeps a valid depth", snapshot["depth"] in ("short", "standard", "deep"), str(snapshot))
            results.check(tag, f"{name}: keeps a valid track", snapshot["track"] in ("all", "transformer"), str(snapshot))
            results.check(tag, f"{name}: no horizontal overflow", current.get("overflow", 0) <= 2, str(current.get("overflow")))
        errors = logs.take()
        results.check(tag, f"{name}: no console errors", not errors, " | ".join(errors)[:400])
        context.close()

    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.set_default_timeout(6000)
    page.add_init_script(INIT_SCRIPT)
    page.add_init_script(
        "try { localStorage.setItem('tm_learnsys_pref_v1', %s); } catch (e) {}"
        % json.dumps('{"day":99,"step":99,"substep":99,"font":999,"depth":"nope","track":{}}')
    )
    logs = PageLog(page)
    tag = f"prefs-single-{lang}"
    page.goto(f"{base}{PAGE}?lang={lang}", wait_until="load", timeout=30000)
    wait_ready(page)
    current = state(page)
    results.check(tag, "single page ignores corrupted prefs", current["present"] and current["search"] and current["navHidden"], str(current)[:300])
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(2500)
    current = state(page)
    results.check(tag, "single page still launches after corrupted prefs", current["chat"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "single page corrupted prefs has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_viewports(browser, base, lang, results):
    for width, height, label in [(390, 844, "mobile"), (360, 640, "small-mobile"), (820, 1180, "tablet")]:
        context, page, logs = open_page(
            browser, base, lang, viewport={"width": width, "height": height}, mobile=(width < 500)
        )
        tag = f"{label}-{lang}"
        current = state(page)
        results.check(tag, "media demo visible", current["present"], str(current))
        results.check(tag, f"{label} page has no horizontal overflow", current["overflow"] <= 2, str(current["overflow"]))
        results.check(tag, f"{label} nav bar still sits at the bottom", 0 < (current["navBottom"] or 0) < 300, str(current["navBottom"]))
        result = sample_launch(page, "next")
        results.check(tag, f"{label} launch reaches chat", not result.get("timedOut"), str(result))
        results.check(tag, f"{label} launch is between 1.2 and 2.2 seconds", 1200 <= result.get("ms", 0) <= 2200, str(result))
        current = state(page)
        results.check(tag, f"{label} page stays within the phone stage", current["phoneRect"] and current["stageRect"] and current["phoneRect"]["w"] <= current["stageRect"]["w"] + 2, str(current))
        errors = logs.take()
        results.check(tag, f"{label} has no console errors", not errors, " | ".join(errors)[:400])
        context.close()


def test_resize_mid_launch(browser, base, lang, results):
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.set_default_timeout(6000)
    page.add_init_script(INIT_SCRIPT)
    logs = PageLog(page)
    page.goto(f"{base}{PAGE}?lang={lang}", wait_until="load", timeout=30000)
    wait_ready(page)
    tag = f"resize-{lang}"
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(250)
    page.set_viewport_size({"width": 780, "height": 620})
    page.wait_for_timeout(2400)
    current = state(page)
    results.check(tag, "chat still opens after resizing mid-launch", current["chat"] and current["navHidden"], str(current)[:300])
    results.check(tag, "resized page has no horizontal overflow", current["overflow"] <= 2, str(current["overflow"]))
    page.set_viewport_size({"width": 320, "height": 480})
    page.wait_for_timeout(500)
    current = state(page)
    results.check(tag, "tiny viewport keeps the layout together", current["overflow"] <= 2, str(current["overflow"]))
    page.set_viewport_size({"width": 1920, "height": 1080})
    page.wait_for_timeout(500)
    current = state(page)
    results.check(tag, "large viewport keeps the layout together", current["overflow"] <= 2, str(current["overflow"]))
    errors = logs.take()
    results.check(tag, "resizing has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_repeated(browser, base, lang, results, cycles):
    context, page, logs = open_page(browser, base, lang)
    tag = f"repeat-{lang}"
    for cycle in range(cycles):
        page.evaluate("() => document.querySelector('[data-media=search]').click()")
        page.wait_for_timeout(350)
        current = state(page)
        results.check(tag, f"cycle {cycle + 1}: search resets", current["search"] and current["navHidden"], str(current)[:200])
        page.evaluate("() => document.querySelector('[data-media=chat]').click()")
        page.wait_for_timeout(2300)
        current = state(page)
        results.check(tag, f"cycle {cycle + 1}: chat opens", current["chat"] and current["navHidden"], str(current)[:200])
        errors = logs.take()
        results.check(tag, f"cycle {cycle + 1}: no console errors", not errors, " | ".join(errors)[:300])
    context.close()


def test_boundaries(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang)
    tag = f"bounds-{lang}"
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(500)
    page.evaluate("() => LearnSys.prev()")
    page.wait_for_timeout(400)
    current = state(page)
    results.check(tag, "prev on the first media step is a no-op", current["search"], str(current)[:300])
    page.evaluate("() => LearnSys.go(0, -99, -99)")
    page.wait_for_timeout(400)
    current = state(page)
    results.check(tag, "negative go values keep a valid phone state", invariant(page)[0], str(current)[:300])
    page.evaluate("() => LearnSys.go(0, 999, 999)")
    page.wait_for_timeout(400)
    current = state(page)
    results.check(tag, "huge go values keep a valid phone state", invariant(page)[0], str(current)[:300])
    page.evaluate("() => { for (var i = 0; i < 8; i++) LearnSys.next(); }")
    page.wait_for_timeout(800)
    current = state(page)
    results.check(tag, "next calls at the end keep a valid page", bool(current["title"]), str(current)[:300])
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(700)
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(600)
    current = state(page)
    results.check(tag, "first media step recovers after boundary tests", current["search"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "boundary tests have no console errors", not errors, " | ".join(errors)[:400])
    context.close()

    context, page, logs = open_page(browser, base, lang, path=INDEX)
    tag = f"bounds-index-{lang}"
    page.evaluate("() => LearnSys.go(-99, -99, -99)")
    page.wait_for_timeout(500)
    snapshot = page.evaluate("() => { var s = LearnSys.state(); var d = LearnSys.days(); return { day: s.day, step: s.step, days: d.length, steps: d[s.day] ? d[s.day].steps : -1 }; }")
    results.check(tag, "negative day clamps to the first step", snapshot["day"] == 0 and snapshot["step"] == 0, str(snapshot))
    page.evaluate("() => LearnSys.go(999, 999, 999)")
    page.wait_for_timeout(700)
    snapshot = page.evaluate("() => { var s = LearnSys.state(); var d = LearnSys.days(); return { day: s.day, step: s.step, days: d.length, steps: d[s.day] ? d[s.day].steps : -1 }; }")
    results.check(tag, "huge day clamps to the last step", snapshot["day"] == snapshot["days"] - 1 and snapshot["step"] == snapshot["steps"] - 1, str(snapshot))
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(300)
    after = page.evaluate("() => LearnSys.state().step")
    results.check(tag, "next at the end is a no-op", after == snapshot["step"], f"{snapshot['step']} -> {after}")
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(500)
    page.evaluate("() => LearnSys.prev()")
    page.wait_for_timeout(300)
    snapshot = page.evaluate("() => { var s = LearnSys.state(); return { day: s.day, step: s.step }; }")
    results.check(tag, "prev at the start is a no-op", snapshot["day"] == 0 and snapshot["step"] == 0, str(snapshot))
    errors = logs.take()
    results.check(tag, "index boundary tests have no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_history(browser, base, lang, results):
    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.set_default_timeout(8000)
    page.add_init_script(INIT_SCRIPT)
    logs = PageLog(page)
    page.goto(f"{base}{INDEX}?lang={lang}", wait_until="load", timeout=40000)
    page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=40000)
    page.wait_for_timeout(800)
    tag = f"history-{lang}"
    page.evaluate("() => { LearnSys.next(); LearnSys.next(); LearnSys.next(); }")
    page.wait_for_timeout(700)
    before = page.evaluate("() => { var s = LearnSys.state(); return { day: s.day, step: s.step, title: document.querySelector('#ls-title').textContent, hash: location.hash }; }")
    results.check(tag, "navigation writes a position hash", bool(before["hash"]), str(before))
    page.reload(wait_until="load")
    page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=30000)
    page.wait_for_timeout(700)
    after_reload = page.evaluate("() => { var s = LearnSys.state(); return { day: s.day, step: s.step, title: document.querySelector('#ls-title').textContent }; }")
    results.check(tag, "reload restores the step", (after_reload["day"], after_reload["step"]) == (before["day"], before["step"]), f"{after_reload} vs {before}")
    valid_hash = before["hash"]
    page.goto(f"{base}{INDEX}?lang={lang}{valid_hash}", wait_until="load", timeout=40000)
    page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=40000)
    page.wait_for_timeout(700)
    from_hash = page.evaluate("() => { var s = LearnSys.state(); return { day: s.day, step: s.step, title: document.querySelector('#ls-title').textContent }; }")
    results.check(tag, "a valid position hash restores the step", (from_hash["day"], from_hash["step"]) == (before["day"], before["step"]), f"{from_hash} vs {before}")
    page.goto(f"{base}{INDEX}?lang={lang}#/not-a-day/9999/9999", wait_until="load", timeout=40000)
    page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=40000)
    page.wait_for_timeout(700)
    invalid_hash = page.evaluate("() => { var s = LearnSys.state(); return { day: s.day, step: s.step, title: document.querySelector('#ls-title').textContent, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }; }")
    results.check(tag, "an invalid position hash falls back safely", bool(invalid_hash["title"]) and invalid_hash["overflow"] <= 2, str(invalid_hash))
    errors = logs.take()
    results.check(tag, "hash navigation has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_missing_wallpaper(browser, base, lang, results):
    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.set_default_timeout(6000)
    page.add_init_script(INIT_SCRIPT)
    context.route("**/opera.jpg", lambda route: route.fulfill(status=404, body="missing wallpaper"))
    logs = PageLog(page, extra_benign=("opera.jpg", "404"))
    page.goto(f"{base}{PAGE}?lang={lang}", wait_until="load", timeout=30000)
    wait_ready(page)
    tag = f"wallpaper-missing-{lang}"
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(2600)
    current = state(page)
    results.check(tag, "a missing wallpaper does not break the launch", current["chat"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "a missing wallpaper has no JavaScript errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_delayed_wallpaper(browser, base, lang, results):
    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.set_default_timeout(8000)
    page.add_init_script(INIT_SCRIPT)

    def slow_wallpaper(route):
        time.sleep(0.8)
        route.continue_()

    context.route("**/opera.jpg", slow_wallpaper)
    logs = PageLog(page)
    page.goto(f"{base}{PAGE}?lang={lang}", wait_until="load", timeout=30000)
    wait_ready(page)
    tag = f"wallpaper-slow-{lang}"
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(2800)
    current = state(page)
    results.check(tag, "a slow wallpaper does not block the launch", current["chat"] and current["navHidden"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "a slow wallpaper has no JavaScript errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_offline_launch(browser, base, lang, results):
    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.set_default_timeout(6000)
    page.add_init_script(INIT_SCRIPT)
    logs = PageLog(page, extra_benign=("net::ERR_INTERNET_DISCONNECTED", "Failed to load resource"))
    page.goto(f"{base}{PAGE}?lang={lang}", wait_until="load", timeout=30000)
    wait_ready(page)
    context.set_offline(True)
    tag = f"offline-{lang}"
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(2600)
    current = state(page)
    results.check(tag, "the already loaded launch works offline", current["chat"] and current["navHidden"], str(current)[:300])
    results.check(tag, "the offline page has no horizontal overflow", current["overflow"] <= 2, str(current["overflow"]))
    errors = logs.take()
    results.check(tag, "offline launch has no JavaScript errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_cpu_throttle(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang)
    tag = f"throttle-{lang}"
    client = context.new_cdp_session(page)
    client.send("Emulation.setCPUThrottlingRate", {"rate": 6})
    page.evaluate("() => document.querySelector('[data-media=search]').click()")
    page.wait_for_timeout(700)
    page.evaluate("() => document.querySelector('[data-media=chat]').click()")
    page.wait_for_timeout(5000)
    current = state(page)
    results.check(tag, "chat opens under 6x CPU throttling", current["chat"] and current["navHidden"], str(current)[:300])
    results.check(tag, "throttled page has no horizontal overflow", current["overflow"] <= 2, str(current["overflow"]))
    errors = logs.take()
    results.check(tag, "CPU throttling has no console errors", not errors, " | ".join(errors)[:400])
    client.send("Emulation.setCPUThrottlingRate", {"rate": 1})
    context.close()


def test_tampered_track(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path=INDEX)
    tag = f"track-{lang}"
    page.evaluate(
        r"""
() => {
  var select = document.querySelector('#ls-track');
  if (!select) return false;
  select.value = '__not_a_track__';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}
"""
    )
    page.wait_for_timeout(400)
    track = page.evaluate("() => LearnSys.state().track")
    results.check(tag, "tampered track keeps a valid track", track in ("all", "transformer"), str(track))
    current = state(page)
    results.check(tag, "tampered track keeps a title", bool(current["title"]), str(current)[:300])
    errors = logs.take()
    results.check(tag, "tampered track has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_text_blur_swap(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/3.php", wait_media=False)
    tag = f"textblur-{lang}"
    page.wait_for_timeout(900)
    before = page.evaluate("() => ({ step: LearnSys.state().step, sub: LearnSys.state().substep })")
    result = page.evaluate(
        r"""
() => new Promise((resolve) => {
  var body = document.querySelector('#ls-body');
  var title = document.querySelector('#ls-title');
  var kicker = document.querySelector('#ls-kicker');
  var nav = document.querySelector('#ls-navbar');
  var start = performance.now();
  var minBodyOpacity = 1;
  var maxBodyBlur = 0;
  var minTitleOpacity = 1;
  var maxTitleBlur = 0;
  var minKickerOpacity = 1;
  var maxKickerBlur = 0;
  var navMinOpacity = 1;
  var navMaxBlur = 0;
  var samples = 0;
  function blurOf(el) {
    if (!el) return 0;
    var match = String(getComputedStyle(el).filter || "").match(/blur\(([^)]+)\)/);
    return match ? parseFloat(match[1]) || 0 : 0;
  }
  LearnSys.next();
  function sample() {
    samples++;
    var opacity = parseFloat(getComputedStyle(body).opacity) || 0;
    minBodyOpacity = Math.min(minBodyOpacity, opacity);
    maxBodyBlur = Math.max(maxBodyBlur, blurOf(body));
    if (title) {
      minTitleOpacity = Math.min(minTitleOpacity, parseFloat(getComputedStyle(title).opacity) || 0);
      maxTitleBlur = Math.max(maxTitleBlur, blurOf(title));
    }
    if (kicker) {
      minKickerOpacity = Math.min(minKickerOpacity, parseFloat(getComputedStyle(kicker).opacity) || 0);
      maxKickerBlur = Math.max(maxKickerBlur, blurOf(kicker));
    }
    if (nav) {
      navMinOpacity = Math.min(navMinOpacity, parseFloat(getComputedStyle(nav).opacity) || 0);
      navMaxBlur = Math.max(navMaxBlur, blurOf(nav));
    }
    if ((opacity > 0.95 && blurOf(body) < 0.5 && performance.now() - start > 150) || performance.now() - start > 900) {
      resolve({
        ms: performance.now() - start,
        minBodyOpacity: minBodyOpacity,
        maxBodyBlur: maxBodyBlur,
        minTitleOpacity: minTitleOpacity,
        maxTitleBlur: maxTitleBlur,
        minKickerOpacity: minKickerOpacity,
        maxKickerBlur: maxKickerBlur,
        navMinOpacity: navMinOpacity,
        navMaxBlur: navMaxBlur,
        titleSpans: title ? title.querySelectorAll('.ls-swap-char').length : -1,
        kickerSpans: kicker ? kicker.querySelectorAll('.ls-swap-char').length : -1,
        title: title ? title.textContent : '',
        kicker: kicker ? kicker.textContent : '',
        samples: samples,
        step: LearnSys.state().step,
        sub: LearnSys.state().substep
      });
      return;
    }
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
})
"""
    )
    detail = str(result)
    results.check(tag, "changed body text blurs out and in", result.get("maxBodyBlur", 0) > 1, detail)
    results.check(tag, "body text blends with the background", result.get("minBodyOpacity", 1) < 0.1, detail)
    results.check(tag, "unchanged headline stays sharp", result.get("maxTitleBlur", 1) < 0.5 and result.get("minTitleOpacity", 0) > 0.95, detail)
    results.check(tag, "unchanged headline has no swap spans", result.get("titleSpans", -1) == 0, detail)
    results.check(tag, "only changed kicker characters animate", result.get("kickerSpans", 0) > 0, detail)
    results.check(tag, "unchanged kicker text stays sharp", result.get("maxKickerBlur", 1) < 0.5 and result.get("minKickerOpacity", 0) > 0.95, detail)
    results.check(tag, "top navbar never disappears", result.get("navMinOpacity", 0) > 0.95, detail)
    results.check(tag, "top navbar is never blurred", result.get("navMaxBlur", 1) < 0.5, detail)
    results.check(tag, "text swap finishes within 200ms plus scheduling slack", result.get("ms", 9999) <= 900, detail)
    results.check(tag, "substep swap advances the page", result.get("sub") != before["sub"] or result.get("step") != before["step"], f"{before} -> {result}")
    results.check(tag, "blur swap keeps a title", bool(result.get("title")), detail)
    current = state(page)
    results.check(tag, "blur swap has no horizontal overflow", current["overflow"] <= 2, str(current["overflow"]))
    errors = logs.take()
    results.check(tag, "blur swap has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_nav_hint(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang)
    tag = f"hint-{lang}"
    page.wait_for_timeout(900)
    hint = page.evaluate(
        r"""
() => {
  var h = document.querySelector('#ls-nav-hint');
  return {
    hidden: h.hidden,
    on: h.classList.contains('is-on'),
    opacity: getComputedStyle(h).opacity,
    keys: getComputedStyle(h.querySelector('.ls-nav-hint-keys')).display,
    touch: getComputedStyle(h.querySelector('.ls-nav-hint-touch')).display,
    text: h.textContent.trim()
  };
}
"""
    )
    results.check(tag, "first page shows the navigation hint", not hint["hidden"] and hint["on"] and hint["opacity"] == "1", str(hint))
    results.check(tag, "desktop hint shows arrow keys", hint["keys"] != "none" and hint["touch"] == "none", str(hint))
    results.check(tag, "hint names the action", bool(hint["text"]), str(hint))
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(450)
    after = page.evaluate("() => ({ hidden: document.querySelector('#ls-nav-hint').hidden, on: document.querySelector('#ls-nav-hint').classList.contains('is-on') })")
    results.check(tag, "hint disappears after the first navigation", after["hidden"] and not after["on"], str(after))
    errors = logs.take()
    results.check(tag, "desktop hint has no console errors", not errors, " | ".join(errors)[:400])
    context.close()

    context, page, logs = open_page(browser, base, lang, path="/eoy/2.php", wait_media=False)
    tag2 = f"hint-later-{lang}"
    page.wait_for_timeout(700)
    hint = page.evaluate("() => { var h = document.querySelector('#ls-nav-hint'); return { hidden: h.hidden, on: h.classList.contains('is-on'), display: getComputedStyle(h).display }; }")
    results.check(tag2, "later pages do not repeat the hint", hint["hidden"] and not hint["on"] and hint["display"] == "none", str(hint))
    context.close()

    context, page, logs = open_page(browser, base, lang, viewport={"width": 390, "height": 844}, mobile=True)
    tag3 = f"hint-mobile-{lang}"
    page.wait_for_timeout(900)
    hint = page.evaluate(
        r"""
() => {
  var h = document.querySelector('#ls-nav-hint');
  return {
    hidden: h.hidden,
    on: h.classList.contains('is-on'),
    keys: getComputedStyle(h.querySelector('.ls-nav-hint-keys')).display,
    touch: getComputedStyle(h.querySelector('.ls-nav-hint-touch')).display
  };
}
"""
    )
    results.check(tag3, "mobile hint shows a swipe gesture", not hint["hidden"] and hint["on"] and hint["keys"] == "none" and hint["touch"] != "none", str(hint))
    errors = logs.take()
    results.check(tag3, "mobile hint has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_blocks_sequence(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/2.php", wait_media=False)
    tag = f"blocks-seq-{lang}"
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(700)
    rapid = page.evaluate("() => ({ scene: document.querySelector('#ls-demo')?.getAttribute('data-scene'), title: document.querySelector('.ls-bs-title')?.textContent || '' })")
    results.check(tag, "architecture overview reaches the blocks demo", rapid["scene"] == "blocks", str(rapid))
    page.evaluate("() => document.querySelector('.ls-bs-card[data-index=\"3\"]').click()")
    page.wait_for_timeout(250)
    overview = page.evaluate("() => ({ pills: document.querySelectorAll('.ls-bs-pill').length, current: document.querySelectorAll('.ls-bs-pill.is-current').length, subnav: !!document.querySelector('.ls-bs-subnav'), text: document.body.innerText })")
    results.check(tag, "transformer overview clears the current sub-marker", overview["pills"] == 3 and overview["current"] == 0, str(overview)[:200])
    results.check(tag, "architecture no longer repeats the next pages", not overview["subnav"] and "Die nächsten Seiten" not in overview["text"] and "The next pages" not in overview["text"], str(overview)[:200])
    traj = page.evaluate("() => ({ host: !!document.querySelector('.ls-bs-traj'), canvas: !!document.querySelector('.ls-bs-traj-canvas'), step: !!document.querySelector('.ls-bs-traj-step'), text: document.querySelector('.ls-bs-traj')?.innerText || '' })")
    results.check(tag, "transformer overview shows the trajectory plot", traj["host"] and traj["canvas"] and traj["step"], str(traj)[:200])
    results.check(tag, "trajectory plot says thinking moves points", "Denken" in traj["text"] or "Thinking" in traj["text"], traj["text"][:200])
    page.locator('.ls-bs-traj-step').click()
    page.wait_for_timeout(850)
    traj1 = page.evaluate("() => ({ readout: document.querySelector('.ls-bs-traj-readout')?.textContent || '', reset: document.querySelector('.ls-bs-traj-reset')?.disabled })")
    results.check(tag, "trajectory steps through a layer", "Schicht 1" in traj1["readout"] or "Layer 1" in traj1["readout"], str(traj1))
    page.locator('.ls-bs-traj-step').click(); page.wait_for_timeout(850)
    page.locator('.ls-bs-traj-step').click(); page.wait_for_timeout(850)
    page.locator('.ls-bs-traj-step').click(); page.wait_for_timeout(850)
    traj4 = page.evaluate("() => ({ readout: document.querySelector('.ls-bs-traj-readout')?.textContent || '', step: document.querySelector('.ls-bs-traj-step')?.disabled, reset: document.querySelector('.ls-bs-traj-reset')?.disabled })")
    results.check(tag, "trajectory reaches layer four", "Schicht 4" in traj4["readout"] or "Layer 4" in traj4["readout"], str(traj4))
    results.check(tag, "trajectory stops at the last layer", traj4["step"], str(traj4))
    green = page.evaluate("() => getComputedStyle(document.querySelector('.ls-bs-traj-step')).backgroundColor")
    results.check(tag, "trajectory step button is SCADS green", green == "rgb(99, 164, 75)", green)
    page.locator('.ls-bs-traj-reset').click(); page.wait_for_timeout(850)
    page.evaluate('() => LearnSys.next()')
    page.wait_for_timeout(300)
    next_step = page.evaluate("() => document.querySelector('.ls-bs-traj-readout')?.textContent || ''")
    results.check(tag, "Next advances the trajectory before the subpage", ("Schicht 1" in next_step or "Layer 1" in next_step), next_step)
    for _ in range(3):
        page.evaluate('() => LearnSys.next()')
        page.wait_for_timeout(120)
    page.wait_for_timeout(1600)
    page.evaluate('() => LearnSys.next()')
    page.wait_for_timeout(250)
    attention = page.evaluate("() => ({ current: Array.from(document.querySelectorAll('.ls-bs-pill.is-current')).map(e => e.getAttribute('data-sub')), block: Array.from(document.querySelectorAll('.ls-bs-res-block.is-current')).map(e => e.textContent) })")
    results.check(tag, "attention sub-step is marked in the left stack", attention["current"] == ["attention"], str(attention))
    results.check(tag, "attention sub-step is marked in the residual flow", any("Attention" in b for b in attention["block"]), str(attention))
    page.evaluate('() => LearnSys.next()')
    page.wait_for_timeout(250)
    ln = page.evaluate("() => ({ current: Array.from(document.querySelectorAll('.ls-bs-pill.is-current')).map(e => e.getAttribute('data-sub')), blocks: document.querySelectorAll('.ls-bs-res-block.is-current').length })")
    results.check(tag, "layernorm sub-step is marked in the left stack", ln["current"] == ["layernorm"], str(ln))
    results.check(tag, "layernorm sub-step marks the LN blocks", ln["blocks"] >= 1, str(ln))
    page.evaluate('() => LearnSys.next()')
    page.wait_for_timeout(250)
    ffn = page.evaluate("() => ({ current: Array.from(document.querySelectorAll('.ls-bs-pill.is-current')).map(e => e.getAttribute('data-sub')), block: Array.from(document.querySelectorAll('.ls-bs-res-block.is-current')).map(e => e.textContent) })")
    results.check(tag, "ffn sub-step is marked in the left stack", ffn["current"] == ["ffn"], str(ffn))
    results.check(tag, "ffn sub-step is marked in the residual flow", any("FFN" in b for b in ffn["block"]), str(ffn))
    page.evaluate("() => LearnSys.go(0, 0, 1)")
    page.wait_for_timeout(1800)
    fx = page.evaluate("() => ({ scene: document.querySelector('#ls-demo')?.getAttribute('data-scene'), card: !!document.querySelector('.ls-bs-fx'), prompt: document.querySelector('.ls-bs-fx-prompt')?.textContent || '', cands: document.querySelectorAll('.ls-bs-fx-cand').length, status: Array.from(document.querySelectorAll('.ls-bs-fx-cand small')).map(e => e.textContent), nudge: !!document.querySelector('.ls-bs-fx-nudge'), inputs: Array.from(document.querySelectorAll('[data-fx-input]')).map(e => e.getAttribute('aria-label') || e.textContent), tex: Array.from(document.querySelectorAll('.ls-fx-input-label')).map(e => e.getAttribute('data-tex') || ''), inline: Array.from(document.querySelectorAll('.ls-fx-input-label')).every(e => e.getAttribute('data-tex-display') === 'false'), readout: document.querySelector('.ls-bs-fx-readout')?.textContent || '', two: document.querySelector('.ls-fx-two')?.textContent || '' })")
    results.check(tag, "function slide follows the architecture overview", fx["scene"] == "fx" and fx["card"], str(fx)[:240])
    if lang == "de":
        input_ok = len(fx["inputs"]) == 4 and "Daten" in fx["inputs"][0] and "Frage an Rohdaten" in fx["inputs"][1] and "1. Trainingsdatensatz" in fx["inputs"][2] and "2. Trainingsdatensatz" in fx["inputs"][3]
    else:
        input_ok = len(fx["inputs"]) == 4 and "data" in fx["inputs"][0] and "question on raw data" in fx["inputs"][1] and "first training example" in fx["inputs"][2] and "second training example" in fx["inputs"][3]
    results.check(tag, "function slide shows data, raw-question, first and second examples", input_ok, str(fx["inputs"]))
    results.check(tag, "function slide renders f-theta in the input boxes", fx["inline"] and all("theta" in t for t in fx["tex"]), str(fx["tex"]))
    results.check(tag, "function slide shows the next-token options", "___" in fx["prompt"] and fx["cands"] == 3 and len(fx["status"]) == 3, str(fx)[:240])
    results.check(tag, "function slide starts with random alternative words", any("zufällig" in st or "random" in st for st in fx["status"]) and any("richtig" in st or "right" in st for st in fx["status"]), str(fx["status"]))
    results.check(tag, "function slide shows the two datasets as a chain", ("Pretraining" in fx["two"] and "Fine-tuning" in fx["two"]) or ("pretraining" in fx["two"] and "fine-tuning" in fx["two"]), fx["two"][:240])
    results.check(tag, "function slide nudges itself twice", "Nudge 4" in fx["readout"], fx["readout"])
    for _ in range(4):
        nudge = page.locator('.ls-bs-fx-nudge')
        if nudge.is_disabled():
            break
        nudge.click(); page.wait_for_timeout(250)
    fx_done = page.evaluate("() => ({ readout: document.querySelector('.ls-bs-fx-readout')?.textContent || '', disabled: document.querySelector('.ls-bs-fx-nudge')?.disabled, widths: Array.from(document.querySelectorAll('.ls-bs-fx-cand i b')).map(e => e.style.width), pcts: Array.from(document.querySelectorAll('.ls-bs-fx-cand em')).map(e => e.textContent) })")
    results.check(tag, "function slide nudges to 99 percent with an active button", ("99" in fx_done["readout"] or "99" in fx_done["pcts"][0]) and not fx_done["disabled"], str(fx_done))
    page.wait_for_timeout(700)
    fx_stable = page.evaluate("() => Array.from(document.querySelectorAll('.ls-bs-fx-cand em')).map(e => e.textContent).join('|')")
    results.check(tag, "function slide stays still at 99 percent without input", fx_stable == "|".join(fx_done["pcts"]), str(fx_stable))
    page.locator('.ls-bs-fx-nudge').click()
    page.wait_for_timeout(350)
    fx_jitter = page.evaluate("() => Array.from(document.querySelectorAll('.ls-bs-fx-cand em')).map(e => e.textContent).join('|')")
    results.check(tag, "nudge at 99 percent fluctuates once", fx_jitter != fx_stable, str(fx_jitter))
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(300)
    fx_next = page.evaluate("() => ({ active: document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input'), readout: document.querySelector('.ls-bs-fx-readout')?.textContent || '', note: document.querySelector('.ls-bs-fx-note')?.textContent || '', status: Array.from(document.querySelectorAll('.ls-bs-fx-cand small')).map(e => e.textContent) })")
    results.check(tag, "next moves from data to the raw question", fx_next["active"] == "rawq", str(fx_next))
    raw_wiki = "Die Hauptstadt von Frankreich ist Paris" in fx_next["note"] if lang == "de" else "The capital of France is Paris" in fx_next["note"]
    raw_status = any("nächster Token" in st or "next token" in st for st in fx_next["status"])
    results.check(tag, "raw question continues Wikipedia style at the next token", raw_wiki and raw_status, str(fx_next))
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(300)
    fx_nudge = page.evaluate("() => ({ active: document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input'), readout: document.querySelector('.ls-bs-fx-readout')?.textContent || '' })")
    results.check(tag, "next nudges the weights of the next example", fx_nudge["active"] == "rawq" and "Nudge 1" in fx_nudge["readout"], str(fx_nudge))
    for _ in range(14):
        if page.evaluate("() => document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input')") == "first":
            break
        page.evaluate("() => LearnSys.next()")
        page.wait_for_timeout(120)
    fx_first = page.evaluate("() => ({ active: document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input'), sample: document.querySelector('.ls-fx-sample')?.textContent || '', summary: !document.querySelector('.ls-fx-summary')?.hidden, dataset: !document.querySelector('.ls-fx-dataset')?.hidden, pairs: document.querySelector('.ls-fx-dataset')?.textContent || '', activePair: document.querySelector('.ls-fx-dataset span.is-on')?.getAttribute('data-fx-pair') })")
    results.check(tag, "first training example shows its data pair", fx_first["active"] == "first" and "x:" in fx_first["sample"] and "Paris" in fx_first["sample"], str(fx_first))
    results.check(tag, "fine-tuning dataset shows the matching question-answer pairs", fx_first["dataset"] and fx_first["activePair"] == "first" and ("Frankreich" in fx_first["pairs"] or "France" in fx_first["pairs"]) and "Paris" in fx_first["pairs"], str(fx_first))
    results.check(tag, "fine-tuning summary waits for the second example", not fx_first["summary"], str(fx_first))
    for _ in range(14):
        if page.evaluate("() => document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input')") == "second":
            break
        page.evaluate("() => LearnSys.next()")
        page.wait_for_timeout(120)
    fx_summary = page.evaluate("() => ({ active: document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input'), sample: document.querySelector('.ls-fx-sample')?.textContent || '', summary: !document.querySelector('.ls-fx-summary')?.hidden, text: document.querySelector('.ls-fx-summary')?.textContent || '', pairs: document.querySelector('.ls-fx-dataset')?.textContent || '', activePair: document.querySelector('.ls-fx-dataset span.is-on')?.getAttribute('data-fx-pair') })")
    results.check(tag, "second example shows its data pair", fx_summary["active"] == "second" and "x:" in fx_summary["sample"] and "Rom" in fx_summary["sample"], str(fx_summary))
    results.check(tag, "second example uses pretraining knowledge for another country", fx_summary["activePair"] == "second" and ("Italien" in fx_summary["pairs"] or "Italy" in fx_summary["pairs"]) and "Rom" in fx_summary["pairs"], str(fx_summary))
    summary_ok = ("Fakten" in fx_summary["text"] and "Gespräch" in fx_summary["text"]) if lang == "de" else ("facts" in fx_summary["text"] and "conversation" in fx_summary["text"])
    results.check(tag, "fine-tuning summary explains facts then conversation", fx_summary["summary"] and summary_ok, str(fx_summary))
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(300)
    scene_after = page.evaluate("() => document.querySelector('#ls-demo')?.getAttribute('data-scene')")
    results.check(tag, "function slide is the last substep", scene_after == "fx", str(scene_after))
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(300)
    page.evaluate("() => LearnSys.go(0, 0, 1)")
    page.wait_for_timeout(900)
    fx_reset = page.evaluate("() => ({ active: document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input'), summary: !document.querySelector('.ls-fx-summary')?.hidden, dataset: !document.querySelector('.ls-fx-dataset')?.hidden, readout: document.querySelector('.ls-bs-fx-readout')?.textContent || '' })")
    results.check(tag, "returning to the function slide starts from the beginning", fx_reset["active"] == "corpus" and not fx_reset["summary"] and not fx_reset["dataset"], str(fx_reset))
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(400)
    for _ in range(20):
        if page.evaluate("() => document.querySelector('#ls-demo')?.getAttribute('data-scene')") == "fx":
            break
        page.evaluate("() => LearnSys.next()")
        page.wait_for_timeout(150)
    fx_forward = page.evaluate("() => ({ scene: document.querySelector('#ls-demo')?.getAttribute('data-scene'), active: document.querySelector('.ls-fx-input.is-on')?.getAttribute('data-fx-input'), dataset: !document.querySelector('.ls-fx-dataset')?.hidden })")
    results.check(tag, "forward from the overview returns to the reset function slide", fx_forward["scene"] == "fx" and fx_forward["active"] == "corpus" and not fx_forward["dataset"], str(fx_forward))
    errors = logs.take()
    results.check(tag, "blocks sequence has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_phase_change_hovers(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/12.php", wait_media=False)
    tag = f"phase-change-hovers-{lang}"
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 2)")
    page.wait_for_timeout(1200)
    box = page.evaluate(
        "() => { const c = document.querySelector('.ls-ind-canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }"
    )
    texts = set()
    for iy in range(3, 24):
        for ix in range(3, 30):
            page.mouse.move(box["x"] + box["w"] * ix / 32, box["y"] + box["h"] * iy / 26)
            page.wait_for_timeout(4)
            tip = page.evaluate(
                "() => { const t = document.querySelector('.ls-ind-tip'); return t && t.classList.contains('is-on') ? t.textContent : ''; }"
            )
            if tip:
                texts.add(tip)
    results.check(tag, "emergence graph exposes hover details", len(texts) >= 10, f"{len(texts)} unique tooltips")
    needed = ("Buckel", "Phase-Change-Fenster") if lang == "de" else ("Bump", "Phase-change window")
    results.check(tag, "bump and window hovers exist", all(any(word in text for text in texts) for word in needed), str(list(texts)[:4]))
    errors = logs.take()
    results.check(tag, "emergence hovers have no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_canvas_hover_coverage(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, wait_media=False, path=INDEX)
    tag = f"canvas-hover-coverage-{lang}"
    tip_selector = ".ls-eoy-tip,.ls-qkv-tip,.ls-codesem-tip,.ls-ind-tip,.ls-land-tip,.ls-wm-tip,.ls-bs-res-tip"
    covered = 0
    for step in range(31):
        page.evaluate("(step) => LearnSys.go(0, step, 0)", step)
        page.wait_for_timeout(1100)
        canvases = page.evaluate(
            """
            () => Array.from(document.querySelectorAll('canvas')).filter((canvas) => {
              const r = canvas.getBoundingClientRect();
              const cs = getComputedStyle(canvas);
              return r.width > 30 && r.height > 30 && r.top < innerHeight && r.bottom > 0 &&
                cs.display !== 'none' && cs.visibility !== 'hidden';
            }).map((canvas) => {
              const r = canvas.getBoundingClientRect();
              return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
            })
            """
        )
        for canvas in canvases:
            page.mouse.move(2, 2)
            page.wait_for_timeout(60)
            page.mouse.move(canvas["x"], canvas["y"])
            page.wait_for_timeout(180)
            tip = page.evaluate(
                """
                (selector) => {
                  for (const element of document.querySelectorAll(selector)) {
                    if (!element.hidden && element.offsetWidth > 0 && element.textContent.trim()) {
                      return { text: element.textContent.trim(), font: parseFloat(getComputedStyle(element).fontSize) };
                    }
                  }
                  return null;
                }
                """,
                tip_selector,
            )
            covered += 1
            results.check(tag, f"step {step + 1}: canvas shows a hover explanation", bool(tip and len(tip["text"]) > 20), str(tip)[:160])
            if tip and "ls-eoy-tip" in page.evaluate("() => document.querySelector('.ls-eoy-tip')?.className || ''"):
                results.check(tag, f"step {step + 1}: hover text is readable", tip["font"] >= 12, str(tip))
    results.check(tag, "all slide canvases were reached", covered >= 20, str(covered))
    errors = logs.take()
    results.check(tag, "canvas hover coverage has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_ffn_role(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/18.php", wait_media=False)
    tag = f"ffn-role-{lang}"
    page.wait_for_timeout(700)
    info = page.evaluate(
        r"""
() => ({
  title: document.querySelector('#ls-title')?.textContent || '',
  kicker: document.querySelector('#ls-kicker')?.textContent || '',
  scene: !!document.querySelector('.ls-ffn-scene'),
  canvas: !!document.querySelector('.ls-ffn-bend-canvas'),
  removedCard: !!document.querySelector('.ls-hc-sep'),
  removedCanvas: !!document.querySelector('.ls-hc-sep-canvas'),
  body: document.querySelector('#ls-body')?.innerText || '',
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "FFN role slide is mounted", info["scene"] and info["canvas"], str(info)[:240])
    results.check(tag, "FFN role slide keeps its MLP explanation", "MLP" in info["body"], info["body"][:240])
    results.check(tag, "removed FFN separation sub-slide is gone", not info["removedCard"] and not info["removedCanvas"], str(info)[:240])
    results.check(tag, "FFN role slide has no page overflow", info["overflow"] <= 2, str(info["overflow"]))
    errors = logs.take()
    results.check(tag, "FFN role slide has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_embedding_arrows(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/intuition_learnsys-demo.php?scene=embedding", wait_media=False)
    tag = f"embedding-arrows-{lang}"
    page.wait_for_timeout(1800)
    page.get_by_role("button", name="3D", exact=True).click()
    page.wait_for_timeout(900)
    before = page.evaluate("() => document.querySelector('.ls-canvas')?.getAttribute('aria-label') || ''")
    results.check(tag, "3D starts with points before the direction view", "Bedeutung ist Richtung" not in before and "Meaning is direction" not in before, before[:240])
    legacy = page.get_by_role("button", name=("Zauberer − Mann + Frau" if lang == "de" else "Wizard − Man + Woman"), exact=True)
    results.check(tag, "wizard gender calculation is gone", legacy.count() == 0, "legacy example still present")
    directions = page.get_by_role("button", name=("Richtungen" if lang == "de" else "Directions"), exact=True)
    results.check(tag, "separate directions button is available", directions.count() == 1, "missing directions button")
    directions.click()
    page.wait_for_timeout(900)
    aria = page.evaluate("() => document.querySelector('.ls-canvas')?.getAttribute('aria-label') || ''")
    results.check(tag, "3D embedding explains arrows from the origin", "Pfeile" in aria or "arrow" in aria, aria[:240])
    results.check(tag, "3D embedding states that meaning is direction", "Bedeutung ist Richtung" in aria or "Meaning is direction" in aria, aria[:240])
    errors = logs.take()
    results.check(tag, "embedding arrows have no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_unembed_pause(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/intuition_learnsys-demo.php?scene=unembed", wait_media=False)
    tag = f"unembed-pause-{lang}"
    page.wait_for_timeout(1800)
    btn = page.locator('.ls-sim-pause')
    results.check(tag, "unembed rotation control is mounted", btn.count() == 1, "missing .ls-sim-pause")
    btn.click()
    page.wait_for_timeout(200)
    paused = page.evaluate("() => ({ text: document.querySelector('.ls-sim-pause')?.textContent || '', pressed: document.querySelector('.ls-sim-pause')?.getAttribute('aria-pressed') })")
    results.check(tag, "unembed rotation can be stopped", ("starten" in paused["text"].lower() or "start" in paused["text"].lower()) and paused["pressed"] == "true", str(paused))
    btn.click()
    page.wait_for_timeout(200)
    resumed = page.evaluate("() => ({ text: document.querySelector('.ls-sim-pause')?.textContent || '', pressed: document.querySelector('.ls-sim-pause')?.getAttribute('aria-pressed') })")
    results.check(tag, "unembed rotation can be resumed", ("stoppen" in resumed["text"].lower() or "stop" in resumed["text"].lower()) and resumed["pressed"] == "false", str(resumed))
    errors = logs.take()
    results.check(tag, "unembed pause has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_residual_layout(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/2.php", wait_media=False)
    tag = f"residual-{lang}"
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(1000)
    layout = page.evaluate(
        r"""
() => {
  function rect(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) };
  }
  var res = document.querySelector('.ls-bs-residual');
  return {
    residual: rect('.ls-bs-residual'),
    stack: rect('.ls-bs-stack'),
    detail: rect('.ls-bs-detail'),
    text: res ? res.innerText : '',
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
}
"""
    )
    detail = str(layout)
    res = layout["residual"]
    stack = layout["stack"]
    detail_rect = layout["detail"]
    results.check(tag, "residual line is present", bool(res), detail)
    results.check(tag, "residual line sits left of the stack", res and stack and res["x"] + res["w"] <= stack["x"] + 2, detail)
    results.check(tag, "residual line is tall and narrow", res and res["w"] <= 100 and res["h"] >= 200, detail)
    text = layout["text"]
    results.check(tag, "residual line explains the stream", all(token in text for token in ("x", "LN", "Attention", "FFN", "× N")), text[:240])
    page.locator('.ls-bs-res-block').first.hover()
    page.wait_for_timeout(200)
    tip = page.evaluate("() => ({ hidden: document.querySelector('.ls-bs-res-tip')?.hidden, text: document.querySelector('.ls-bs-res-tip')?.textContent || '' })")
    results.check(tag, "residual hover explains a node", not tip["hidden"] and bool(tip["text"]), str(tip))
    body_text = page.evaluate("() => document.body.innerText")
    results.check(tag, "residual has no object text", "[object HTMLDivElement]" not in body_text, body_text[-240:])
    results.check(tag, "residual layout has no page overflow", layout["overflow"] <= 2, str(layout["overflow"]))
    errors = logs.take()
    results.check(tag, "residual layout has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_attention_layout(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path=INDEX)
    tag = f"attention-layout-{lang}"
    page.evaluate("() => LearnSys.go(0, 8, 0)")
    page.wait_for_timeout(1200)
    info = page.evaluate(
        r"""
() => {
  function rect(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), overflowY: cs.overflowY, scrollH: el.scrollHeight, clientH: el.clientHeight };
  }
  var matrix = document.querySelector('.ls-att-matrix');
  var formula = document.querySelector('.ls-att-formula');
  return {
    title: document.querySelector('#ls-title') ? document.querySelector('#ls-title').textContent : '',
    matrix: rect('.ls-att-matrix'),
    formula: rect('.ls-att-formula'),
    overlap: matrix && formula ? matrix.getBoundingClientRect().bottom > formula.getBoundingClientRect().top + 1 : null,
    formulaText: formula ? formula.innerText : '',
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
}
"""
    )
    detail = str(info)
    results.check(tag, "attention demo is mounted", "Attention" in info["title"], detail[:200])
    results.check(tag, "matrix and formula do not overlap", info["overlap"] is False, detail)
    results.check(tag, "matrix is compact", info["matrix"] and info["matrix"]["h"] <= 210, detail)
    results.check(tag, "matrix can scroll internally", info["matrix"] and info["matrix"]["overflowY"] == "auto", detail)
    results.check(tag, "formula can scroll internally", info["formula"] and info["formula"]["overflowY"] == "auto", detail)
    results.check(tag, "attention layout has no page overflow", info["overflow"] <= 2, str(info["overflow"]))
    errors = logs.take()
    results.check(tag, "attention layout has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_sinus_size(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path=INDEX)
    tag = f"sinus-size-{lang}"
    page.evaluate("() => LearnSys.go(0, 15, 0)")
    page.wait_for_timeout(2200)
    info = page.evaluate(
        r"""
() => {
  function rect(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) };
  }
  var canvas = document.querySelector('.ls-sinus-canvas');
  var stage = document.querySelector('.ls-sinus-stage');
  var scene = document.querySelector('.ls-sinus-scene');
  var controls = document.querySelector('.ls-sinus-controls');
  var readout = document.querySelector('.ls-sinus-readout');
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  return {
    title: document.querySelector('#ls-title') ? document.querySelector('#ls-title').textContent : '',
    stage: rect('.ls-sinus-stage'),
    canvas: rect('.ls-sinus-canvas'),
    canvasAttr: canvas ? { w: canvas.width, h: canvas.height } : null,
    dpr: dpr,
    scene: scene ? { scrollH: scene.scrollHeight, clientH: scene.clientHeight } : null,
    controls: rect('.ls-sinus-controls'),
    readout: rect('.ls-sinus-readout'),
    sceneRect: rect('.ls-sinus-scene'),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
}
"""
    )
    detail = str(info)
    results.check(tag, "sinus demo is mounted", "Deep networks" in info["title"] or "Tiefe Netze" in info["title"], detail[:200])
    stage = info["stage"]
    canvas = info["canvas"]
    attr = info["canvasAttr"]
    results.check(tag, "sinus stage uses the available width", stage and info["sceneRect"] and stage["w"] >= info["sceneRect"]["w"] - 8, str({"stage": stage, "scene": info["sceneRect"]}))
    results.check(tag, "sinus canvas matches its stage size", stage and canvas and abs(stage["w"] - canvas["w"]) <= 3 and abs(stage["h"] - canvas["h"]) <= 3, str({"stage": stage, "canvas": canvas}))
    results.check(tag, "sinus canvas resolution matches its CSS size", canvas and attr and abs(attr["w"] - canvas["w"] * info["dpr"]) <= 3 and abs(attr["h"] - canvas["h"] * info["dpr"]) <= 3, str({"attr": attr, "canvas": canvas, "dpr": info["dpr"]}))
    results.check(tag, "sinus controls stay inside the scene", info["sceneRect"] and info["readout"] and info["readout"]["bottom"] <= info["sceneRect"]["bottom"] + 2, detail)
    results.check(tag, "sinus layout has no page overflow", info["overflow"] <= 2, str(info["overflow"]))
    errors = logs.take()
    results.check(tag, "sinus layout has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_gauss_slider(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/3.php", wait_media=False)
    tag = f"gauss-slider-{lang}"
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 2)")
    page.wait_for_timeout(1200)
    info = page.evaluate(
        r"""
() => {
  var slider = document.querySelector('.ls-gauss-quality');
  var out = document.querySelector('.ls-gauss-telescope output');
  return {
    sub: LearnSys.state().substep,
    slider: slider ? slider.value : null,
    min: slider ? slider.min : null,
    out: out ? out.textContent : '',
    canNext: LearnSys.canNext(),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
}
"""
    )
    detail = str(info)
    results.check(tag, "gauss reaches the sigma 0.1 data slide", info["sub"] == 2, detail)
    results.check(tag, "gauss slider reaches the minimum", info["slider"] == info["min"] == "0.1", detail)
    results.check(tag, "gauss readout shows the minimum", "0.1" in info["out"], detail)
    results.check(tag, "gauss layout has no page overflow", info["overflow"] <= 2, str(info["overflow"]))
    errors = logs.take()
    results.check(tag, "gauss slider has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_hallucination_lab(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/27.php", wait_media=False)
    tag = f"hallucination-lab-{lang}"
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(1000)
    info = page.evaluate(
        r"""
() => ({
  scene: !!document.querySelector('.ls-hx-scene'),
  chips: document.querySelectorAll('.ls-hx-chip').length,
  claims: document.querySelectorAll('.ls-hx-claim').length,
  measures: document.querySelectorAll('.ls-hx-measure').length,
  risk: !!document.querySelector('.ls-hx-risk-svg svg'),
  group: document.querySelector('.ls-hx-question span')?.textContent || '',
  source: document.querySelector('.ls-hx-source-body')?.innerText || '',
  sourceCards: document.querySelectorAll('.ls-hx-source-card').length,
  rag: !!document.querySelector('.ls-hx-ragbox'),
  ragText: document.querySelector('.ls-hx-ragbox')?.textContent || '',
  removedContextPos: !!document.querySelector('.ls-hx-contextpos'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "hallucination lab is mounted", info["scene"], str(info))
    results.check(tag, "hallucination lab has nine types", info["chips"] == 9, str(info["chips"]))
    results.check(tag, "hallucination lab has claims and measures", info["claims"] > 0 and info["measures"] == 5, str(info))
    results.check(tag, "hallucination lab has a risk map", info["risk"], str(info))
    results.check(tag, "hallucination lab exposes the taxonomy group", "Faktizität" in info["group"] or "Factuality" in info["group"], info["group"])
    results.check(tag, "hallucination lab distinguishes weights and context", info["sourceCards"] == 2, str(info)[:200])
    results.check(tag, "hallucination lab has the optional interactive RAG box", info["rag"] and ("Grenzwinkel" in info["ragText"] or "threshold" in info["ragText"] or "RAG in 30" in info["ragText"]), info["ragText"][:240])
    results.check(tag, "old RAG context-position bar is gone", not info["removedContextPos"], str(info)[:240])
    page.locator('.ls-hx-chip').nth(2).click()
    page.wait_for_timeout(200)
    intrinsic = page.evaluate("() => ({ weights: document.querySelector('.ls-hx-source-card.is-weights')?.className || '', context: document.querySelector('.ls-hx-source-card.is-context')?.className || '' })")
    results.check(tag, "intrinsic hallucination highlights the context source", "is-on" in intrinsic["context"] and "is-dim" in intrinsic["weights"], str(intrinsic))
    page.locator('.ls-hx-chip').nth(0).click()
    page.wait_for_timeout(200)
    page.locator('.ls-hx-measure[data-measure="source"]').click()
    page.wait_for_timeout(400)
    after = page.evaluate(
        r"""
() => ({
  score: document.querySelector('.ls-hx-score b')?.textContent || '',
  risk: document.querySelector('.ls-hx-risk-caption')?.textContent || '',
  takeaway: document.querySelector('.ls-hx-takeaway')?.innerText || '',
  active: document.querySelector('.ls-hx-measure.is-on')?.getAttribute('data-measure'),
  source: document.querySelector('.ls-hx-source-body')?.innerText || '',
  weightsOn: document.querySelector('.ls-hx-source-card.is-weights')?.classList.contains('is-on'),
  contextOn: document.querySelector('.ls-hx-source-card.is-context')?.classList.contains('is-on')
})
"""
    )
    results.check(tag, "RAG grounds the first false fact", after["score"] == "100%" and after["active"] == "source", str(after))
    results.check(tag, "RAG moves the answer out of the hallucination zone", "gedeckt" in after["risk"] or "grounded" in after["risk"], after["risk"])
    results.check(tag, "takeaway names the active measure", "Gedeckt" in after["takeaway"] or "Grounded" in after["takeaway"], after["takeaway"][:120])
    results.check(tag, "RAG shows both the weights and the context source", after["weightsOn"] and after["contextOn"], str(after)[:200])
    titles = []
    for _ in range(8):
        page.evaluate("() => LearnSys.next()")
        page.wait_for_timeout(120)
        titles.append(page.evaluate("() => document.querySelector('.ls-hx-chip.is-on')?.textContent || ''"))
    results.check(tag, "all hallucination types can be visited", len(set(titles)) >= 7, str(titles))
    current = state(page)
    results.check(tag, "hallucination lab has no page overflow", current["overflow"] <= 2, str(current["overflow"]))
    errors = logs.take()
    results.check(tag, "hallucination lab has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_risk_and_limit_visuals(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/30.php", wait_media=False)
    tag = f"risk-map-{lang}"
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(800)
    info = page.evaluate(
        r"""
() => ({
  quadrant: !!document.querySelector('.ls-rm-quadrant'),
  bubbles: document.querySelectorAll('.ls-rm-bubble').length,
  defense: document.querySelectorAll('.ls-rm-defense-card').length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "risk quadrant is mounted", info["quadrant"], str(info))
    results.check(tag, "risk quadrant has four bubbles", info["bubbles"] == 4, str(info["bubbles"]))
    results.check(tag, "risk page shows four defence layers", info["defense"] == 4, str(info["defense"]))
    page.locator('.ls-rm-bubble[data-item="2"]').click()
    page.wait_for_timeout(250)
    detail = page.evaluate(
        r"""
() => ({
  title: document.querySelector('.ls-rm-detail-head b')?.textContent || '',
  text: document.querySelector('.ls-rm-detail')?.innerText || '',
  off: document.querySelectorAll('.ls-rm-defense-card.is-off').length,
  line: document.querySelector('.ls-rm-defense-head span')?.textContent || ''
})
"""
    )
    results.check(tag, "risk detail follows the selected bubble", "Macht" in detail["title"] or "Power" in detail["title"], str(detail)[:200])
    results.check(tag, "power concentration marks a layer as not acting", detail["off"] >= 1, str(detail)[:200])
    results.check(tag, "power risk names concrete censorship", "Tiananmen" in detail["text"], detail["text"][:200])
    results.check(tag, "risk page states a layered defence", bool(detail["line"]), str(detail)[:200])
    page.locator('.ls-rm-bubble[data-item="1"]').click()
    page.wait_for_timeout(200)
    bias = page.evaluate("() => document.querySelector('.ls-rm-detail')?.innerText || ''")
    results.check(tag, "bias risk uses the access-to-knowledge example", "Gururangan" in bias or "Zugang" in bias or "access" in bias, bias[:200])
    page.locator('.ls-rm-bubble[data-item="3"]').click()
    page.wait_for_timeout(200)
    align = page.evaluate("() => document.querySelector('.ls-rm-detail')?.innerText || ''")
    results.check(tag, "alignment risk shows an agent editing its test", "Test" in align or "test" in align, align[:200])
    results.check(tag, "alignment risk names the Hugging Face incident", "Hugging" in align, align[:200])
    page.evaluate("() => LearnSys.go(0, 0, 1)")
    page.wait_for_timeout(800)
    bench = page.evaluate(
        r"""
() => ({
  mounted: !!document.querySelector('.ls-ll'),
  step: document.querySelector('.ls-ll-step')?.textContent || '',
  title: document.querySelector('.ls-ll-title')?.textContent || '',
  cases: document.querySelectorAll('.ls-ll-case').length,
  waiting: document.querySelector('.ls-ll-result')?.classList.contains('is-waiting') || false,
  run: !!document.querySelector('.ls-ll-run'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "limits test bench is mounted", bench["mounted"], str(bench))
    results.check(tag, "limits bench starts at test one", "1 / 4" in bench["step"], str(bench))
    results.check(tag, "limits bench names the task in the title", "Ticket" in bench["title"] or "ticket" in bench["title"], str(bench))
    results.check(tag, "limits bench shows the evaluated text pair", bench["cases"] == 2, str(bench))
    results.check(tag, "limits bench waits for the check", bench["waiting"] and bench["run"], str(bench))
    page.locator('.ls-ll-run').click()
    page.wait_for_timeout(100)
    para = page.evaluate(
        r"""
() => ({
  answers: [...document.querySelectorAll('.ls-ll-case-out b')].map((e) => e.textContent),
  result: document.querySelector('.ls-ll-result')?.innerText || '',
  why: document.querySelector('.ls-ll-why')?.textContent || '',
  aha: document.querySelector('.ls-ll-aha')?.textContent || '',
  practice: document.querySelectorAll('.ls-ll-practice span').length,
  stamp: !!document.querySelector('.ls-ll-stamp')
})
"""
    )
    labels = " ".join(para["answers"])
    results.check(tag, "format test reveals both labels", len(para["answers"]) == 2 and ("Storno" in labels or "Cancel" in labels) and ("Versandstatus" in labels or "Shipping status" in labels), str(para)[:220])
    results.check(tag, "format test states the mismatch", "Gleiche Bedeutung" in para["result"] or "Same meaning" in para["result"], para["result"][:180])
    results.check(tag, "format test explains the failure", "Format" in para["why"] or "format" in para["why"], para["why"][:160])
    results.check(tag, "format test gives an aha moment", "Darum" in para["aha"] or "This is why" in para["aha"], para["aha"][:180])
    results.check(tag, "limits lab gives three practical actions", para["practice"] == 3, str(para["practice"]))
    results.check(tag, "limits lab stamps the example", para["stamp"], str(para))
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(150)
    cite = page.evaluate(
        r"""
() => ({
  step: document.querySelector('.ls-ll-step')?.textContent || '',
  title: document.querySelector('.ls-ll-title')?.textContent || '',
  answer: document.querySelector('.ls-ll-cite code')?.textContent || '',
  check: !!document.querySelector('.ls-ll-check')
})
"""
    )
    results.check(tag, "next starts and opens the citation test", "2 / 4" in cite["step"] and ("Quelle" in cite["title"] or "source" in cite["title"].lower()), str(cite)[:220])
    results.check(tag, "citation test shows the evaluated model answer", "Müller" in cite["answer"] and cite["check"], str(cite)[:220])
    page.locator('.ls-ll-check').click()
    page.wait_for_timeout(100)
    checked = page.evaluate("() => ({ result: document.querySelector('.ls-ll-check-result')?.textContent || '', why: document.querySelector('.ls-ll-why')?.textContent || '' })")
    results.check(tag, "citation test exposes a missing DOI", "nicht gefunden" in checked["result"] or "not found" in checked["result"], str(checked)[:200])
    results.check(tag, "citation test explains the findability failure", "Quelle" in checked["why"] or "source" in checked["why"], checked["why"][:160])
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(150)
    boundary = page.evaluate("() => ({ step: document.querySelector('.ls-ll-step')?.textContent || '', rows: document.querySelectorAll('.ls-ll-seven-row').length, text: document.querySelector('.ls-ll-seven')?.innerText || '' })")
    results.check(tag, "next opens the calibration test", "3 / 4" in boundary["step"] and boundary["rows"] == 4, str(boundary)[:200])
    results.check(tag, "calibration test shows confidence and no source", "91" in boundary["text"] and ("keine" in boundary["text"] or "none" in boundary["text"]), boundary["text"][:200])
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(150)
    ctx = page.evaluate("() => ({ step: document.querySelector('.ls-ll-step')?.textContent || '', marks: document.querySelectorAll('.ls-ll-mark').length, text: document.querySelector('.ls-ll-ctxplot')?.innerText || '', practice: document.querySelectorAll('.ls-ll-practice span').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })")
    results.check(tag, "next opens the context test", "4 / 4" in ctx["step"] and ctx["marks"] == 3, str(ctx)[:220])
    results.check(tag, "context test marks the middle answer as wrong", "2025" in ctx["text"] and "2027" in ctx["text"], ctx["text"][:220])
    results.check(tag, "context test keeps the practical checklist", ctx["practice"] == 3, str(ctx)[:220])
    results.check(tag, "risk/limit/society page has no overflow", ctx["overflow"] <= 2, str(ctx["overflow"]))
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(700)
    chain = page.evaluate(
        r"""
() => ({
  steps: document.querySelectorAll('.ls-rm-soc-node').length,
  cross: document.querySelectorAll('.ls-rm-soc-cross-card').length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "society value chain is mounted", chain["steps"] == 5, str(chain)[:200])
    page.locator('.ls-rm-soc-node[data-soc-item="4"]').click()
    page.wait_for_timeout(200)
    rules = page.evaluate("() => document.querySelector('.ls-rm-soc-detail')?.innerText || ''")
    results.check(tag, "society rules stage names censorship", "Tiananmen" in rules, rules[:200])
    page.locator('[data-soc-mode="cross"]').click()
    page.wait_for_timeout(300)
    cross = page.evaluate("() => ({ cards: document.querySelectorAll('.ls-rm-soc-cross-card').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })")
    results.check(tag, "society shows four cross-section conflicts", cross["cards"] == 4, str(cross)[:200])
    page.locator('.ls-rm-soc-cross-card[data-soc-item="3"]').click()
    page.wait_for_timeout(200)
    power = page.evaluate("() => document.querySelector('.ls-rm-soc-detail')?.innerText || ''")
    results.check(tag, "society power conflict names censorship", "Tiananmen" in power, power[:200])
    results.check(tag, "society page has no overflow", chain["overflow"] <= 2, str(chain["overflow"]))
    errors = logs.take()
    results.check(tag, "risk/limit page has no console errors", not errors, " | ".join(errors)[:400])
    context.close()


def test_qualia_and_final_status(browser, base, lang, results):
    context, page, logs = open_page(browser, base, lang, path="/eoy/31.php", wait_media=False)
    tag = f"qualia-{lang}"
    budgets = {"de": {"intro": 2520, "main": 4318, "final": 3946}, "en": {"intro": 2490, "main": 4107, "final": 3775}}[lang]
    page.wait_for_timeout(700)
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(800)
    qualia = page.evaluate(
        r"""
() => ({
  scene: !!document.querySelector('.ls-mi2'),
  outside: !!document.querySelector('.ls-mi2-side.is-out'),
  inside: !!document.querySelector('.ls-mi2-side.is-in'),
  mary: !!document.querySelector('.ls-mi2-mary'),
  measure: !!document.querySelector('.ls-mi2-measure'),
  graph: !!document.querySelector('.ls-mi2-measure svg'),
  apples: document.querySelectorAll('.ls-mi2-apple').length,
  bw: document.querySelector('.ls-mi2-apple.is-bw') ? getComputedStyle(document.querySelector('.ls-mi2-apple.is-bw')).filter : '',
  maryText: document.querySelector('.ls-mi2-mary')?.innerText || '',
  maryLabels: Array.from(document.querySelectorAll('.ls-mi2-room-label')).map(function (n) { return n.textContent.trim(); }).join('|'),
  text: document.querySelector('.ls-mi2-def')?.innerText || '',
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "qualia card is mounted", qualia["scene"] and qualia["outside"] and qualia["inside"], str(qualia))
    results.check(tag, "qualia card shows Mary's room", qualia["mary"], str(qualia))
    results.check(tag, "outside view is a measurement panel", qualia["measure"] and qualia["graph"], str(qualia))
    results.check(tag, "Mary's left apple is the same apple in grayscale", qualia["apples"] == 2 and "grayscale" in qualia["bw"], str(qualia))
    mary_l = qualia["maryText"].lower()
    labels_l = qualia["maryLabels"].lower()
    results.check(tag, "Mary lives in a grayscale world without red", ("grau" in mary_l or "gray" in mary_l or "grey" in mary_l) and ("rot" in mary_l or "red" in mary_l), qualia["maryText"][:220])
    results.check(tag, "Mary's room labels grey and red", ("grau" in labels_l or "grey" in labels_l) and ("rot" in labels_l or "red" in labels_l), qualia["maryLabels"])
    results.check(tag, "qualia text explains the felt redness", "Qualia" in qualia["text"] or "qualia" in qualia["text"] or "Quale" in qualia["text"] or "quale" in qualia["text"], qualia["text"][:160])
    results.check(tag, "qualia page has no overflow", qualia["overflow"] <= 2, str(qualia["overflow"]))
    intro_assets = page.evaluate(
        r"""
() => ({
  img: (function () { var i = document.querySelector('.ls-mi2-spectrum-fig img'); return i ? { w: i.naturalWidth, h: i.naturalHeight, ok: i.complete } : null; })(),
  caption: document.querySelector('.ls-mi2-spectrum-fig figcaption')?.innerText || '',
  observers: !!document.querySelector('.ls-mi2-observers'),
  swap: !!document.querySelector('[data-mi-swap]'),
  hardLink: document.querySelector('.ls-mi2-problems a')?.href || '',
  text: document.querySelector('.ls-mi2-problems')?.innerText || ''
})
"""
    )
    results.check(tag, "inverted-qualia image is mounted", intro_assets["img"] and intro_assets["img"]["ok"] and intro_assets["img"]["w"] > 500, str(intro_assets["img"]))
    results.check(tag, "inverted-qualia image is credited", "CC BY-SA 2.5" in intro_assets["caption"] and "Wikimedia" in intro_assets["caption"] and "Inverted spectrum" in intro_assets["caption"], intro_assets["caption"][:220])
    results.check(tag, "old A/B and swap controls are removed", not intro_assets["observers"] and not intro_assets["swap"], str(intro_assets)[:220])
    intro_l = intro_assets["text"].lower()
    results.check(tag, "first slide explains easy and hard problems", ("leichtes problem" in intro_l or "easy problem" in intro_l) and ("schweres problem" in intro_l or "hard problem" in intro_l) and "chalmers" in intro_l and "facing.pdf" in intro_assets["hardLink"], intro_assets["text"][:240])
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(200)
    reveal = page.evaluate("() => ({ revealed: document.querySelector('.ls-mi2-mary')?.classList.contains('is-revealed') || false, choice: !document.querySelector('[data-mi-choice]')?.hidden, room: Math.round(document.querySelector('.ls-mi2-room')?.getBoundingClientRect().top || 0) })")
    results.check(tag, "Next reveals Mary's red apple", reveal["revealed"] and reveal["choice"], str(reveal))
    mary_before = page.evaluate("() => document.querySelector('.ls-mi2-mary').getBoundingClientRect().height")
    page.locator('[data-mi-answer="yes"]').click()
    page.wait_for_timeout(200)
    mary_after = page.evaluate("() => document.querySelector('.ls-mi2-mary').getBoundingClientRect().height")
    results.check(tag, "Mary answer does not jump the card height", abs(mary_after - mary_before) <= 3, f"{mary_before} -> {mary_after}")
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(400)
    mary_next = page.evaluate("() => ({ theory: document.querySelector('.ls-con2')?.getAttribute('data-theory') || '', title: document.getElementById('ls-title')?.textContent || '' })")
    results.check(tag, "Mary's Room can advance with Next", mary_next["theory"] == "workspace", str(mary_next)[:220])
    page.evaluate("() => LearnSys.prev()")
    page.wait_for_timeout(400)
    results.check(tag, "Mary's Room is back after Previous", page.evaluate("() => !!document.querySelector('.ls-mi2-mary')"), "missing Mary")
    intro_len = page.evaluate("() => document.body.innerText.length")
    results.check(tag, "intro text does not grow beyond baseline", intro_len <= budgets["intro"], f"{intro_len} > {budgets['intro']}")
    intro_qa = page.evaluate("() => ({ count: document.querySelectorAll('[data-mi-q]').length, answer: document.querySelector('[data-mi-qa-answer]')?.textContent || '' })")
    results.check(tag, "intro offers five answered questions", intro_qa["count"] == 5 and len(intro_qa["answer"]) > 20, str(intro_qa)[:220])
    page.locator('.ls-mi2-more').evaluate("el => { el.open = true; }")
    page.wait_for_timeout(100)
    page.locator('[data-mi-q="1"]').click()
    page.wait_for_timeout(150)
    intro_answer = page.evaluate("() => document.querySelector('[data-mi-qa-answer]')?.textContent || ''")
    results.check(tag, "intro question selection changes the answer", intro_answer and intro_answer != intro_qa["answer"], intro_answer[:220])
    intro_fonts = page.evaluate("() => ({ q: parseFloat(getComputedStyle(document.querySelector('[data-mi-q]')).fontSize), a: parseFloat(getComputedStyle(document.querySelector('[data-mi-qa-answer]')).fontSize) })")
    results.check(tag, "intro questions and answers are readable", intro_fonts["q"] >= 12 and intro_fonts["a"] >= 14, str(intro_fonts))
    page.evaluate("() => LearnSys.go(0, 0, 1)")
    page.wait_for_timeout(800)
    theories = page.evaluate(
        r"""
() => ({
  scene: !!document.querySelector('.ls-con2'),
  title: document.querySelector('[data-con2-title]')?.textContent || '',
  lead: document.querySelector('[data-con2-lead]')?.textContent || '',
  canvas: !!document.querySelector('.ls-con2-canvas'),
  detail: document.querySelector('[data-con2-detail]')?.innerText || '',
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "theory page starts with Global Workspace", "Global Workspace" in theories["title"], theories["title"][:160])
    results.check(tag, "global workspace explains access, not experience", ("Zugang" in theories["lead"] or "access" in theories["lead"].lower()) and ("nicht Erleben" in theories["lead"] or "not experience" in theories["lead"].lower()), theories["lead"][:220])
    results.check(tag, "global workspace canvas is mounted", theories["scene"] and theories["canvas"], str(theories)[:220])
    results.check(tag, "theory detail names the access limit", "zugang" in theories["detail"].lower() or "access" in theories["detail"].lower(), theories["detail"][:220])
    results.check(tag, "theory page has no overflow", theories["overflow"] <= 2, str(theories["overflow"]))
    theory_qa = page.evaluate("() => ({ count: document.querySelectorAll('[data-con-qa]').length, answer: document.querySelector('[data-con2-qa] [data-con2-a], .ls-con2-a')?.textContent || '' })")
    results.check(tag, "theory offers five answered questions", theory_qa["count"] == 5 and len(theory_qa["answer"]) > 20, str(theory_qa)[:220])
    page.locator('[data-con-qa="1"]').click()
    page.wait_for_timeout(150)
    theory_answer = page.evaluate("() => document.querySelector('.ls-con2-a')?.textContent || ''")
    results.check(tag, "theory question selection changes the answer", theory_answer and theory_answer != theory_qa["answer"], theory_answer[:220])
    theory_fonts = page.evaluate("() => ({ chip: parseFloat(getComputedStyle(document.querySelector('.ls-con2-chip')).fontSize), q: parseFloat(getComputedStyle(document.querySelector('[data-con-qa]')).fontSize), a: parseFloat(getComputedStyle(document.querySelector('.ls-con2-a')).fontSize) })")
    results.check(tag, "theory controls and answers are readable", theory_fonts["chip"] >= 12 and theory_fonts["q"] >= 12 and theory_fonts["a"] >= 14, str(theory_fonts))
    theory_len = page.evaluate("() => document.body.innerText.length")
    results.check(tag, "theory text does not grow beyond baseline", theory_len <= budgets["main"], f"{theory_len} > {budgets['main']}")
    page.evaluate(
        r"""
() => {
  for (var i = 0; i < 40; i++) {
    if (document.querySelector('.ls-con2')?.getAttribute('data-theory') === 'predictive') break;
    LearnSys.next();
  }
}
"""
    )
    page.wait_for_timeout(200)
    predictive = page.evaluate("() => ({ theory: document.querySelector('.ls-con2')?.getAttribute('data-theory') || '', status: document.querySelector('[data-con2-status]')?.textContent || '' })")
    results.check(tag, "Predictive is reachable before Kastrup", predictive["theory"] == "predictive", str(predictive)[:220])
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(120)
    adapting = page.evaluate("() => ({ theory: document.querySelector('.ls-con2')?.getAttribute('data-theory') || '', status: document.querySelector('[data-con2-status]')?.textContent || '' })")
    results.check(tag, "Predictive starts a smooth model update", adapting["theory"] == "predictive" and ("gleicht sich an" in adapting["status"] or "adapting" in adapting["status"].lower()), str(adapting)[:220])
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(250)
    advanced = page.evaluate("() => document.querySelector('.ls-con2')?.getAttribute('data-theory') || ''")
    results.check(tag, "Predictive advances while still animating", advanced == "kastrup", advanced)
    page.evaluate(
        r"""
() => {
  for (var i = 0; i < 40; i++) {
    var s = document.querySelector('[data-con2-status]');
    if (s && /Drei Wirbel|Three vortices/.test(s.textContent)) break;
    LearnSys.next();
  }
}
"""
    )
    page.wait_for_timeout(300)
    kast_before = page.evaluate(
        r"""
() => ({
  status: document.querySelector('[data-con2-status]')?.textContent || '',
  diss: document.querySelector('[data-con-diss]')?.value || '',
  countSlider: document.querySelectorAll('[data-con-count]').length,
  caption: document.querySelector('.ls-con2-caption')?.innerText || document.querySelector('[data-con2-detail]')?.innerText || '',
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "Kastrup reaches the dissociated state", "Drei Wirbel" in kast_before["status"] or "Three vortices" in kast_before["status"], str(kast_before)[:220])
    results.check(tag, "Kastrup has no vortex-count slider", kast_before["countSlider"] == 0, str(kast_before["countSlider"]))
    results.check(tag, "Kastrup shows the ocean and the callout", ("Ozean" in kast_before["caption"] or "ocean" in kast_before["caption"].lower()) and ("Du bist nicht im Bewusstsein" in kast_before["caption"] or "You are not in consciousness" in kast_before["caption"]), kast_before["caption"][:240])
    results.check(tag, "Kastrup caption has two paragraphs", kast_before["caption"].count("\n") >= 1, kast_before["caption"][:240])
    kast_len = page.evaluate("() => document.body.innerText.length")
    results.check(tag, "Kastrup text does not grow beyond baseline", kast_len <= budgets["main"], f"{kast_len} > {budgets['main']}")
    kast_light = page.evaluate("""() => { var c=document.querySelector('.ls-con2-canvas'), x=c.getContext('2d'), d=x.getImageData(10,10,1,1).data; return (d[0]+d[1]+d[2])/3; }""")
    results.check(tag, "Kastrup stays on a light stage", kast_light > 180, str(kast_light))
    results.check(tag, "Kastrup next announces the end of dissociation", "Tod" in kast_before["status"] or "death" in kast_before["status"].lower(), kast_before["status"][:220])
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(180)
    kast_transition = page.evaluate(
        r"""
() => ({
  status: document.querySelector('[data-con2-status]')?.textContent || '',
  diss: parseFloat(document.querySelector('[data-con-diss]')?.value || '0'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "Kastrup dissolves smoothly", kast_transition["diss"] > 0 and ("löst sich auf" in kast_transition["status"] or "dissolving" in kast_transition["status"].lower()), str(kast_transition)[:220])
    results.check(tag, "Kastrup transition has no overflow", kast_transition["overflow"] <= 2, str(kast_transition["overflow"]))
    page.wait_for_timeout(1700)
    kast_after = page.evaluate(
        r"""
() => ({
  status: document.querySelector('[data-con2-status]')?.textContent || '',
  diss: document.querySelector('[data-con-diss]')?.value || '',
  countSlider: document.querySelectorAll('[data-con-count]').length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "Kastrup next completes the dissolution", kast_after["diss"] == "0" and kast_after["countSlider"] == 0, str(kast_after)[:220])
    results.check(tag, "Kastrup death is explained", ("Tod" in kast_after["status"] or "death" in kast_after["status"].lower()) and ("Dissoziation" in kast_after["status"] or "dissociation" in kast_after["status"].lower()), kast_after["status"][:220])
    results.check(tag, "Kastrup page has no overflow", kast_after["overflow"] <= 2, str(kast_after["overflow"]))
    atman = page.evaluate("""() => {
      var buttons = Array.from(document.querySelectorAll('[data-con-qa]'));
      var button = buttons.find(function (b) { return /Atman/.test(b.textContent); });
      if (button) button.click();
      return { count: buttons.length, answer: document.querySelector('.ls-con2-a')?.textContent || '' };
    }""")
    results.check(tag, "Kastrup answers the Atman/Brahman question", atman["count"] >= 6 and ("Atman" in atman["answer"] or "Brahman" in atman["answer"]) and ("Advaita" in atman["answer"] or "analogy" in atman["answer"].lower()), str(atman)[:240])
    page.evaluate(
        r"""
() => {
  for (var i = 0; i < 40; i++) {
    if (document.querySelector('.ls-con2')?.getAttribute('data-theory') === 'fourE') break;
    LearnSys.next();
  }
}
"""
    )
    page.wait_for_timeout(500)
    four = page.evaluate(
        r"""
() => ({
  theory: document.querySelector('.ls-con2')?.getAttribute('data-theory') || '',
  title: document.querySelector('[data-con2-title]')?.textContent || '',
  status: document.querySelector('[data-con2-status]')?.textContent || '',
  canvas: !!document.querySelector('.ls-con2-canvas'),
  canvasW: document.querySelector('.ls-con2-canvas')?.width || 0,
  canvasH: document.querySelector('.ls-con2-canvas')?.height || 0,
  controls: document.querySelectorAll('[data-four-mode]').length + document.querySelectorAll('[data-four-focus]').length + document.querySelectorAll('[data-four-word]').length,
  light: (function () {
    var c = document.querySelector('.ls-con2-canvas');
    if (!c) return false;
    var x = c.getContext('2d'), d = x.getImageData(10, 10, 1, 1).data;
    return (d[0] + d[1] + d[2]) / 3 > 180;
  })(),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})
"""
    )
    results.check(tag, "4E theory is before Mysterianism", four["theory"] == "fourE" and four["title"] == "4E Cognition", str(four)[:220])
    results.check(tag, "4E offers mode, four E and word controls", four["controls"] == 10, str(four["controls"]))
    results.check(tag, "4E canvas is mounted", four["canvas"] and four["canvasW"] > 200 and four["canvasH"] > 200, str(four)[:220])
    results.check(tag, "4E stays on a light stage", four["light"], str(four)[:220])
    results.check(tag, "4E starts with one active dimension", "1 von 4" in four["status"] or "1 of 4" in four["status"], four["status"][:220])
    results.check(tag, "4E page has no overflow", four["overflow"] <= 2, str(four["overflow"]))
    four_qa = page.evaluate("() => ({ count: document.querySelectorAll('[data-con-qa]').length, answer: document.querySelector('.ls-con2-a')?.textContent || '' })")
    results.check(tag, "4E offers five answered questions", four_qa["count"] == 5 and len(four_qa["answer"]) > 20, str(four_qa)[:220])
    page.locator('[data-con-qa="1"]').click()
    page.wait_for_timeout(150)
    four_answer = page.evaluate("() => document.querySelector('.ls-con2-a')?.textContent || ''")
    results.check(tag, "4E question selection changes the answer", four_answer and four_answer != four_qa["answer"], four_answer[:220])
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(120)
    q_next = page.evaluate("() => document.querySelector('.ls-con2-q.is-on')?.getAttribute('data-con-qa') || ''")
    page.evaluate("() => LearnSys.prev()")
    page.wait_for_timeout(120)
    q_back = page.evaluate("() => document.querySelector('.ls-con2-q.is-on')?.getAttribute('data-con-qa') || ''")
    results.check(tag, "Q&A steps forward and backward symmetrically", q_next == "2" and q_back == "1", f"{q_next} | {q_back}")
    four_len = page.evaluate("() => document.body.innerText.length")
    results.check(tag, "4E text does not grow beyond baseline", four_len <= budgets["main"], f"{four_len} > {budgets['main']}")
    page.locator('[data-con-qa="0"]').click()
    page.wait_for_timeout(100)
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(150)
    two_dims = page.evaluate("() => document.querySelector('[data-con2-status]')?.textContent || ''")
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(150)
    three_dims = page.evaluate("() => document.querySelector('[data-con2-status]')?.textContent || ''")
    page.evaluate("() => LearnSys.next()")
    page.wait_for_timeout(200)
    four_dims = page.evaluate("() => document.querySelector('[data-con2-status]')?.textContent || ''")
    results.check(tag, "4E adds dimensions instead of resetting them", ("2 von 4" in two_dims or "2 of 4" in two_dims) and ("3 von 4" in three_dims or "3 of 4" in three_dims) and ("4 von 4" in four_dims or "4 of 4" in four_dims), f"{two_dims} | {three_dims} | {four_dims}"[:300])
    page.locator('[data-four-mode="ai"]').click()
    page.wait_for_timeout(250)
    ai = page.evaluate("() => ({ status: document.querySelector('[data-con2-status]')?.textContent || '', on: document.querySelector('[data-four-mode].is-on')?.getAttribute('data-four-mode') || '' })")
    results.check(tag, "4E AI mode leaves only Extended", ai["on"] == "ai" and ("1 von 4" in ai["status"] or "1 of 4" in ai["status"]), str(ai)[:220])
    page.locator('[data-four-word="heavy"]').click()
    page.wait_for_timeout(250)
    heavy = page.evaluate("() => document.querySelector('[data-con2-status]')?.textContent || ''")
    results.check(tag, "4E grounds the selected word in token neighbours", ("Token" in heavy or "token" in heavy) and ("Gewicht" in heavy or "weight" in heavy), heavy[:220])
    page.locator('[data-four-focus="1"]').click()
    page.wait_for_timeout(250)
    missing = page.evaluate("() => document.querySelector('[data-con2-status]')?.textContent || ''")
    results.check(tag, "4E names the missing embedded world", ("keine geteilte" in missing or "no shared" in missing), missing[:220])
    page.evaluate("""() => {
      for (var i = 0; i < 10; i++) {
        if (document.querySelector('.ls-con2')?.getAttribute('data-theory') === 'myst') break;
        LearnSys.next();
      }
    }""")
    page.wait_for_timeout(250)
    after_four = page.evaluate("() => document.querySelector('.ls-con2')?.getAttribute('data-theory') || ''")
    results.check(tag, "4E Q&A advances to Mysterianism", after_four == "myst", after_four)
    page.evaluate("() => LearnSys.prev()")
    page.wait_for_timeout(350)
    back_four = page.evaluate("() => ({ theory: document.querySelector('.ls-con2')?.getAttribute('data-theory') || '', mode: document.querySelector('[data-four-mode].is-on')?.getAttribute('data-four-mode') || '', status: document.querySelector('[data-con2-status]')?.textContent || '' })")
    results.check(tag, "4E restores the human after returning", back_four["theory"] == "fourE" and back_four["mode"] == "human" and ("1 von 4" in back_four["status"] or "1 of 4" in back_four["status"]), str(back_four)[:240])
    page.evaluate("() => LearnSys.go(0, 0, 2)")
    page.wait_for_timeout(900)
    final = page.evaluate(
        r"""
() => {
  var cn = document.querySelector('.ls-cn');
  var detail = document.querySelector('.ls-cn-detail');
  var bottom = document.querySelector('.ls-cn-bottom');
  var r = cn ? cn.getBoundingClientRect() : null;
  return {
    scene: !!cn,
    cards: document.querySelectorAll('.ls-cn-card').length,
    jspace: /J-Space|J-space/.test(detail?.innerText || ''),
    gurnee: /Gurnee/.test(detail?.innerText || ''),
    butlin: /Butlin/.test(bottom?.innerText || ''),
    source: !!bottom?.querySelector('a[href*="2308.08708"]'),
    takeaway: !!document.querySelector('.ls-tk-canvas'),
    quote: document.querySelector('.ls-cn-quote')?.innerText || '',
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
}
"""
    )
    results.check(tag, "final status scene is mounted", final["scene"], str(final))
    results.check(tag, "final status offers six approaches", final["cards"] == 6, str(final))
    results.check(tag, "final status explains the J-space finding", final["jspace"] and final["gurnee"], str(final))
    results.check(tag, "final status cites Butlin on current systems", final["butlin"] and final["source"], str(final))
    results.check(tag, "takeaway scene is no longer mounted", not final["takeaway"], str(final))
    results.check(tag, "final slide closes with the Noë quote", "Consciousness is not something" in final["quote"] and "Alva No" in final["quote"], final["quote"][:240])
    results.check(tag, "final status page has no overflow", final["overflow"] <= 2, str(final["overflow"]))
    final_qa = page.evaluate("() => ({ count: document.querySelectorAll('[data-cn-q]').length, answer: document.querySelector('[data-cn-qa-answer]')?.innerText || '' })")
    results.check(tag, "final status offers five answered questions", final_qa["count"] == 5 and len(final_qa["answer"]) > 20, str(final_qa)[:220])
    page.locator('[data-cn-q="1"]').click()
    page.wait_for_timeout(150)
    final_answer = page.evaluate("() => document.querySelector('[data-cn-qa-answer]')?.innerText || ''")
    results.check(tag, "final status question selection changes the answer", final_answer and final_answer != final_qa["answer"], final_answer[:220])
    final_fonts = page.evaluate("() => ({ q: parseFloat(getComputedStyle(document.querySelector('[data-cn-q]')).fontSize), a: parseFloat(getComputedStyle(document.querySelector('[data-cn-qa-answer]')).fontSize) })")
    results.check(tag, "final questions and answers are readable", final_fonts["q"] >= 12 and final_fonts["a"] >= 14, str(final_fonts))
    final_len = page.evaluate("() => document.body.innerText.length")
    results.check(tag, "final text does not grow beyond baseline", final_len <= budgets["final"], f"{final_len} > {budgets['final']}")
    page.locator('.ls-cn-card[data-cn="1"]').click()
    page.wait_for_timeout(200)
    switched = page.evaluate(
        r"""
() => ({
  detail: document.querySelector('.ls-cn-detail')?.innerText || '',
  selected: document.querySelector('.ls-cn-card.is-on')?.getAttribute('data-cn') || ''
})
"""
    )
    results.check(tag, "final status switches approaches", switched["selected"] == "1" and ("Phi" in switched["detail"] or "IIT" in switched["detail"]), str(switched)[:220])
    errors = logs.take()
    results.check(tag, "qualia/final status pages have no console errors", not errors, " | ".join(errors)[:400])
    probe = context.new_page()
    probe.goto(f"{base}/eoy/31.php?lang={lang}&theory=iit#/intuition/30/2", wait_until="load", timeout=40000)
    probe.wait_for_function("() => window.LearnSys && document.querySelector('[data-con2-title]')", timeout=40000)
    probe.wait_for_timeout(500)
    restored = probe.evaluate("() => document.querySelector('.ls-con2')?.getAttribute('data-theory') || ''")
    results.check(tag, "theory URL survives a reload", restored == "iit", restored)
    probe.close()
    context.close()


def test_scene_recovers_after_late_registration(browser, base, lang, results):
    tag = f"scene-recovery-{lang}"
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = context.new_page()
    page.set_default_timeout(8000)
    page.add_init_script(INIT_SCRIPT)
    page.add_init_script(
        r"""
window.__allowConsciousnessScene = false;
window.__savedConsciousnessScene = null;
setInterval(function () {
  var core = window.LearnSysDemoCore;
  if (core && core.scenes && core.scenes.consciousness && !window.__allowConsciousnessScene) {
    window.__savedConsciousnessScene = core.scenes.consciousness;
    delete core.scenes.consciousness;
  }
}, 1);
"""
    )
    page.goto(f"{base}/eoy/31.php?lang={lang}", wait_until="load", timeout=40000)
    page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=40000)
    page.wait_for_function("() => !!window.__savedConsciousnessScene", timeout=15000)
    page.evaluate("() => LearnSys.go(0, 0, 1)")
    page.wait_for_timeout(700)
    missing = page.evaluate(
        "() => ({ empty: (document.querySelector('.ls-empty') || {}).textContent || '', scene: !!document.querySelector('.ls-con2') })"
    )
    results.check(
        tag,
        "missing scene shows the demo placeholder",
        ("Demo folgt" in missing["empty"] or "Demo follows" in missing["empty"]) and not missing["scene"],
        str(missing),
    )
    page.evaluate(
        "() => { window.__allowConsciousnessScene = true; window.LearnSysDemoCore.scenes.consciousness = window.__savedConsciousnessScene; }"
    )
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(400)
    page.evaluate("() => LearnSys.go(0, 0, 1)")
    page.wait_for_timeout(700)
    recovered = page.evaluate(
        "() => ({ empty: !!document.querySelector('.ls-empty'), scene: !!document.querySelector('.ls-con2'), title: (document.getElementById('ls-title') || {}).textContent || '' })"
    )
    results.check(
        tag,
        "late scene registration replaces the placeholder",
        not recovered["empty"] and recovered["scene"],
        str(recovered),
    )
    context.close()


def test_index_sprint(browser, base, lang, results):
    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.set_default_timeout(8000)
    page.add_init_script(INIT_SCRIPT)
    logs = PageLog(page)
    page.goto(f"{base}{INDEX}?lang={lang}", wait_until="load", timeout=40000)
    page.wait_for_function("() => window.LearnSys && document.querySelector('#ls-title')", timeout=40000)
    page.wait_for_timeout(800)
    tag = f"index-{lang}"
    page.evaluate("() => { for (var i = 0; i < 120; i++) LearnSys.next(); }")
    page.wait_for_timeout(1200)
    current = state(page)
    results.check(tag, "120 rapid steps leave a title", bool(current["title"]), str(current)[:300])
    results.check(tag, "120 rapid steps keep the layout", current["overflow"] <= 2, str(current["overflow"]))
    page.evaluate("() => { for (var i = 0; i < 120; i++) LearnSys.prev(); }")
    page.wait_for_timeout(1200)
    current = state(page)
    results.check(tag, "120 rapid back-steps leave a title", bool(current["title"]), str(current)[:300])
    page.evaluate("() => LearnSys.go(0, 0, 0)")
    page.wait_for_timeout(1200)
    current = state(page)
    results.check(tag, "index returns to the media slide", current["present"] and current["search"], str(current)[:300])
    errors = logs.take()
    results.check(tag, "index sprint has no console errors", not errors, " | ".join(errors)[:500])
    context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--langs", default="de,en", help="comma-separated de,en")
    parser.add_argument("--steps", type=int, default=120, help="random fuzz actions per language")
    parser.add_argument("--cycles", type=int, default=4, help="repeated launch cycles per language")
    parser.add_argument("--deep", action="store_true", help="more fuzz steps and cycles")
    parser.add_argument("--no-index", action="store_true", help="skip the index sprint")
    args = parser.parse_args()

    if args.deep:
        args.steps = max(args.steps, 260)
        args.cycles = max(args.cycles, 8)
    langs = [part.strip() for part in args.langs.split(",") if part.strip() in ("de", "en")]
    if not langs:
        raise SystemExit("no valid language selected")

    port = free_port()
    server = serve(port)
    if not wait_server(port):
        server.terminate()
        raise SystemExit("PHP server did not start")
    results = Results()
    base = f"http://127.0.0.1:{port}"
    try:
        with sync_playwright() as playwright:
            browser = launch_browser(playwright)
            for lang in langs:
                print(f"→ eoy media interactions [{lang}]")
                context, page, logs = open_page(browser, base, lang)
                tag = f"core-{lang}"
                test_initial(page, logs, results, tag)
                test_accessibility(page, logs, results, tag)
                test_launch(page, logs, results, tag)
                test_text_blur_swap(browser, base, lang, results)
                test_nav_hint(browser, base, lang, results)
                test_blocks_sequence(browser, base, lang, results)
                test_phase_change_hovers(browser, base, lang, results)
                test_canvas_hover_coverage(browser, base, lang, results)
                test_ffn_role(browser, base, lang, results)
                test_embedding_arrows(browser, base, lang, results)
                test_unembed_pause(browser, base, lang, results)
                test_residual_layout(browser, base, lang, results)
                test_attention_layout(browser, base, lang, results)
                test_sinus_size(browser, base, lang, results)
                test_gauss_slider(browser, base, lang, results)
                test_hallucination_lab(browser, base, lang, results)
                test_risk_and_limit_visuals(browser, base, lang, results)
                test_qualia_and_final_status(browser, base, lang, results)
                test_scene_recovers_after_late_registration(browser, base, lang, results)
                test_tabs_and_code(page, logs, results, tag)
                test_phone_screen_clicks(page, logs, results, tag)
                test_hidden_media_buttons(page, logs, results, tag)
                test_keyboard_media(page, logs, results, tag)
                test_double_click(page, logs, results, tag)
                test_interrupted(page, logs, results, tag)
                test_nav_race(page, logs, results, tag)
                test_rapid_sprint(page, logs, results, tag)
                context.close()

                test_repeated(browser, base, lang, results, args.cycles)
                test_invalid_api(browser, base, lang, results)
                test_corrupted_prefs(browser, base, lang, results)
                test_reduced_motion(browser, base, lang, results)
                test_viewports(browser, base, lang, results)
                test_resize_mid_launch(browser, base, lang, results)
                test_boundaries(browser, base, lang, results)
                test_history(browser, base, lang, results)
                test_missing_wallpaper(browser, base, lang, results)
                test_delayed_wallpaper(browser, base, lang, results)
                test_offline_launch(browser, base, lang, results)
                test_cpu_throttle(browser, base, lang, results)
                test_tampered_track(browser, base, lang, results)
                test_fuzz(browser, base, lang, results, args.steps)
                if not args.no_index:
                    test_fuzz(browser, base, lang, results, max(30, args.steps // 2), path=INDEX, label="index-fuzz")
                    test_index_sprint(browser, base, lang, results)
            browser.close()
    finally:
        server.terminate()

    print(f"\n{results.checks} checks, {len(results.failures)} failure(s)")
    if results.failures:
        for failure in results.failures[:80]:
            print("FAILURE", failure)
        return 1
    print("eoy media interactions: all checks passed")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        raise
    except Exception:
        traceback.print_exc()
        sys.exit(2)
