#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Short regression test for the second transformer UI pass.

Focus on the complex, easy-to-regress pieces:
  * clickable input/change/output heatmaps that reveal their matrices;
  * logit lens shows the last token first, with bars and an others toggle;
  * optional blocks are flat collapsibles with a small +/- on the right;
  * no automatic equation numbers, no orange `.math_transformer` boxes;
  * each formula step carries its short "why here" intuition.

Run from the repository root:
    uv run blog/tests/transformer_ui2_regression_test.py
"""

from __future__ import annotations

import shutil
import socket
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
CASES: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    CASES.append((name, bool(ok), detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + (f" — {detail}" if detail and not ok else ""))


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def ensure_chromium() -> None:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            browser.close()
            return
    except Exception:
        pass
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)


def serve(port: int) -> subprocess.Popen:
    php = shutil.which("php")
    if php is None:
        print("ERROR: php is not on PATH", file=sys.stderr)
        raise SystemExit(1)
    return subprocess.Popen([php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    source = (BLOG / "style.css").read_text(encoding="utf-8")
    steps_css = (BLOG / "transformer_steps.css").read_text(encoding="utf-8")
    check("optional blocks are flat (no blue side bar)",
          "border-left: 4px solid #3498db" not in source and ".optional-title" in source)
    check("equation numbers are disabled",
          ".cl-eq::after {\n\tcontent: none;" in source)
    check("triple math panel and why-note styles exist",
          ".tm-triple-math" in steps_css and ".tm-step-why" in steps_css)

    ensure_chromium()
    port = free_port()
    server = serve(port)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1400, "height": 1000})
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.goto(f"http://127.0.0.1:{port}/transformer.php", wait_until="load", timeout=120000)
            page.wait_for_function("() => !!document.querySelector('.tm-layer-card')", timeout=120000)

            page.evaluate("""() => {
                const card = document.querySelector('.tm-layer-card');
                const head = card.querySelector('.tm-layer-head');
                if (head && card.querySelector('.tm-layer-body').hidden) head.click();
                const mig = card.querySelector('.tm-layer-subbox[data-sub="migration"]');
                if (mig) mig.open = true;
                const ffn = card.querySelector('.tm-layer-subbox[data-sub="ffn"]');
                if (ffn) ffn.open = true;
                const attn = card.querySelector('.tm-layer-subbox[data-sub="attention"]');
                if (attn) attn.open = true;
            }""")
            page.wait_for_timeout(2500)

            triple = page.evaluate("""() => {
                const cell = document.querySelector('.tm-triple-cell');
                const row = document.querySelector('.tm-residual-triple');
                const canvas = document.querySelector('.tm-residual-heatmap-canvas');
                if (!cell || !row || !canvas) return null;
                const cs = getComputedStyle(cell);
                return {
                    border: cs.borderTopWidth, bg: cs.backgroundColor, cursor: cs.cursor,
                    grid: getComputedStyle(row).gridTemplateColumns,
                    rowWidth: row.getBoundingClientRect().width,
                    cellWidth: cell.getBoundingClientRect().width,
                    canvasWidth: canvas.getBoundingClientRect().width
                };
            }""")
            check("triple heatmaps have no box", bool(triple) and triple["border"] == "0px" and triple["bg"] == "rgba(0, 0, 0, 0)", str(triple))
            check("triple heatmaps fit in one full-width row",
                  bool(triple) and len(triple["grid"].split()) == 5
                  and abs(triple["canvasWidth"] - triple["cellWidth"]) < 2
                  and triple["cellWidth"] * 3 <= triple["rowWidth"] + 2, str(triple))
            page.locator(".tm-residual-triple").first.click()
            page.wait_for_timeout(400)
            math_panel = page.evaluate("""() => {
                const panel = document.querySelector('.tm-triple-math');
                return panel ? {visible: !panel.hidden, math: panel.querySelectorAll('math').length,
                                border: getComputedStyle(panel).borderLeftWidth} : null;
            }""")
            check("clicking a heatmap reveals its pmatrix math",
                  bool(math_panel) and math_panel["visible"] and math_panel["math"] >= 3, str(math_panel))
            check("matrix panel has no blue left bar", bool(math_panel) and math_panel["border"] == "0px", str(math_panel))

            config = page.evaluate("""() => {
                const cfg = document.getElementById('transformer_config');
                const slot = document.querySelector('#transformer_config .tm-model-size-slot');
                const btn = document.getElementById('param-breakdown-btn');
                const field = cfg.querySelector('.transformer-config-field');
                const train = document.getElementById('transformer-train-card');
                const kv = Array.from(cfg.querySelectorAll('.transformer-config-field')).find(f => /KV cache/i.test(f.textContent));
                const ctx = Array.from(cfg.querySelectorAll('.transformer-config-field')).find(f => /Context Size/i.test(f.textContent));
                return {
                    cols: getComputedStyle(cfg).gridTemplateColumns,
                    alignItems: getComputedStyle(cfg).alignItems,
                    slotUnder: !!slot,
                    btn: btn ? btn.textContent.trim() : '',
                    fieldRadius: field ? getComputedStyle(field).borderRadius : null,
                    trainRadius: train ? getComputedStyle(train).borderRadius : null,
                    kvHeight: kv ? kv.getBoundingClientRect().height : null,
                    ctxHeight: ctx ? ctx.getBoundingClientRect().height : null
                };
            }""")
            check("hyperparameter grid has one column", bool(config) and len(config["cols"].split()) == 1, str(config))
            check("model size is not shown as a separate line", bool(config) and not config["slotUnder"], str(config))
            check("hyperparameter boxes size to their content",
                  bool(config) and config["alignItems"] == "start", str(config))
            check("hyperparameter/training boxes use the flat step style",
                  bool(config) and config["fieldRadius"] == "0px" and config["trainRadius"] == "0px", str(config))
            page.wait_for_function("() => { const b=document.getElementById('param-breakdown-btn'); return b && /parameters/i.test(b.textContent); }", timeout=30000)
            check("parameter-breakdown button shows the model size",
                  "parameters" in page.evaluate("() => document.getElementById('param-breakdown-btn').textContent"))

            inline_math = page.evaluate("""() => {
                const label = document.querySelector('.transformer-slider-label');
                const note = document.querySelector('.transformer-slider-note');
                const m = label ? label.querySelector('math') : null;
                const n = note ? note.querySelector('math') : null;
                return {
                    labelCount: label ? label.querySelectorAll('math').length : 0,
                    labelNested: m ? m.querySelectorAll('math').length : 0,
                    noteNested: n ? n.querySelectorAll('math').length : 0
                };
            }""")
            check("inline math in labels/notes is not re-rendered as a block",
                  bool(inline_math) and inline_math["labelCount"] == 1
                  and inline_math["labelNested"] == 0 and inline_math["noteNested"] == 0, str(inline_math))

            ffn_inner = page.evaluate("""() => {
                const card = document.querySelector('.tm-layer-card');
                const fb = card.querySelector('[id$="-formula-body"]');
                if (!fb) return null;
                return {
                    hasInnerFfn: Array.from(fb.querySelectorAll('.tm-formula-step > summary')).some(s => s.textContent.trim() === 'FFN / MLP'),
                    stepDirect: !!fb.querySelector('[id$="-step-1"]') && !fb.querySelector('[id$="-step-1"]').closest('.tm-formula-step')
                };
            }""")
            check("FFN/MLP has no duplicate inner collapsible",
                  bool(ffn_inner) and not ffn_inner["hasInnerFfn"] and ffn_inner["stepDirect"], str(ffn_inner))

            why = page.evaluate("""() => {
                const w = document.querySelector('.tm-step-why');
                if (!w) return null;
                return {border: getComputedStyle(w).borderLeftWidth, text: w.innerText};
            }""")
            check("why-note has no left bar and labels the limits",
                  bool(why) and why["border"] == "0px" and ("Limit of this intuition" in why["text"] or "Grenze der Intuition" in why["text"]), str(why)[:200])

            hafter = page.evaluate("""() => {
                const sub = document.querySelector('.tm-logit-subbox');
                const simple = document.querySelector('.tm-hafter-simple');
                const texEl = simple ? simple.querySelector('[data-tex]') : null;
                return {
                    subbox: !!sub,
                    summary: sub ? sub.querySelector('summary').textContent.trim() : '',
                    simple: !!simple,
                    math: simple ? simple.querySelectorAll('math').length : 0,
                    tex: texEl ? texEl.getAttribute('data-tex') : ''
                };
            }""")
            check("logit lens uses a flat subbox and a simple h_after",
                  bool(hafter) and hafter["subbox"] and hafter["simple"] and "Logit lens" in hafter["summary"], str(hafter)[:200])
            check("h_after actually renders as math", bool(hafter) and hafter["math"] >= 1, str(hafter)[:220])
            check("h_after is coloured by depth and shape-labelled",
                  bool(hafter) and "underbrace" in hafter["tex"] and "color[RGB]" in hafter["tex"], str(hafter)[:220])

            logit = page.evaluate("""() => {
                const host = document.querySelector('.tm-logit-lens-host');
                if (!host) return null;
                const lens = host.querySelector('.tm-logit-lens');
                const rows = lens ? lens.querySelectorAll(':scope > .tm-logit-row') : [];
                return {
                    rows: rows.length,
                    lastOnly: rows.length === 1 && rows[0].classList.contains('is-last'),
                    bars: host.querySelectorAll('.tm-logit-bar').length,
                    others: !!host.querySelector('.tm-logit-others')
                };
            }""")
            check("logit lens shows the last token first, with bars and others toggle",
                  bool(logit) and logit["lastOnly"] and logit["bars"] > 0 and logit["others"], str(logit))

            logit_view = page.evaluate("""() => {
                const sel = document.querySelector('.tm-logit-view-select');
                return sel ? {options: sel.options.length, value: sel.value} : null;
            }""")
            check("logit lens has a logits/angle view switch",
                  bool(logit_view) and logit_view["options"] == 2 and logit_view["value"] == "logits", str(logit_view))
            page.evaluate("() => document.getElementById('unified-layer-0-logit-lens').scrollIntoView()")
            page.wait_for_timeout(1200)
            page.evaluate("""() => { const s=document.querySelector('.tm-logit-view-select'); s.value='angle'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(1400)
            angle_view = page.evaluate("""() => {
                const chip = document.querySelector('.tm-logit-lens .tm-logit-chip .tm-logit-pct');
                const final = document.getElementById('tm-final-angle-view');
                const finalSel = document.querySelector('.tm-final-view select');
                return {
                    chip: chip ? chip.textContent.trim() : null,
                    finalDisplay: final ? getComputedStyle(final).display : null,
                    rows: final ? final.querySelectorAll('.tm-final-angle-row').length : 0,
                    finalSel: finalSel ? finalSel.value : null
                };
            }""")
            check("angle view shows cos/θ/π in the logit lens and final rows",
                  bool(angle_view) and angle_view["chip"] and angle_view["chip"].startswith("cos ")
                  and angle_view["finalDisplay"] != "none" and angle_view["rows"] > 0,
                  str(angle_view)[:300])
            page.evaluate("""() => { const s=document.querySelector('.tm-logit-view-select'); s.value='logits'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(900)
            angle_hidden = page.evaluate("""() => {
                const final = document.getElementById('tm-final-angle-view');
                return final ? getComputedStyle(final).display : null;
            }""")
            check("angle view hides when logits is selected", angle_hidden == "none", str(angle_hidden))

            optional = page.evaluate("""() => {
                const block = document.querySelector('.optional');
                if (!block) return null;
                const cs = getComputedStyle(block);
                const icon = block.querySelector('.optional-icon');
                return {border: cs.borderLeftWidth, bg: cs.backgroundColor, icon: icon && icon.textContent.trim()};
            }""")
            check("optional blocks are flat with a + icon",
                  bool(optional) and optional["border"] == "0px" and optional["bg"] == "rgba(0, 0, 0, 0)" and optional["icon"] in ("+", "−"), str(optional))

            eq = page.evaluate("""() => {
                const el = document.querySelector('.cl-eq');
                return el ? getComputedStyle(el, '::after').display + '|' + getComputedStyle(el, '::after').content : null;
            }""")
            check("display equations carry no number", bool(eq) and eq.split("|")[1] in ("none", "normal", '""'), str(eq))

            why = page.evaluate("() => document.querySelectorAll('.tm-step-why').length")
            check("formula steps carry a short why-note", why > 0, f"count={why}")
            mt = page.evaluate("""() => {
                const el = document.querySelector('.math_transformer');
                if (!el) return null;
                const cs = getComputedStyle(el);
                return {bg: cs.backgroundColor, border: cs.borderLeftWidth};
            }""")
            check("math_transformer is not an orange box",
                  bool(mt) and mt["bg"] == "rgba(0, 0, 0, 0)" and mt["border"] == "0px", str(mt))
            method = page.evaluate("""() => {
                const d = document.querySelector('.tm-head-method-details');
                return d ? {open: d.open, hasMethod: !!d.querySelector('.tm-head-method')} : null;
            }""")
            page.wait_for_function("() => !!document.getElementById('sticky-metric-select')", timeout=60000)
            global_metric = page.evaluate("""() => {
                const sel = document.querySelector('#sticky-metric-select');
                const perPlot = !!document.querySelector('[data-feature-metric], .trajectory-metric-select, .tm-step-metric');
                return sel ? {options: sel.options.length, value: sel.value, perPlot} : null;
            }""")
            check("one global metric switch, default Euclidean",
                  bool(global_metric) and global_metric["options"] == 2
                  and global_metric["value"] == "euclidean" and not global_metric["perPlot"], str(global_metric))

            page.evaluate("() => document.getElementById('unified-layer-0-feature-arrows').scrollIntoView()")
            page.wait_for_timeout(1200)
            overlay = page.evaluate("""() => {
                const s=document.querySelector('#sticky-metric-select');
                s.value='angular'; s.dispatchEvent(new Event('change',{bubbles:true}));
                return !!document.querySelector('.tm-metric-loading');
            }""")
            check("visible plots show a small metric loading overlay", overlay)
            page.wait_for_timeout(1200)
            feature_metric = page.evaluate("""() => {
                const el = document.getElementById('unified-layer-0-feature-arrows');
                const d = (el && el.data) || [];
                const title = el && el.layout && el.layout.title ? el.layout.title.text : '';
                return {title, surface: d.some(t => t.type === 'surface'), cone: d.some(t => t.type === 'cone')};
            }""")
            check("feature migration follows the global metric",
                  bool(feature_metric) and "great-circle" in feature_metric["title"].lower()
                  and feature_metric["surface"] and feature_metric["cone"], str(feature_metric))

            sticky_sphere = page.evaluate("""() => {
                const label = document.getElementById('sticky-sphere-label');
                const cb = document.getElementById('sticky-metric-sphere');
                const el = document.getElementById('unified-layer-0-feature-arrows');
                const surface = (el && el.data ? el.data : []).find(s => s.type === 'surface');
                return {
                    display: label ? getComputedStyle(label).display : null,
                    checked: cb ? cb.checked : null,
                    opacity: surface ? surface.opacity : null
                };
            }""")
            check("sphere toggle is shown for great-circle and the sphere is ~20% visible",
                  bool(sticky_sphere) and sticky_sphere["display"] != "none" and sticky_sphere["checked"]
                  and sticky_sphere["opacity"] is not None and abs(sticky_sphere["opacity"] - 0.18) < 0.03,
                  str(sticky_sphere))
            page.evaluate("""() => { const cb=document.getElementById('sticky-metric-sphere'); cb.checked=false; cb.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(1200)
            no_sphere = page.evaluate("""() => {
                const el = document.getElementById('unified-layer-0-feature-arrows');
                return (el && el.data ? el.data : []).some(s => s.type === 'surface');
            }""")
            check("sphere toggle removes the surface", not no_sphere)
            page.evaluate("""() => { const cb=document.getElementById('sticky-metric-sphere'); cb.checked=true; cb.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(800)

            page.evaluate("() => document.getElementById('transformer-plotly-space').scrollIntoView()")
            page.wait_for_timeout(1200)
            page.evaluate("""() => { const s=document.querySelector('#sticky-metric-select'); s.value='euclidean'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(500)
            overlay_emb = page.evaluate("""() => {
                const s=document.querySelector('#sticky-metric-select');
                s.value='angular'; s.dispatchEvent(new Event('change',{bubbles:true}));
                return !!document.querySelector('.tm-metric-loading');
            }""")
            check("embedding plot shows the metric loading overlay", overlay_emb)
            page.wait_for_timeout(1200)
            emb_metric = page.evaluate("""() => {
                const el = document.getElementById('transformer-plotly-space');
                const d = (el && el.data) || [];
                const title = el && el.layout && el.layout.title ? el.layout.title.text : '';
                return {title, surface: d.some(s => s.type === 'surface')};
            }""")
            check("embedding plot follows the global metric",
                  bool(emb_metric) and "Great-circle" in emb_metric["title"] and emb_metric["surface"], str(emb_metric))

            page.evaluate("() => document.getElementById('transformer-pe-shift-plot').scrollIntoView()")
            page.wait_for_timeout(1200)
            page.evaluate("""() => { const s=document.querySelector('#sticky-metric-select'); s.value='euclidean'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(500)
            page.evaluate("""() => { const s=document.querySelector('#sticky-metric-select'); s.value='angular'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(1200)
            pe_metric = page.evaluate("""() => {
                const el = document.getElementById('transformer-pe-shift-plot');
                const d = (el && el.data) || [];
                const title = el && el.layout && el.layout.title ? el.layout.title.text : '';
                return {title, surface: d.some(s => s.type === 'surface'), cone: d.some(s => s.type === 'cone')};
            }""")
            check("positional-shift plot follows the global metric",
                  bool(pe_metric) and "Great-circle" in pe_metric["title"] and pe_metric["surface"]
                  and pe_metric["cone"], str(pe_metric))

            page.evaluate("() => document.getElementById('transformer-trajectory-full-path').scrollIntoView()")
            page.wait_for_timeout(1500)
            traj_angular = page.evaluate("""() => {
                const el = document.getElementById('transformer-trajectory-full-path');
                const d = (el && el.data) || [];
                const title = el && el.layout && el.layout.title ? el.layout.title.text : '';
                const scatter = d.find(s => s.type === 'scatter3d' && Array.isArray(s.x) && s.x.length > 1);
                let norm = null;
                if (scatter) norm = Math.sqrt((scatter.x[0] || 0) ** 2 + (scatter.y[0] || 0) ** 2 + (scatter.z[0] || 0) ** 2);
                return {title, surface: d.some(s => s.type === 'surface'), cone: d.some(s => s.type === 'cone'), norm};
            }""")
            check("trajectory follows the global metric",
                  bool(traj_angular) and "Great-circle" in traj_angular["title"] and traj_angular["surface"]
                  and traj_angular["cone"] and traj_angular["norm"] is not None and abs(traj_angular["norm"] - 1) < 0.02,
                  str(traj_angular)[:300])

            explain = page.evaluate("""() => {
                const f = document.querySelector('.tm-feature-metric-explain');
                const t = document.querySelector('.trajectory-metric-explain');
                const links = Array.from(document.querySelectorAll('.tm-feature-metric-explain a')).map(a => a.href);
                return {feature: !!f, featureText: f ? f.innerText : '', trajectory: !!t, links};
            }""")
            check("explanation shows only the selected (angular) metric",
                  bool(explain) and explain["feature"] and explain["trajectory"]
                  and ("Great-circle" in explain["featureText"] or "Großkreis" in explain["featureText"])
                  and ("Sphere" in explain["featureText"] or "Kugel" in explain["featureText"])
                  and "Manhattan" not in explain["featureText"], str(explain["featureText"])[:220])
            check("metric explanation links the primary sources",
                  bool(explain) and "1607.06450" in " ".join(explain["links"])
                  and "D19-1006" in " ".join(explain["links"]) and "1908.10084" in " ".join(explain["links"]),
                  str(explain["links"]))
            page.evaluate("""() => { const s=document.querySelector('#sticky-metric-select'); s.value='euclidean'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(500)
            explain_e = page.evaluate("() => { const f=document.querySelector('.tm-feature-metric-explain'); return f ? f.innerText : ''; }")
            check("Euclidean explanation omits the sphere section",
                  ("Euclidean" in explain_e or "Euklidisch" in explain_e)
                  and "Sphere" not in explain_e and "Kugel" not in explain_e and "Manhattan" not in explain_e,
                  explain_e[:220])

            page.evaluate("() => { const s=document.getElementById('transformer-dimension-model'); s.value='2'; s.dispatchEvent(new Event('input',{bubbles:true})); }")
            page.wait_for_timeout(1800)
            page.evaluate("() => document.getElementById('transformer-plotly-space').scrollIntoView()")
            page.wait_for_timeout(1200)
            page.evaluate("""() => { const s=document.getElementById('sticky-metric-select'); s.value='angular'; s.dispatchEvent(new Event('change',{bubbles:true})); if (typeof _execute_embedding_render === 'function') _execute_embedding_render(2, null, []); }""")
            page.wait_for_timeout(1400)
            circle_2d = page.evaluate("""() => {
                const el = document.getElementById('transformer-plotly-space');
                const d = (el && el.data) || [];
                return {
                    circle: d.some(s => s.name === 'unit circle'),
                    surface: d.some(s => s.type === 'surface'),
                    types: [...new Set(d.map(s => s.type))]
                };
            }""")
            check("2D angular view uses a circle, not a sphere",
                  bool(circle_2d) and circle_2d["circle"] and not circle_2d["surface"], str(circle_2d))
            page.evaluate("() => { const s=document.getElementById('transformer-dimension-model'); s.value='3'; s.dispatchEvent(new Event('input',{bubbles:true})); }")
            page.wait_for_timeout(1200)
            page.evaluate("""() => { const s=document.getElementById('sticky-metric-select'); s.value='euclidean'; s.dispatchEvent(new Event('change',{bubbles:true})); }""")
            page.wait_for_timeout(500)
            check("no console/page errors", not errors, "; ".join(errors[:3]))

            errors.clear()
            page.goto(f"http://127.0.0.1:{port}/tenminutes/transformer.php", wait_until="load", timeout=120000)
            page.wait_for_timeout(2500)
            page.wait_for_function("() => { const b=document.getElementById('param-breakdown-btn'); return b && /parameter/i.test(b.textContent); }", timeout=30000)
            tm_layout = page.evaluate("""() => {
                const cfg = document.getElementById('transformer_config');
                const fields = Array.from(cfg.querySelectorAll(':scope > div'));
                const kv = fields.find(d => /KV cache/i.test(d.textContent));
                const ctx = fields.find(d => /Context Size/i.test(d.textContent));
                const btn = document.getElementById('param-breakdown-btn');
                const label = cfg.querySelector('label');
                const m = label ? label.querySelector('math') : null;
                return {
                    cols: getComputedStyle(cfg).gridTemplateColumns,
                    alignItems: getComputedStyle(cfg).alignItems,
                    slot: !!document.querySelector('.tm-model-size-slot'),
                    btn: btn ? btn.textContent.trim() : '',
                    kv: kv ? kv.getBoundingClientRect().height : null,
                    ctx: ctx ? ctx.getBoundingClientRect().height : null,
                    nested: m ? m.querySelectorAll('math').length : 0
                };
            }""")
            tm_global = page.evaluate("""() => {
                const s = document.querySelector('#tm-global-metric select');
                return s ? {options: s.options.length, value: s.value} : null;
            }""")
            check("tenminutes: global metric switch exists",
                  bool(tm_global) and tm_global["options"] == 2, str(tm_global))
            check("tenminutes: one-column config, no model-size line, dynamic heights",
                  bool(tm_layout) and len(tm_layout["cols"].split()) == 1 and not tm_layout["slot"]
                  and tm_layout["alignItems"] == "start", str(tm_layout))
            check("tenminutes: parameter button shows the size",
                  bool(tm_layout) and "parameters" in tm_layout["btn"].lower(), str(tm_layout))
            check("tenminutes: inline label math is not nested", bool(tm_layout) and tm_layout["nested"] == 0, str(tm_layout))
            tm_mt = page.evaluate("""() => {
                const el = document.querySelector('.math_transformer');
                if (!el) return null;
                const cs = getComputedStyle(el);
                return {bg: cs.backgroundColor, border: cs.borderLeftWidth};
            }""")
            check("tenminutes: math_transformer is not a gold box",
                  tm_mt is None or (tm_mt["bg"] == "rgba(0, 0, 0, 0)" and tm_mt["border"] == "0px"), str(tm_mt))
            check("tenminutes: no page errors", not errors, "; ".join(errors[:3]))
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    failed = [name for name, ok, _ in CASES if not ok]
    print(f"\n{len(CASES) - len(failed)}/{len(CASES)} passed")
    if failed:
        print("FAILED: " + ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
