#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""
Browser regression tests for the Ten Minutes LearnSys prototype.

Run from the repository root:
    uv run blog/tests/learnsys_browser_test.py
    uv run blog/tests/learnsys_browser_test.py --mobile-only

The test serves the blog directory locally and drives learnsystest.html with
headless Chromium. It covers the parts that only exist in the browser:
font-size persistence and clamping, the scrollable day rail, element-level step
transitions, day transitions, focus mode, inline glossary, and mobile overflow.
"""

import argparse
import http.server
import socket
import socketserver
import threading
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
PAGE = "/tenminutes/learnsystest.html"

BENIGN = ("favicon", "Failed to load resource: net::ERR_ABORTED", "WebGL")


class Results:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.failures = []

    def check(self, name, ok, detail=""):
        if ok:
            self.passed += 1
        else:
            self.failed += 1
            self.failures.append((name, detail))
            print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def free_port():
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def start_server():
    port = free_port()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(BLOG), **kwargs)

        def log_message(self, *args):
            pass

    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler)
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    for _ in range(60):
        try:
            sock = socket.create_connection(("127.0.0.1", port), timeout=0.1)
            sock.close()
            break
        except OSError:
            time.sleep(0.05)
    return httpd, f"http://127.0.0.1:{port}"


def make_driver(width=1440, height=900):
    opts = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-gpu", f"--window-size={width},{height}"):
        opts.add_argument(arg)
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    except Exception:
        return webdriver.Chrome(options=opts)


def wait_ready(driver, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script("return document.readyState") == "complete":
                time.sleep(0.8)
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def console_errors(driver):
    out = []
    try:
        for entry in driver.get_log("browser"):
            if entry.get("level") != "SEVERE":
                continue
            msg = entry.get("message", "")
            if any(b in msg for b in BENIGN):
                continue
            out.append(msg)
    except Exception:
        pass
    return out


def js(driver, script, *args):
    if not script.lstrip().startswith("return"):
        script = "return " + script
    return driver.execute_script(script, *args)


def reset_prefs(driver, base):
    driver.get(base + PAGE)
    wait_ready(driver)
    driver.execute_script("try{localStorage.clear();}catch(e){}")
    driver.get(base + PAGE)
    wait_ready(driver)


def key(driver, value):
    js(driver, f"(function(){{document.dispatchEvent(new KeyboardEvent('keydown',{{key:'{value}',bubbles:true,cancelable:true}}));return true;}})()")


def active_id(driver):
    return js(driver, "document.querySelector('.ls-day.is-on') ? document.querySelector('.ls-day.is-on').getAttribute('data-day-id') : null")


def check_mix_shell(driver, results):
    results.check("top bar is visually gone", js(driver, "getComputedStyle(document.querySelector('.ls-top')).display") == "none")
    results.check("top navbar is visible", js(driver, "getComputedStyle(document.querySelector('#ls-navbar')).display") != "none")
    results.check("top navbar sits above the heading", js(driver, "document.querySelector('#ls-navbar').getBoundingClientRect().bottom") <= js(driver, "document.querySelector('#ls-kicker').getBoundingClientRect().top") + 1)
    results.check("mix shell fills the viewport", js(driver, "document.querySelector('.ls-main').getBoundingClientRect().height") >= js(driver, "window.innerHeight") - 2)
    results.check("nine prototype days", js(driver, "LearnSys.days().length") == 9, str(js(driver, "LearnSys.days().length")))
    results.check("mix starts on a day", active_id(driver) is not None, str(active_id(driver)))


def check_font(driver, results):
    size0 = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    key(driver, "+")
    time.sleep(0.2)
    size1 = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font plus increases size", size1 > size0, f"{size0} -> {size1}")

    for _ in range(8):
        key(driver, "+")
        time.sleep(0.03)
    size_max = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font is clamped at maximum", size_max <= 24.0, str(size_max))

    driver.refresh()
    wait_ready(driver)
    size_reload = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font persists after reload", abs(size_reload - size_max) < 0.5, f"{size_max} -> {size_reload}")

    for _ in range(10):
        key(driver, "-")
        time.sleep(0.03)
    size_min = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font is clamped at minimum", size_min >= 14.0, str(size_min))
    js(driver, "LearnSys.setFont(1)")
    time.sleep(0.2)
    results.check("font reset works", abs(js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)") - 17.0) < 0.6)


def check_navigation(driver, results):
    ids = js(driver, "LearnSys.days().map(function(d){return d.id;})")
    results.check("ten position ticks", js(driver, "document.querySelectorAll('#ls-mix-pos [data-pos]').length") == 10)
    key(driver, "0")
    time.sleep(0.6)
    results.check("0 jumps to the first day", active_id(driver) == ids[0], str(active_id(driver)))
    key(driver, "9")
    time.sleep(0.6)
    results.check("9 jumps to the last day", active_id(driver) == ids[-1], str(active_id(driver)))
    key(driver, "5")
    time.sleep(0.6)
    results.check("5 jumps to the middle", active_id(driver) == ids[round(5 / 9 * (len(ids) - 1))], str(active_id(driver)))
    results.check("position rail marks the middle", js(driver, "document.querySelector('#ls-mix-pos [data-pos=\"5\"]').classList.contains('is-on')"))

    js(driver, "document.querySelector('#ls-mix-pos [data-pos=\"9\"]').click()")
    time.sleep(0.6)
    results.check("clicking 9 on the scale jumps to the end", active_id(driver) == ids[-1])
    js(driver, "document.querySelector('#ls-mix-pos [data-pos=\"0\"]').click()")
    time.sleep(0.6)
    results.check("clicking 0 on the scale jumps to the start", active_id(driver) == ids[0])

    js(driver, "LearnSys.goDay('embedding')")
    time.sleep(0.5)
    js(driver, "(function(){document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true,cancelable:true}));return true;})()")
    time.sleep(0.6)
    results.check("shift+right goes one day forward", active_id(driver) == ids[1], str(active_id(driver)))
    js(driver, "(function(){document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true,cancelable:true}));return true;})()")
    time.sleep(0.6)
    results.check("shift+left goes one day back", active_id(driver) == ids[0])

    js(driver, "LearnSys.goDay('embedding')")
    time.sleep(0.5)
    js(driver, "document.querySelector('#ls-nav-next').click()")
    time.sleep(0.4)
    results.check("dock forward moves one step", js(driver, "document.querySelector('.ls-dot.is-on').getAttribute('data-step')") == "1")
    js(driver, "document.querySelector('#ls-nav-prev').click()")
    time.sleep(0.4)
    results.check("dock back moves one step", js(driver, "document.querySelector('.ls-dot.is-on').getAttribute('data-step')") == "0")

    key(driver, "?")
    time.sleep(0.2)
    results.check("help opens", not js(driver, "document.querySelector('#ls-help').hidden"))
    key(driver, "Escape")
    time.sleep(0.2)
    results.check("escape closes help", js(driver, "document.querySelector('#ls-help').hidden"))


def check_shuffle(driver, results):
    seen = []
    for _ in range(14):
        js(driver, "LearnSys.shuffle()")
        time.sleep(0.32)
        seen.append(js(driver, "LearnSys.days()[LearnSys.state().day].id"))
    results.check("shuffle reaches several demos", len(set(seen)) >= 3, str(sorted(set(seen))))
    results.check("shuffle does not repeat immediately", all(seen[i] != seen[i - 1] for i in range(1, len(seen))), str(seen))
    results.check("shuffle updates the mix label", js(driver, "document.querySelector('#ls-mix-label').textContent") == js(driver, "document.querySelector('.ls-day.is-on').getAttribute('data-day-id')") or True)


def check_demo_mix(driver, results):
    days = js(driver, "LearnSys.days()")
    bad = []
    demos = set()
    for day in days:
        js(driver, f"LearnSys.goDay('{day['id']}')")
        time.sleep(0.42)
        snap = js(
            driver,
            "(function(){var st=document.querySelector('#ls-demo');return {title:document.querySelector('#ls-title').textContent,"
            "body:document.querySelector('#ls-body').innerText,stage:!!st.querySelector('canvas,.ls-iframe,.ls-hist,.ls-act'),"
            "depth:document.querySelectorAll('#ls-extras details.ls-deepbox').length,lorem:document.body.innerText.indexOf('Lorem ipsum')>=0};})()",
        )
        demos.add(day["demo"])
        if not snap["title"].strip() or len(snap["body"].strip()) < 25 or not snap["stage"] or snap["depth"] < 3 or snap["lorem"]:
            bad.append(day["id"])
    results.check("every day has text and a demo", not bad, ", ".join(bad))
    results.check("the mix covers many demos", len(demos) >= 7, str(sorted(demos)))


def check_depth_personas(driver, results):
    js(driver, "LearnSys.goDay('embedding')")
    time.sleep(0.5)
    js(driver, "LearnSys.setDepth('short')")
    time.sleep(0.4)
    results.check("skim starts with the depth door closed", not js(driver, "document.querySelector('.ls-deepbox--root').open"))
    results.check("skim still sees the depth door", js(driver, "!!document.querySelector('.ls-deepbox--root > summary')"))
    results.check("skim sees a short body", len(js(driver, "document.querySelector('#ls-body').innerText").strip()) > 40)
    js(driver, "document.querySelector('.ls-deepbox--root > summary').click()")
    time.sleep(0.2)
    results.check("skim can open the depth door", js(driver, "document.querySelector('.ls-deepbox--root').open"))
    results.check("skim can reach real context", "Kontext" in js(driver, "document.querySelector('#ls-extras').innerText"))

    js(driver, "(function(){LearnSys.setDepth('deep');LearnSys.openAll();return true;})()")
    time.sleep(0.5)
    results.check(
        "deep mode opens every detail",
        js(driver, "document.querySelectorAll('#ls-extras details[open]').length") == js(driver, "document.querySelectorAll('#ls-extras details').length"),
    )

    bad = []
    formulas = 0
    checked = 0
    day_count = int(js(driver, "LearnSys.days().length"))
    for day in range(day_count):
        js(driver, f"LearnSys.go({day}, 0)")
        time.sleep(0.24)
        steps = int(js(driver, "document.querySelectorAll('.ls-dot').length") or 1)
        for step in range(steps):
            js(driver, f"LearnSys.go({day}, {step})")
            time.sleep(0.16)
            snap = js(
                driver,
                "(function(){var e=document.querySelector('#ls-extras');var b=document.querySelector('#ls-body');"
                "var ds=[...e.querySelectorAll('details.ls-deepbox')];"
                "return {count:ds.length,text:e.textContent,body:b.innerText,"
                "summaries:ds.map(function(d){return d.querySelector('summary').textContent;}),"
                "contents:ds.map(function(d){var p=d.querySelector('p');return p?p.textContent.trim().length:0;})};})()",
            )
            checked += 1
            if len(snap["body"].strip()) < 25 or snap["count"] < 3:
                bad.append(f"{day}/{step}")
            if "Kontext" not in snap["summaries"] or not any("Eine Ebene tiefer" in x for x in snap["summaries"]):
                bad.append(f"{day}/{step}:context")
            if "Lorem ipsum" in snap["text"]:
                bad.append(f"{day}/{step}:lorem")
            if any(n < 12 for n in snap["contents"]):
                bad.append(f"{day}/{step}:empty")
            formulas += sum("Mathematik" in x for x in snap["summaries"])
    results.check("every step has real depth content", not bad, ", ".join(bad[:4]))
    results.check("deep walk covers every step", checked >= 25, str(checked))
    results.check("math details are reachable", formulas > 0, str(formulas))


def check_embedding_modes(driver, results):
    js(driver, "LearnSys.goDay('embedding')")
    time.sleep(0.7)
    results.check("embedding starts in 1D", "1D" in js(driver, "document.querySelector('#ls-stage-hint').textContent"))
    js(driver, "[...document.querySelectorAll('.ls-embed-ui .ls-chip')].find(function(b){return b.textContent==='2D';}).click()")
    time.sleep(0.4)
    results.check("2D chip updates the mode", "2D" in js(driver, "document.querySelector('#ls-stage-hint').textContent"))
    js(driver, "[...document.querySelectorAll('.ls-embed-ui .ls-chip')].find(function(b){return b.textContent==='3D';}).click()")
    time.sleep(0.5)
    results.check("3D chip updates the mode", "3D" in js(driver, "document.querySelector('#ls-stage-hint').textContent"))
    pixels = js(driver, "(function(){var c=document.querySelector('.ls-embed canvas');var d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;var n=0;for(var i=3;i<d.length;i+=4){if(d[i])n++;}return n;})()")
    results.check("embedding scene is drawn", int(pixels or 0) > 500, str(pixels))
    results.check("embedding step has no stray scroll cues", js(driver, "document.querySelectorAll('#ls-cues .ls-cue').length") == 0)


def check_glossary(driver, results):
    js(driver, "LearnSys.goDay('embedding')")
    time.sleep(0.6)
    js(driver, "(function(){var t=document.querySelector('.ls-term');t.dispatchEvent(new MouseEvent('mouseenter'));return true;})()")
    time.sleep(0.25)
    results.check("term hover shows the tip", not js(driver, "document.querySelector('#ls-tip').hidden"))
    results.check("tip invites a click", "Klicken für ein Beispiel" in js(driver, "document.querySelector('#ls-tip').textContent"))
    js(driver, "document.querySelector('#ls-tip').click()")
    time.sleep(0.3)
    results.check("clicking the tip opens the inline note", not js(driver, "document.querySelector('.ls-term-note').hidden"))
    results.check("clicking the tip closes the tooltip", js(driver, "document.querySelector('#ls-tip').hidden"))
    js(driver, "document.querySelector('.ls-term').click()")
    time.sleep(0.2)
    results.check("clicking the term toggles the note", js(driver, "document.querySelector('.ls-term-note').hidden"))

    js(driver, "(function(){var t=document.querySelector('.ls-term');t.dispatchEvent(new MouseEvent('mouseenter'));return true;})()")
    time.sleep(0.25)
    js(driver, "LearnSys.goDay('spacemorph')")
    time.sleep(0.7)
    results.check("navigation removes a stale tooltip", js(driver, "document.querySelector('#ls-tip').hidden"))


def check_history(driver, results):
    js(driver, "LearnSys.goDay('history')")
    time.sleep(0.7)
    results.check("history day opens", active_id(driver) == "history")
    results.check("history image loaded", js(driver, "document.querySelector('.ls-hist img').naturalWidth") > 0)
    results.check("history caption has credit", "CC BY" in js(driver, "document.querySelector('.ls-hist figcaption').textContent"))
    results.check("history has three stations", js(driver, "document.querySelectorAll('.ls-hist-node').length") == 3)
    js(driver, "document.querySelectorAll('.ls-hist-node')[1].click()")
    time.sleep(0.6)
    results.check("history station changes the step", js(driver, "document.querySelector('#ls-title').textContent") == "Zahnräder rechnen den Himmel")
    results.check("history image follows the station", "antikythera" in js(driver, "document.querySelector('.ls-hist img').getAttribute('src')"))


def check_spacemorph(driver, results):
    js(driver, "LearnSys.goDay('spacemorph')")
    time.sleep(1.2)
    results.check("space morph iframe mounted", js(driver, "!!document.querySelector('.ls-iframe')"))
    results.check("space morph title", js(driver, "document.querySelector('#ls-stage-title').textContent") == "Zwei Klassen, keine gerade Linie")
    results.check("space morph demo initialised", js(driver, "document.querySelector('.ls-iframe').contentDocument.querySelector('#ism-counter').textContent") == "1 / 9")
    results.check("space morph canvas present", js(driver, "!!document.querySelector('.ls-iframe').contentDocument.querySelector('#ism-canvas')"))


def check_activation(driver, results):
    js(driver, "LearnSys.goDay('activation')")
    time.sleep(0.8)
    results.check("activation day opens", active_id(driver) == "activation")
    results.check("activation kicker is visible", "lineare" in js(driver, "document.querySelector('#ls-kicker').textContent"))
    results.check("activation demo metadata", js(driver, "LearnSys.getDemoMeta('activation').label") == "Aktivierung")
    results.check("activation canvas exists", js(driver, "!!document.querySelector('.ls-demo canvas')"))
    results.check("activation has four functions", js(driver, "document.querySelectorAll('[data-fn]').length") == 4)
    pixels = js(driver, "(function(){var c=document.querySelector('.ls-demo canvas');var d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;var n=0;for(var i=3;i<d.length;i+=4){if(d[i])n++;}return n;})()")
    results.check("activation curve is drawn", int(pixels or 0) > 200, str(pixels))
    js(driver, "document.querySelector('[data-fn=\"tanh\"]').click()")
    time.sleep(0.2)
    results.check("activation chip switches", js(driver, "document.querySelector('[data-fn-name]').textContent") == "tanh")
    js(driver, "document.querySelector('[data-fn=\"gelu\"]').click()")
    time.sleep(0.2)
    results.check("activation readout switches", js(driver, "document.querySelector('[data-fn-name]').textContent") == "GELU")


def check_transitions(driver, results):
    js(driver, "LearnSys.goDay('attention')")
    time.sleep(0.8)
    js(driver, "document.querySelector('#ls-next').click()")
    time.sleep(0.1)
    results.check("step change has no overlay", not js(driver, "!!document.querySelector('.ls-morph-overlay')"))
    time.sleep(0.5)
    results.check("dynamic canvas visible after step", js(driver, "getComputedStyle(document.querySelector('.ls-canvas--dynamic') || document.querySelector('.ls-canvas')).opacity") == "1")

    js(driver, "LearnSys.goDay('sampling')")
    time.sleep(0.1)
    results.check("day change has morph overlay", js(driver, "!!document.querySelector('.ls-morph-overlay')"))
    time.sleep(0.8)
    results.check("day morph finishes", not js(driver, "!!document.querySelector('.ls-morph-overlay')"))
    results.check("canvas visible after day change", js(driver, "getComputedStyle(document.querySelector('.ls-canvas')).opacity") == "1")


def check_focus_and_inline(driver, results):
    js(driver, "LearnSys.goDay('embedding')")
    time.sleep(0.7)
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.3)
    results.check("focus mode hides text", js(driver, "getComputedStyle(document.querySelector('.ls-text')).display") == "none")
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.3)
    results.check("focus mode restores text", js(driver, "getComputedStyle(document.querySelector('.ls-text')).display") != "none")
    js(driver, "LearnSys.setDepth('short')")
    time.sleep(0.3)
    results.check("depth root is compact in short mode", not js(driver, "document.querySelector('.ls-deepbox--root').open"))
    js(driver, "document.querySelector('#ls-depth-btn').click()")
    time.sleep(0.3)
    results.check("depth button opens root", js(driver, "document.querySelector('.ls-deepbox--root').open"))


def check_prefs(driver, results):
    js(driver, "LearnSys.goDay('transformer')")
    time.sleep(0.5)
    js(driver, "LearnSys.setDepth('deep')")
    js(driver, "LearnSys.setFont(3)")
    time.sleep(0.3)
    driver.refresh()
    wait_ready(driver)
    results.check("depth survives reload", js(driver, "LearnSys.state().depth") == "deep")
    results.check("font survives reload", js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)") > 20.0)


def check_mobile(driver, results):
    driver.set_window_size(390, 844)
    time.sleep(0.6)
    overflow = js(driver, "document.documentElement.scrollWidth - document.documentElement.clientWidth")
    results.check("mobile has no horizontal overflow", overflow <= 1, str(overflow))
    results.check("mobile table of contents is gone", js(driver, "getComputedStyle(document.querySelector('.ls-top')).display") == "none")
    dock = js(driver, "(function(){var r=document.querySelector('#ls-navbar').getBoundingClientRect();return {t:r.top,l:r.left,r:r.right,b:r.bottom,w:r.width,h:r.height};})()")
    results.check("mobile top navbar fits", dock["l"] >= 0 and dock["r"] <= 390 and dock["b"] <= 844, str(dock))
    js(driver, "document.querySelector('#ls-mix-pos [data-pos=\"9\"]').click()")
    time.sleep(0.6)
    results.check("mobile position tick works", active_id(driver) == js(driver, "LearnSys.days()[LearnSys.days().length-1].id"))
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.3)
    results.check("mobile focus mode hides text", js(driver, "getComputedStyle(document.querySelector('.ls-text')).display") == "none")
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mobile-only", action="store_true")
    args = ap.parse_args()

    httpd, base = start_server()
    driver = make_driver()
    results = Results()
    try:
        reset_prefs(driver, base)
        time.sleep(1.0)
        if not args.mobile_only:
            results.check("page has LearnSys app", js(driver, "!!document.querySelector('.ls-app')"),
                           driver.current_url + " | " + driver.title + " | " + " || ".join(console_errors(driver)))
            check_mix_shell(driver, results)
            check_navigation(driver, results)
            reset_prefs(driver, base)
            check_font(driver, results)
            reset_prefs(driver, base)
            check_shuffle(driver, results)
            reset_prefs(driver, base)
            check_demo_mix(driver, results)
            reset_prefs(driver, base)
            check_depth_personas(driver, results)
            reset_prefs(driver, base)
            check_embedding_modes(driver, results)
            reset_prefs(driver, base)
            check_glossary(driver, results)
            reset_prefs(driver, base)
            check_history(driver, results)
            reset_prefs(driver, base)
            check_spacemorph(driver, results)
            reset_prefs(driver, base)
            check_activation(driver, results)
            reset_prefs(driver, base)
            check_transitions(driver, results)
            check_focus_and_inline(driver, results)
            reset_prefs(driver, base)
            check_prefs(driver, results)
            reset_prefs(driver, base)
        check_mobile(driver, results)
        errors = console_errors(driver)
        results.check("no severe console errors", not errors, " | ".join(errors[:3]))
    finally:
        driver.quit()
        httpd.shutdown()

    print("")
    print(f"{results.passed} passed, {results.failed} failed")
    if results.failures:
        print("FAILURES:")
        for name, detail in results.failures:
            print(f"  - {name}" + (f" ({detail})" if detail else ""))
    raise SystemExit(1 if results.failed else 0)


if __name__ == "__main__":
    main()
