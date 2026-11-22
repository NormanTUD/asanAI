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
    page.goto(f"{base}{path}?lang={lang}", wait_until="load", timeout=30000)
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
  var host = document.querySelector('#ls-text-body');
  var nav = document.querySelector('#ls-navbar');
  var start = performance.now();
  var minOpacity = 1;
  var maxHostBlur = 0;
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
    var opacity = parseFloat(getComputedStyle(host).opacity) || 0;
    minOpacity = Math.min(minOpacity, opacity);
    maxHostBlur = Math.max(maxHostBlur, blurOf(host));
    if (nav) {
      navMinOpacity = Math.min(navMinOpacity, parseFloat(getComputedStyle(nav).opacity) || 0);
      navMaxBlur = Math.max(navMaxBlur, blurOf(nav));
    }
    if ((opacity > 0.95 && blurOf(host) < 0.5 && performance.now() - start > 150) || performance.now() - start > 900) {
      resolve({
        ms: performance.now() - start,
        minOpacity: minOpacity,
        maxHostBlur: maxHostBlur,
        navMinOpacity: navMinOpacity,
        navMaxBlur: navMaxBlur,
        samples: samples,
        step: LearnSys.state().step,
        sub: LearnSys.state().substep,
        title: document.querySelector('#ls-title').textContent
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
    results.check(tag, "old and new text blur", result.get("maxHostBlur", 0) > 1, detail)
    results.check(tag, "text blends fully with the background", result.get("minOpacity", 1) < 0.1, detail)
    results.check(tag, "blur swap finishes within 200ms plus scheduling slack", result.get("ms", 9999) <= 900, detail)
    results.check(tag, "top navbar never disappears", result.get("navMinOpacity", 0) > 0.95, detail)
    results.check(tag, "top navbar is never blurred", result.get("navMaxBlur", 1) < 0.5, detail)
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
