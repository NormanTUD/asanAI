# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright",
# ]
# ///
"""
origami_folds.js — Regressionstests (Browser)

Treibt das echte Widget (tf + plotly + origami_folds.js) in headless Chromium
durch eine Matrix an Modell-Architekturen und Laufzeit-Ereignissen und
prüft nach jedem Schritt:

  * wrn()/err() wurden NICHT aufgerufen (im echten App-Kontext erhöhen sie
    num_wrns/num_errs, und die Browser-Test-Suite schlägt fehl, wenn die
    Zähler wachsen),
  * keine Topologie-Bug-Logzeilen ("ungültigen Indizes", "Quad-Anzahl
    inkonsistent", "Gitter-Punktzahl passt nicht"),
  * kein ungefangener JavaScript-Fehler,
  * kompatiblen Architekturen: Plot mit Traces (+ Fläche bei Gitter-Scenes),
  * inkompatiblen Architekturen: saubere Deaktivierung mit Übersetzung.

Gedeckte Fälle:
  - Dichte-Ketten mit Dim-Wechseln (2→3, 3→2, 1→2→3, 3→3, 2→3→2→3),
    inkl. des Original-Bugs (2D-Blatt in 3D, dann Adoption als 3D-Grid),
  - andere Layer-Typen zwischen Dichten: Dropout, Activation,
    BatchNormalization, Conv2D+Flatten, explizite InputLayer,
  - 1D-, 4D-, Bild-Input; Regression; Softmax-Ausgabe;
  - Training mit onEpochEnd-Callback (wie train.js), Modell-Wechsel,
    Modell-Dispose, Config-Toggles, Theme-/Language-Wechsel,
    rapid updates, destroy/re-init, fehlende Trainingsdaten,
  - hidden->shown First-Render (jQuery-UI-Tab-Race: erster newPlot auf
    display:none->visible Panel, 8x mit destroy dazwischen) und
    Pick-Crash-Recovery (synthetischer window-error -> Plot neu aufgebaut).

Aufruf (aus dem Repo-Root, braucht php + Chromium):
    uv run tests/origami_folds_test.py
Exit 0 = alle Checks grün.
"""

import asyncio
import os
import socket
import subprocess
import sys

from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SHEET = {"input": 2, "layers": [["dense", 3, "relu"], ["dense", 2]]}
CUBE = {"input": 3, "layers": [["dense", 2, "relu"], ["dense", 3, "relu"]]}
FLAT = {"input": 2, "layers": [["dense", 2, "relu"], ["dense", 2, "relu"]]}
LINE = {"input": 1, "layers": [["dense", 1], ["dense", 1]]}
EMBED = {"input": 1, "layers": [["dense", 2, "relu"], ["dense", 3, "relu"]]}
CUBE3 = {"input": 3, "layers": [["dense", 3, "relu"]]}
DROPOUT = {"input": 2, "layers": [["dense", 2, "relu"], ["dropout", 0.2], ["dense", 2, "relu"]]}
ACTIV = {"input": 2, "layers": [["dense", 2], ["activation", "relu"], ["dense", 2, "relu"]]}
BN = {"input": 3, "layers": [["dense", 3, "relu"], ["batchnorm"], ["dense", 2]]}
SOFT = {"input": 2, "layers": [["dense", 2, "tanh"], ["dense", 2, "sigmoid"]]}
DEEP = {"input": 2, "layers": [["dense", 3, "relu"], ["dense", 2, "relu"], ["dense", 3, "relu"], ["dense", 2]]}
WIDE4 = {"input": 4, "layers": [["dense", 2, "relu"]]}
CONV = {"input": [4, 4, 1], "layers": [["conv2d", 4, 3, "relu"], ["flatten"], ["dense", 2]]}
NOLOW = {"input": 2, "layers": [["dense", 8, "relu"], ["dense", 8]]}
REG = {"input": 2, "layers": [["dense", 1]]}
SOFTMAX = {"input": 2, "layers": [["dense", 2, "relu"], ["dense", 2, "softmax"]]}
INPUTLAYER = {"input": 2, "inputLayers": True, "layers": [["dense", 3, "relu"], ["dense", 2]]}

TOPOLOGY_BUG_MARKERS = [
    "ungültigen Indizes",
    "Quad-Anzahl inkonsistent",
    "Gitter-Punktzahl passt nicht",
]

failures = []


def record(name, ok, detail=""):
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok else "  -- " + detail))
    if not ok:
        failures.append(name + "  -- " + detail)


def check_invariants(s):
    bad = []
    if s["wrn"]:
        bad.append("wrn=%d" % s["wrn"])
    if s["err"]:
        bad.append("err=%d" % s["err"])
    for line in s["logs"]:
        for marker in TOPOLOGY_BUG_MARKERS:
            if marker in line:
                bad.append("Topologie-Bug-Log: " + line)
    return bad


def expect_rendered(name, s, min_traces=2, need_mesh=False, no_degenerate=False):
    bad = check_invariants(s)
    if not s["hasPlot"]:
        bad.append("kein Plot gerendert (Traces=0, Info='%s')" % s["infoText"][:80])
        dbg = s.get("_debug", {})
        if dbg:
            pd = dbg.get("plotDivChildren") or {}
            bad.append("DEBUG: compat=%s chain=%s model=%s plotKids=%s nPlotly=%s nGl=%s logs=%s" % (
                dbg.get("compat"), dbg.get("buildChainReason"),
                dbg.get("modelInfo"),
                pd.get("kids"), pd.get("nPlotly"), pd.get("nGl"),
                [l for l in (dbg.get("logs") or [])][-3:]))
    elif s["nTraces"] < min_traces:
        bad.append("nur %d Traces" % s["nTraces"])
    if need_mesh and s["hasPlot"] and s["nMesh3d"] < 1:
        bad.append("kein mesh3d-Trace (Gitterfläche fehlt)")
    if no_degenerate:
        for line in s["logs"]:
            if "kein einziges gültiges Dreieck" in line:
                bad.append("degenerierte Fläche: " + line)
    if s["infoVisible"] and s["hasPlot"]:
        bad.append("deaktiviert und gerendert gleichzeitig: " + s["infoText"][:80])
    record(name, not bad, "; ".join(bad))
    return not bad


def expect_deactivated(name, s, substr=None):
    bad = check_invariants(s)
    container_gone = s.get("_debug", {}).get("containerExists") is False
    if not s["infoVisible"] and not container_gone:
        bad.append("nicht deaktiviert und nicht zerstört (Info-Box nicht sichtbar, Container vorhanden)")
        logs = s.get("_debug", {}).get("logs") or []
        if logs:
            bad.append("logs=" + str(logs[-3:]))
        if s.get("_dispose_info"):
            bad.append("dispose_info=" + str(s["_dispose_info"]))
    elif s["infoVisible"] and substr and substr not in s["infoText"]:
        bad.append("Info-Text enthält nicht '%s': '%s'" % (substr, s["infoText"][:100]))
    if s["hasPlot"]:
        bad.append("Plot sollte bei inkompatiblen Modell nicht gerendert sein")
    record(name, not bad, "; ".join(bad))
    return not bad


def expect_quiet(name, s):
    bad = check_invariants(s)
    record(name, not bad, "; ".join(bad))
    return not bad


async def main():
    server = None
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(args=["--no-sandbox", "--enable-unsafe-swiftshader"])
        except Exception:
            browser = await p.chromium.launch(
                executable_path="/usr/bin/chromium",
                args=["--no-sandbox", "--enable-unsafe-swiftshader"])

        page = await browser.new_page(viewport={"width": 1250, "height": 900})
        page_errors = []
        console_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
        s.close()
        server = subprocess.Popen(
            ["php", "-S", "127.0.0.1:%d" % port],
            cwd=BASE,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        def _server_ready(timeout=20):
            import time
            t0 = time.time()
            while time.time() - t0 < timeout:
                try:
                    c = socket.create_connection(("127.0.0.1", port), timeout=0.5)
                    c.close()
                    return True
                except OSError:
                    time.sleep(0.2)
            return False

        try:
            if not _server_ready():
                print("PHP-Dev-Server startete nicht unter 127.0.0.1:%d" % port)
                sys.exit(2)

            url = "http://127.0.0.1:%d/tests/origami_folds_test.html" % port
            await page.goto(url)
            await page.wait_for_function(
                "window.__translationsLoaded && typeof OrigamiFolds !== 'undefined'",
                timeout=30000)

            async def scenario(model, data="cls2", with_data=True, wait=1600):
                await page.evaluate(
                    "(a) => __setScenario(a.m, a.d, a.w)",
                    {"m": model, "d": data, "w": with_data})
                await page.wait_for_timeout(wait)
                return await page.evaluate("__snapshot()")

            async def scenario_hidden(model, reveal_ms=40, wait=1400):
                # Reproduziert den echten Tab-Wechsel: Panel ist display:none,
                # init() laeuft WAEHRENDdessen (wie inline onclick vor jQuery UI),
                # erst danach wird der Panel sichtbar.
                await page.evaluate(
                    """(a) => {
                        try { OrigamiFolds.destroy(); } catch (e) {}
                        window._state_initialised_in_tab = false;
                        __hidePlot();
                        __setupModel(a.m, 'cls2', true);
                        update_origami_folds();
                        setTimeout(function () { __showPlot(); }, a.rv);
                    }""",
                    {"m": model, "rv": reveal_ms})
                await page.wait_for_timeout(wait)
                return await page.evaluate("__snapshot()")

            async def new_errors(name):
                nonlocal_err = []
                if page_errors:
                    nonlocal_err.append("pageerror: " + " | ".join(page_errors))
                if console_errors:
                    nonlocal_err.append("console.error: " + " | ".join(console_errors[:3]))
                ok = not nonlocal_err
                record(name + " [js-frei]", ok, "; ".join(nonlocal_err))
                page_errors.clear()
                console_errors.clear()
                return ok

            # -------------------------------------------------- gerendert
            s = await scenario(SHEET)
            expect_rendered("sheet 2→3→2 (Original-Bug: 2D-Blatt in 3D)",
                            s, need_mesh=True)
            await new_errors("sheet 2→3→2")

            s = await scenario(CUBE)
            expect_rendered("cube 3→2→3 (Kubus-Topologie durch 2D)",
                            s, need_mesh=True)
            await new_errors("cube 3→2→3")

            s = await scenario(FLAT)
            expect_rendered("flat 2→2→2 (gleiche Dim)", s, need_mesh=True)
            await new_errors("flat 2→2→2")

            s = await scenario(LINE)
            expect_rendered("line 1→1→1 (1D-Kette, keine Fläche)", s)
            await new_errors("line 1→1→1")

            s = await scenario(EMBED)
            expect_rendered("embed 1→2→3 (Blatt wird aus der Linie)", s)
            await new_errors("embed 1→2→3")

            s = await scenario(CUBE3)
            expect_rendered("cube 3→3 (einzelner Kubus-Layer)", s, need_mesh=True)
            await new_errors("cube 3→3")

            s = await scenario(DEEP)
            expect_rendered("deep 2→3→2→3→2 (4 Paare)", s, need_mesh=True)
            await new_errors("deep 2→3→2→3→2")

            # ------------------------------------ andere Layer-Typen
            s = await scenario(DROPOUT)
            expect_rendered("dropout zwischen Dichten", s)
            await new_errors("dropout")

            s = await scenario(ACTIV)
            expect_rendered("Activation-Layer zwischen Dichten", s)
            await new_errors("activation")

            s = await scenario(BN)
            expect_rendered("BatchNormalization zwischen Dichten", s)
            await new_errors("batchnorm")

            s = await scenario(INPUTLAYER)
            expect_rendered("funktionales Modell mit expliziter InputLayer", s)
            await new_errors("inputlayer")

            s = await scenario(SOFT)
            expect_rendered("weiche Falten (tanh/sigmoid)", s, need_mesh=True)
            await new_errors("soft folds")

            s = await scenario(SOFTMAX)
            expect_rendered("Softmax-Ausgabe (Klassifikation)", s)
            await new_errors("softmax")

            s = await scenario(REG, data="reg")
            expect_rendered("Regression (y: [n,1])", s)
            await new_errors("regression")

            # ------------------------------------ inkompatibel: sauber aus
            s = await scenario(WIDE4)
            expect_deactivated("Wide-4D-Input (kein 1-3D-Paar)",
                               s, substr="BENACHBARTEN")
            await new_errors("wide4")

            s = await scenario(CONV)
            expect_deactivated("Conv2D+Flatten (kein 1-3D-Paar)",
                               s, substr="BENACHBARTEN")
            await new_errors("conv2d")

            s = await scenario(NOLOW)
            expect_deactivated("nur hohe Dims (8→8)", s, substr="BENACHBARTEN")
            await new_errors("nolow")

            s = await scenario(SHEET, with_data=False)
            expect_deactivated("keine Trainingsdaten",
                               s, substr="Keine Trainingsdaten verfügbar")
            await new_errors("no_data")

            # ------------------------------------------------ training
            await page.evaluate("(m) => __setScenario(m, 'cls2', true)", SHEET)
            await page.wait_for_timeout(1500)
            fit_err = await page.evaluate("""async () => {
                window.started_training = true;
                var m = window.model, g = window.xy_data_global;
                try {
                    if (!m.optimizer) {
                        m.compile({ optimizer: 'sgd', loss: 'categoricalCrossentropy' });
                    }
                    await m.fit(g.x, g.y, {
                        epochs: 3, batchSize: 32, verbose: 0,
                        callbacks: {
                            onEpochEnd: async function () {
                                update_origami_folds();
                            }
                        }
                    });
                } finally {
                    window.started_training = false;
                }
                update_origami_folds();
                return true;
            }""")
            await page.wait_for_timeout(1500)
            s = await page.evaluate("__snapshot()")
            bad = []
            for line in s["logs"]:
                for marker in TOPOLOGY_BUG_MARKERS:
                    if marker in line:
                        bad.append("Topologie-Bug-Log: " + line)
            if s["err"]:
                bad.append("err=%d" % s["err"])
            if s["wrn"]:
                wrn_lines = [l for l in s["logs"] if l.startswith("WRN")]
                unexpected = [l for l in wrn_lines if "nicht-finite" not in l]
                if unexpected:
                    bad.append("unerwartete wrn: " + str(unexpected))
            if not fit_err:
                bad.append("model.fit lief nicht")
            if not s["hasPlot"]:
                bad.append("Plot nach Training weg")
            if s["nMesh3d"] < 1:
                bad.append("Fläche nach Training verschwunden")
            for line in s["logs"]:
                if "kein einziges gültiges Dreieck" in line:
                    bad.append("Fläche kollabiert während Training: " + line)
            if bad:
                bad.append("logs=" + str(s.get("_debug", {}).get("logs", [])[-4:]))
            record("training: 3 Epochs mit onEpochEnd (wie train.js)", not bad, "; ".join(bad))
            await new_errors("training")

            # ------------------------------------------------ model swap
            s = await scenario(CUBE)
            expect_rendered("Modell-Wechsel 2→3→2 nach 3→2→3", s, need_mesh=True)
            await new_errors("model_swap")

            # ------------------------------------------------ model dispose
            dispose_info = await page.evaluate("""() => {
                try { if (window.model) window.model.dispose(); } catch(e) {}
                window.model = null;
                update_origami_folds();
                return { modelSetToNull: true };
            }""")
            await page.wait_for_timeout(1200)
            s = await page.evaluate("__snapshot()")
            if dispose_info:
                s["_dispose_info"] = dispose_info
            expect_deactivated("Modell disposed", s, substr="Kein Modell vorhanden")
            await new_errors("model_dispose")

            # ------------------------------------------------ config toggles
            s = await scenario(SHEET)
            expect_rendered("config: Ausgangszustand", s, need_mesh=True)
            cfg_info = await page.evaluate("""() => {
                var before = OrigamiFolds.getConfig();
                OrigamiFolds.setConfig({ showGridSurface: false, showReluCuts: false });
                var after = OrigamiFolds.getConfig();
                update_origami_folds();
                return { before_sgs: before.showGridSurface, after_sgs: after.showGridSurface,
                          before_src: before.showReluCuts, after_src: after.showReluCuts };
            }""")
            await page.wait_for_timeout(1400)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if s["nMesh3d"] != 0:
                bad.append("mesh3d trotz showGridSurface+showReluCuts=false (%d); cfg=%s; logs=%s" % (
                    s["nMesh3d"], cfg_info, str(s.get("_debug", {}).get("logs", [])[-3:])))
            record("config: showGridSurface=false", not bad, "; ".join(bad))

            await page.evaluate("() => OrigamiFolds.setConfig({ showGrid: false }); update_origami_folds();")
            await page.wait_for_timeout(1400)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if s["infoVisible"]:
                bad.append("deaktiviert nach showGrid=false")
            record("config: showGrid=false", not bad, "; ".join(bad))

            await page.evaluate("() => OrigamiFolds.setConfig({ showGridSurface: true, showGrid: true, showReluCuts: true, maxPoints: 64 }); update_origami_folds();")
            await page.wait_for_timeout(1400)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if not s["hasPlot"]:
                bad.append("Plot nach Config-Restore weg")
            record("config: Restore + maxPoints=64", not bad, "; ".join(bad))
            await new_errors("config toggles")

            # ------------------------------------------------ theme / lang
            await page.evaluate("() => { window.is_dark_mode = true; }")
            await page.wait_for_timeout(900)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if s["titleColor"] != "rgb(227, 233, 251)":
                bad.append("Titel-Farbe nach Dark-Wechsel: " + s["titleColor"])
            record("theme: dark mode", not bad, "; ".join(bad))

            await page.evaluate("() => { window.lang = 'en'; }")
            await page.wait_for_timeout(900)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if not s["btnText"].startswith("\u21BA View"):
                bad.append("Button nach Language-Wechsel: " + s["btnText"])
            record("lang: de→en", not bad, "; ".join(bad))

            await page.evaluate("() => { window.is_dark_mode = false; window.lang = 'de'; }")
            await page.wait_for_timeout(900)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if not s["btnText"].startswith("\u21BA Ansicht"):
                bad.append("Button nach Rückwechsel: " + s["btnText"])
            record("theme+lang: zurück", not bad, "; ".join(bad))
            await new_errors("theme/lang")

            # ------------------------------------------------ rapid updates
            for _ in range(5):
                await page.evaluate("() => update_origami_folds()")
            await page.wait_for_timeout(1500)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if not s["hasPlot"]:
                bad.append("Plot nach Rapid-Updates weg")
            record("rapid updates (x5)", not bad, "; ".join(bad))

            # ------------------------------------------------ destroy / re-init
            await page.evaluate("() => { OrigamiFolds.destroy(); update_origami_folds(); }")
            await page.wait_for_timeout(1600)
            s = await page.evaluate("__snapshot()")
            bad = check_invariants(s)
            if not s["hasPlot"]:
                bad.append("keine Neu-Init nach destroy()")
            record("destroy + re-init", not bad, "; ".join(bad))
            await new_errors("destroy/reinit")

            # --------------------------------- hidden -> shown (Tab-Race)
            # Der eigentliche Bug: erster newPlot auf einem Panel, das gerade
            # display:none -> visible wechselt (jQuery-UI-Tab). Ohne Fix
            # initialisiert Plotly einen nicht-gesetzten GL-Canvas und der
            # 3D-Erst-Pick bricht ("...length, ...is undefined").
            for i in range(8):
                s = await scenario_hidden(SHEET, reveal_ms=40)
                if i == 0 and s["nMesh3d"] < 1:
                    print("DEBUG hidden#1 snapshot:")
                    import json
                    print(json.dumps(s, indent=1, ensure_ascii=False)[:2500])
                expect_rendered("hidden->shown first render #%d" % (i + 1),
                                s, need_mesh=True)
                await new_errors("hidden->shown #%d" % (i + 1))

            # ------------------------------------------------ recovery net
            s = await scenario(SHEET)
            expect_rendered("recovery: Ausgangszustand", s, need_mesh=True)
            await page.evaluate(
                "() => { window.__counts = { wrn: 0, err: 0 }; window.__logs = []; }")
            await page.evaluate(
                "(msg) => window.dispatchEvent(new ErrorEvent('error', { message: msg }))",
                "can't access property \"length\", Se is undefined")
            await page.wait_for_timeout(1300)
            s = await page.evaluate("__snapshot()")
            bad = []
            if not s["hasPlot"]:
                bad.append("Plot nach Pick-Crash-Recovery weg")
            rec = [l for l in s["logs"] if "Pick-Crash" in l]
            if not rec:
                bad.append("keine Recovery-Logzeile; logs=" + str(s["logs"][-3:]))
            if s["err"]:
                bad.append("err=%d" % s["err"])
            record("recovery: Pick-Crash -> Plot neu aufgebaut", not bad, "; ".join(bad))
            await new_errors("recovery")

            await browser.close()
        finally:
            if server:
                server.terminate()
                try:
                    server.wait(timeout=5)
                except Exception:
                    server.kill()

    if failures:
        print("\n%d FEHLGESCHLAGEN:" % len(failures))
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nALLE CHECKS GRÜN")
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
