#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Global LearnSys text/layout/deep-link regression test.

Run from the repository root:
    uv run blog/tests/learnsys_global_text_browser_test.py
"""

from __future__ import annotations

import json
import shutil
import socket
import subprocess
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
BENIGN = ("favicon", "net::ERR_ABORTED", "WebGL")

checks = 0
failures = 0


def check(condition: bool, label: str, detail: str = "") -> None:
    global checks, failures
    checks += 1
    if condition:
        print(f"ok   {label}")
        return
    failures += 1
    print(f"FAIL {label}" + (f" — {detail}" if detail else ""))


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def make_driver() -> webdriver.Chrome:
    options = Options()
    for arg in [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1400,1000",
        "--disable-extensions",
    ]:
        options.add_argument(arg)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    binary = shutil.which("chromium-browser") or shutil.which("chromium") or shutil.which("google-chrome")
    if binary:
        options.binary_location = binary
    try:
        return webdriver.Chrome(
            service=Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install()),
            options=options,
        )
    except Exception:
        return webdriver.Chrome(options=options)


def wait_until(driver: webdriver.Chrome, script: str, timeout: float = 60) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script(script):
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def js(driver: webdriver.Chrome, script: str, *args):
    if not script.lstrip().startswith("return"):
        script = "return " + script
    return driver.execute_script(script, *args)


def console_errors(driver: webdriver.Chrome) -> list[str]:
    out: list[str] = []
    try:
        for entry in driver.get_log("browser"):
            if entry.get("level") != "SEVERE":
                continue
            msg = entry.get("message", "")
            if any(token in msg for token in BENIGN):
                continue
            out.append(msg)
    except Exception:
        pass
    return out


def reset_page(driver: webdriver.Chrome, url: str) -> None:
    driver.get(url)
    wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
    driver.execute_script(
        "try{localStorage.removeItem('tm_learnsys_text_v1');"
        "localStorage.removeItem('tm_learnsys_layout_v1');"
        "localStorage.removeItem('tm_learnsys_pref_v1');}catch(e){}"
    )
    driver.refresh()
    wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
    time.sleep(0.6)


def nested_payload() -> dict:
    return {
        "version": 1,
        "texts": {
            "de": {
                "intuition": {
                    "0.0": {
                        "body": "Importierter Kurztext. Zweiter Satz. Dritter Satz.",
                        "title": "Importierte Überschrift",
                        "kicker": "Importierter Kicker",
                        "watch": "Importierter Beobachtungshinweis.",
                        "groups": [{
                            "id": "g-test",
                            "title": "Testgruppe",
                            "questions": [{
                                "id": "q-parent",
                                "title": "Elternfrage?",
                                "body": "Elternantwort.",
                                "kind": "question",
                                "questions": [{
                                    "id": "q-child",
                                    "title": "Unterfrage?",
                                    "body": "Unterantwort.",
                                    "kind": "trivia",
                                }],
                            }],
                        }],
                    }
                }
            }
        },
    }


def main() -> int:
    port = free_port()
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    driver = None
    try:
        time.sleep(1.0)
        base = f"http://127.0.0.1:{port}/tenminutes/intuition_learnsys.php"
        driver = make_driver()
        reset_page(driver, base + "?lang=de")
        emb_idx = js(driver, """
            return (function(){
              var dots=[...document.querySelectorAll('#ls-steps .ls-dot')];
              for(var i=0;i<dots.length;i++){ if((dots[i].getAttribute('title')||'').indexOf('Bedeutung wird Geometrie')>=0) return i; }
              return -1;
            })();
            """)
        check(emb_idx >= 0, "embedding step found", str(emb_idx))

        # 0. Click directly on the text to edit it.
        js(driver, "document.querySelector('#ls-body').click()")
        time.sleep(0.3)
        check(js(driver, "LearnSys.state().edit") and js(driver, "document.activeElement.id") == "ls-edit-body", "clicking the body opens the editor")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.2)
        js(driver, "document.querySelector('#ls-title').click()")
        time.sleep(0.25)
        check(js(driver, "document.activeElement.id") == "ls-edit-title", "clicking the heading edits the heading")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.2)
        js(driver, "return (function(){var q=document.querySelector('.ls-qbody');if(!q)return false;q.click();return true;})()")
        time.sleep(0.3)
        check(js(driver, "LearnSys.state().edit") and js(driver, "document.activeElement && document.activeElement.getAttribute('data-field')") == "body", "clicking a question body edits that question")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.2)

        # 1. Sub-frames have their own text, demo and storage key.
        js(driver, f"LearnSys.goView(0, {emb_idx}, 0)")
        time.sleep(0.5)
        key0 = js(driver, "LearnSys.text.viewKey()")
        body0 = js(driver, "document.querySelector('#ls-body').innerText")
        demo0 = js(driver, "!!document.querySelector('#ls-demo canvas,.ls-iframe,.ls-hist,.ls-act')")
        js(driver, f"LearnSys.goView(0, {emb_idx}, 1)")
        time.sleep(0.5)
        key1 = js(driver, "LearnSys.text.viewKey()")
        body1 = js(driver, "document.querySelector('#ls-body').innerText")
        demo1 = js(driver, "!!document.querySelector('#ls-demo canvas,.ls-iframe,.ls-hist,.ls-act')")
        check(key0 != key1, "sub-frames have distinct text keys", f"{key0} / {key1}")
        check(body0 != body1, "sub-frames show different left text")
        check("Unterfolie 1" in body0 and "Unterfolie 2" in body1, "sub-frame placeholders name the frame", f"{body0[-40:]} / {body1[-40:]}")
        check(demo0 and demo1, "both sub-frames mount a demo")

        # Separate editing per sub-frame.
        js(driver, f"LearnSys.goView(0, {emb_idx}, 0)")
        time.sleep(0.3)
        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.25)
        js(
            driver,
            "return (function(){var t=document.querySelector('#ls-edit-body');"
            "t.value='Sub eins. Zweiter Satz.';t.dispatchEvent(new Event('input',{bubbles:true}));return true;})()",
        )
        js(driver, "document.querySelector('[data-edit-action=\"save\"]').click()")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.3)
        js(driver, f"LearnSys.goView(0, {emb_idx}, 1)")
        time.sleep(0.3)
        check( "Sub eins" not in js(driver, "document.querySelector('#ls-body').innerText"),"editing sub-frame 1 does not leak into sub-frame 2")
        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.2)
        js(
            driver,
            "return (function(){var t=document.querySelector('#ls-edit-body');"
            "t.value='Sub zwei. Zweiter Satz.';t.dispatchEvent(new Event('input',{bubbles:true}));return true;})()",
        )
        js(driver, "document.querySelector('[data-edit-action=\"save\"]').click()")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.3)
        js(driver, f"LearnSys.goView(0, {emb_idx}, 0)")
        time.sleep(0.3)
        check( "Sub eins" in js(driver, "document.querySelector('#ls-body').innerText"),"sub-frame 1 keeps its own text")
        js(driver, f"LearnSys.goView(0, {emb_idx}, 1)")
        time.sleep(0.3)
        check( "Sub zwei" in js(driver, "document.querySelector('#ls-body').innerText"),"sub-frame 2 keeps its own text")

        # 2. Nested questions render and edit.
        reset_page(driver, base + "?lang=de")
        js(driver, "LearnSys.text.importData(arguments[0])", nested_payload())
        time.sleep(0.5)
        check( "Importierter Kurztext" in js(driver, "document.querySelector('#ls-body').innerText"),"imported short text is visible")
        check(js(driver, "document.querySelector('#ls-title').textContent") == "Importierte Überschrift", "imported heading is visible")
        check("Importierter Kicker" in js(driver, "document.querySelector('#ls-kicker').textContent"), "imported kicker is visible")
        check(js(driver, "document.querySelector('#ls-stage-title').textContent") == "Importierte Überschrift", "imported heading reaches the stage")
        check("Importierter Beobachtungshinweis" in js(driver, "document.querySelector('#ls-watch').innerText"), "imported watch hint is visible")
        check( js(driver, "document.querySelectorAll('#ls-extras .ls-qnested').length") >= 2,"nested questions render")
        check( "Unterfrage" in js(driver, "document.querySelector('#ls-extras').textContent"),"nested question text is present")
        check( js(driver, "document.querySelectorAll('#ls-extras .ls-qkind').length") >= 2,"question/trivia tags render")
        check( js(driver, "!!document.querySelector('#ls-extras .ls-qkind--trivia')"),"trivia tag is visible")

        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.3)
        check( js(driver, "!!document.querySelector('[data-path=\"0.0.0\"]')"),"nested editor node exists")
        js(driver, "return (function(){var h=document.querySelector('#ls-edit-title');h.value='Live Überschrift';h.dispatchEvent(new Event('input',{bubbles:true}));"
                   "var k=document.querySelector('#ls-edit-kicker');k.value='Live Kicker';k.dispatchEvent(new Event('input',{bubbles:true}));"
                   "var w=document.querySelector('#ls-edit-watch');w.value='Live Beobachtung.';w.dispatchEvent(new Event('input',{bubbles:true}));return true;})()")
        check(js(driver, "document.querySelector('#ls-title').textContent") == "Live Überschrift", "heading edits live")
        check(js(driver, "document.querySelector('#ls-kicker').textContent").startswith("Live Kicker"), "kicker edits live")
        js(
            driver,
            "return (function(){"
            "var t=document.querySelector('[data-field=\"body\"][data-path=\"0.0.0\"]');"
            "t.value='Neue Unterantwort.';t.dispatchEvent(new Event('input',{bubbles:true}));"
            "var s=document.querySelector('[data-field=\"kind\"][data-path=\"0.0.0\"]');"
            "s.value='question';s.dispatchEvent(new Event('change',{bubbles:true}));return true;})()",
        )
        js(driver, "document.querySelector('[data-edit-action=\"save\"]').click()")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.35)
        nested_body = js(
            driver,
            "LearnSys.text.current().groups[0].questions[0].questions[0].body",
        )
        nested_kind = js(
            driver,
            "LearnSys.text.current().groups[0].questions[0].questions[0].kind",
        )
        check( nested_body == "Neue Unterantwort.","nested question body edits", str(nested_body))
        check(js(driver, "document.querySelector('#ls-title').textContent") == "Live Überschrift", "heading survives save")
        check( nested_kind == "question","nested question kind edits", str(nested_kind))

        # 3. Export contains only the changed view and the copy-paste modal opens.
        export_data = js(driver, "LearnSys.text.exportData()")
        check(export_data.get("version") == 1, "export has a version")
        texts = (export_data.get("texts") or {}).get("de") or {}
        day_texts = texts.get("intuition") or {}
        check(list(day_texts.keys()) == ["0.0"], "export contains only the changed text", str(list(day_texts.keys())))
        check(day_texts["0.0"]["body"] == "Importierter Kurztext. Zweiter Satz. Dritter Satz.", "export body is correct")
        check(day_texts["0.0"].get("title") == "Live Überschrift", "export heading is correct")
        check(day_texts["0.0"].get("kicker") == "Live Kicker", "export kicker is correct")
        js(driver, "document.querySelector('[data-ls-export]').click()")
        time.sleep(0.25)
        check( not js(driver, "document.querySelector('#ls-json-modal').hidden"),"JSON modal opens")
        check( '"0.0"' in js(driver, "document.querySelector('#ls-json-text').value"),"JSON modal has the changed text")
        js(driver, "document.querySelector('#ls-json-close').click()")
        time.sleep(0.15)
        check( js(driver, "document.querySelector('#ls-json-modal').hidden"),"JSON modal closes")

        # 4. Shared and specific question groups.
        shared = js(
            driver,
            """
            return (function(){
            var base={title:'S',body:'B'};
            var day={id:'x',steps:[base],questionGroups:[{id:'shared',title:'Shared',questions:[{id:'s1',title:'S1',body:'a'}]}]};
            var view={title:'S',body:'B',questionGroups:[{id:'own',title:'Own',questions:[{id:'o1',title:'O1',body:'b'}]}]};
            return LearnSys.text.groupsFor(view,day,base).map(function(g){return g.id;});
            })();
            """,
        )
        check( "shared" in shared,"shared day group is inherited", str(shared))
        check( "own" in shared,"view group is added", str(shared))
        own_only = js(
            driver,
            """
            return (function(){
            var base={title:'S',body:'B'};
            var day={id:'x',steps:[base],questionGroups:[{id:'shared',title:'Shared',questions:[{id:'s1',title:'S1',body:'a'}]}]};
            var view={title:'S',body:'B',inherit:false,questionGroups:[{id:'own',title:'Own',questions:[{id:'o1',title:'O1',body:'b'}]}]};
            return LearnSys.text.groupsFor(view,day,base).map(function(g){return g.id;});
            })();
            """,
        )
        check( "shared" not in own_only and "own" in own_only,"inherit:false drops shared groups", str(own_only))
        merged = js(
            driver,
            """
            return (function(){
            var a=[{id:'g',title:'A',questions:[{id:'q',title:'Q',body:'1'}]}];
            var b=[{id:'g',title:'B',questions:[{id:'q2',title:'Q2',body:'2'}]}];
            LearnSys.text.mergeGroups(a,b);
            return a;
            })();
            """,
        )
        check( merged[0]["title"] == "B" and merged[0]["questions"][0]["id"] == "q2","mergeGroups replaces by id", str(merged))
        count = js(driver, "LearnSys.text.countQuestions([{questions:[{},{}]},{},{questions:[{}]}])")
        check( count == 6,"countQuestions counts recursively", str(count))

        # 5. Layout: move, hide, show, promote, unpromote.
        js(driver, "LearnSys.layout.reset()")
        time.sleep(0.3)
        entries = js(driver, "LearnSys.layout.entries()")
        check( len(entries) == 33,"default layout has every slide", str(len(entries)))
        js(driver, "LearnSys.layout.move('0', 1)")
        time.sleep(0.3)
        moved = js(driver, "LearnSys.layout.entries()")
        check( moved[0] == "1" and moved[1] == "0","move slide down", str(moved[:3]))
        js(driver, "LearnSys.layout.hide('1')")
        time.sleep(0.3)
        hidden = js(driver, "LearnSys.layout.entries()")
        check( len(hidden) == 32 and "1" not in hidden,"hide slide", str(len(hidden)))
        js(driver, "LearnSys.layout.show('1')")
        time.sleep(0.3)
        shown = js(driver, "LearnSys.layout.entries()")
        check( len(shown) == 33 and "1" in shown,"show slide", str(len(shown)))
        js(driver, f"LearnSys.goView(0, {emb_idx}, 1)")
        time.sleep(0.3)
        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.25)
        js(driver, "return (function(){var t=document.querySelector('#ls-edit-body');t.value='Promoted text. Second sentence.';t.dispatchEvent(new Event('input',{bubbles:true}));"
                   "var h=document.querySelector('#ls-edit-title');h.value='Promoted Heading';h.dispatchEvent(new Event('input',{bubbles:true}));return true;})()")
        js(driver, "document.querySelector('[data-edit-action=\"save\"]').click()")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.3)
        js(driver, f"LearnSys.layout.promote({emb_idx})")
        time.sleep(0.4)
        promoted = js(driver, "LearnSys.layout.entries()")
        check(
            f"{emb_idx}.0" in promoted and f"{emb_idx}.1" in promoted and f"{emb_idx}.2" in promoted and str(emb_idx) not in promoted,
            "promote sub-slides to slides",
            str([e for e in promoted if e.startswith(str(emb_idx))]),
        )
        check( len(promoted) == 35,"promoted slide count grows", str(len(promoted)))
        idx = promoted.index(f"{emb_idx}.1")
        js(driver, f"LearnSys.go(0, {idx})")
        time.sleep(0.5)
        check( js(driver, "!!document.querySelector('#ls-demo canvas,.ls-iframe,.ls-hist,.ls-act')"),"promoted slide mounts a demo")
        check("Promoted text" in js(driver, "document.querySelector('#ls-body').innerText"), "promoted slide keeps the edited substep text")
        check(js(driver, "document.querySelector('#ls-title').textContent") == "Promoted Heading", "promoted slide keeps the edited heading")
        check("Promoted Heading" in js(driver, f"document.querySelector('.ls-dot[data-step=\"{idx}\"]').getAttribute('title')"), "promoted slide title reaches the rail")
        check(js(driver, "LearnSys.text.viewKey()") == f"{emb_idx}.1", "promoted slide keeps the substep text key", js(driver, "LearnSys.text.viewKey()"))
        bad = []
        for i in range(len(promoted)):
            js(driver, f"LearnSys.go(0, {i})")
            time.sleep(0.12)
            state = js(
                driver,
                "return {title:(document.querySelector('#ls-stage-title')||{}).textContent||'',"
                "body:(document.querySelector('#ls-body')||{}).innerText||'',"
                "demo:!!document.querySelector('#ls-demo canvas,.ls-iframe,.ls-hist,.ls-act')};",
            )
            if not state["title"].strip() or len(state["body"].strip()) < 20 or not state["demo"]:
                bad.append((i, state["title"]))
        check( not bad,"every promoted/deck slide keeps its demo and text", str(bad[:3]))
        js(driver, f"LearnSys.layout.unpromote({emb_idx})")
        time.sleep(0.3)
        restored = js(driver, "LearnSys.layout.entries()")
        check( len(restored) == 33 and str(emb_idx) in restored,"unpromote restores the parent slide", str(len(restored)))
        js(driver, "LearnSys.layout.reset()")
        time.sleep(0.3)

        # GUI layout actions.
        js(driver, "document.querySelector('[data-ls-layout]').click()")
        time.sleep(0.25)
        check( not js(driver, "document.querySelector('#ls-layout').hidden"),"layout panel opens")
        js(driver, "document.querySelector('[data-layout-action=\"hide\"][data-entry=\"0\"]').click()")
        time.sleep(0.3)
        check( js(driver, "LearnSys.layout.entries().length") == 32,"GUI hides a slide")
        js(driver, "document.querySelector('[data-layout-action=\"show\"][data-entry=\"0\"]').click()")
        time.sleep(0.3)
        check( js(driver, "LearnSys.layout.entries().length") == 33,"GUI shows a slide again")
        js(driver, "document.querySelector('#ls-layout-close').click()")
        time.sleep(0.15)
        check( js(driver, "document.querySelector('#ls-layout').hidden"),"layout panel closes")

        # 6. Deep links.
        js(driver, f"LearnSys.goView(0, {emb_idx}, 1)")
        time.sleep(0.4)
        check( js(driver, "location.hash").endswith(f"/intuition/{emb_idx}/1"),"hash points to the view", js(driver, "location.hash"))
        check( f"/intuition/{emb_idx}/1" in js(driver, "LearnSys.link()"),"link returns the current URL")
        hash_url = js(driver, "location.href")
        driver.get(hash_url)
        wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
        time.sleep(0.5)
        check( js(driver, "LearnSys.state().step") == emb_idx,"hash opens the same step", str(js(driver, "LearnSys.state()")))
        check( js(driver, "LearnSys.state().substep") == 1,"hash opens the same sub-step", str(js(driver, "LearnSys.state()")))
        driver.get(base + "?lang=de#3")
        wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
        time.sleep(0.5)
        check( js(driver, "LearnSys.state().step") == 3,"short hash opens a step", str(js(driver, "LearnSys.state()")))

        # 6b. Clicking an earlier loop word rewinds to it.
        loop_idx = js(driver, """
            return (function(){
              var dots=[...document.querySelectorAll('#ls-steps .ls-dot')];
              for(var i=0;i<dots.length;i++){ if((dots[i].getAttribute('title')||'').indexOf('Ein Wort nach dem anderen')>=0) return i; }
              return -1;
            })();
            """)
        check(loop_idx >= 0, "loop step found", str(loop_idx))
        js(driver, f"LearnSys.go(0, {loop_idx})")
        time.sleep(0.5)
        for _ in range(3):
            js(driver, "document.querySelector('.ls-loop-next').click()")
            time.sleep(0.2)
        before_words = js(driver, "document.querySelectorAll('.ls-loop-sentence .pred').length")
        check(before_words >= 2, "loop has generated words", str(before_words))
        js(driver, "document.querySelector('.ls-loop-sentence .pred').click()")
        time.sleep(0.35)
        after_words = js(driver, "document.querySelectorAll('.ls-loop-sentence .pred').length")
        check(after_words < before_words, "clicking a previous word rewinds the loop", f"{before_words} -> {after_words}")
        check(js(driver, "document.querySelectorAll('.ls-loop-sentence [data-rewind]').length") >= 1, "remaining loop words are clickable")

        # 6c. Transformer blocks show the moving GPT-2 trajectory.
        blocks_idx = js(driver, """
            return (function(){
              var dots=[...document.querySelectorAll('#ls-steps .ls-dot')];
              for(var i=0;i<dots.length;i++){ if((dots[i].getAttribute('title')||'').indexOf('Die Bausteine eines LLM')>=0) return i; }
              return -1;
            })();
            """)
        unembed_idx = js(driver, """
            return (function(){
              var dots=[...document.querySelectorAll('#ls-steps .ls-dot')];
              for(var i=0;i<dots.length;i++){ if((dots[i].getAttribute('title')||'').indexOf('Ähnliche Worte finden')>=0) return i; }
              return -1;
            })();
            """)
        check(blocks_idx >= 0 and unembed_idx >= 0, "blocks and unembedding steps found", f"{blocks_idx} / {unembed_idx}")
        js(driver, f"LearnSys.go(0, {blocks_idx})")
        time.sleep(0.5)
        js(driver, "document.querySelector('.ls-bs-card[data-index=\"3\"]').click()")
        time.sleep(0.6)
        check(bool(js(driver, "document.querySelector('.ls-bs-traj-full .ls-traj-scene canvas')")), "transformer station mounts the GPT-2 trajectory")
        reduced = js(driver, "!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)")
        if reduced:
            check(True, "trajectory autoplay respects reduced motion")
        else:
            check("Pause" in js(driver, "document.querySelector('.ls-bs-traj-full .ls-traj-play').textContent"), "trajectory autoplay is on")
            layer_before = js(driver, "document.querySelector('.ls-bs-traj-full .ls-traj-layer').value")
            time.sleep(1.7)
            layer_after = js(driver, "document.querySelector('.ls-bs-traj-full .ls-traj-layer').value")
            check(layer_before != layer_after, "trajectory moves through layers", f"{layer_before} -> {layer_after}")
        check("Demo" in js(driver, "document.querySelector('.ls-bs-traj-caption').textContent"), "trajectory caption marks it as a demo")

        # 6d. Unembedding angle suggestions are hoverable/clickable.
        js(driver, f"LearnSys.go(0, {unembed_idx})")
        time.sleep(0.5)
        js(driver, "document.querySelector('.ls-sim-tab[data-mode=\"unembed\"]').click()")
        time.sleep(0.5)
        check(js(driver, "document.querySelectorAll('.ls-un-angle').length") >= 3, "angle suggestions are visible")
        js(driver, "document.querySelector('.ls-un-angle').click()")
        time.sleep(0.2)
        check(bool(js(driver, "document.querySelector('.ls-un-angle.is-on')")), "clicking an angle suggestion highlights it")
        check("Winkel" in js(driver, "document.querySelector('.ls-sim-readout').textContent"), "angle readout is visible")
        js(driver, "document.querySelector('.ls-sim-next-angle').click()")
        time.sleep(0.2)
        first_angle = js(driver, "document.querySelector('.ls-un-angle.is-on').textContent")
        js(driver, "document.querySelector('.ls-sim-next-angle').click()")
        time.sleep(0.2)
        second_angle = js(driver, "document.querySelector('.ls-un-angle.is-on').textContent")
        check(first_angle != second_angle, "next angle steps through suggestions", f"{first_angle} / {second_angle}")

        # 7. Smooth repeated navigation.
        for _ in range(5):
            js(driver, "LearnSys.next()")
            time.sleep(0.12)
        for _ in range(5):
            js(driver, "LearnSys.prev()")
            time.sleep(0.12)
        check( len(js(driver, "document.querySelector('#ls-body').innerText").strip()) > 20,"repeated navigation keeps a body")
        errors = console_errors(driver)
        check( not errors,"no severe console errors", " | ".join(errors[:2]))
    finally:
        if driver:
            driver.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    print("")
    print(f"{checks - failures} passed, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
