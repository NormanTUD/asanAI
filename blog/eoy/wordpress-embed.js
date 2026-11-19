/*
 * WordPress embed bridge for the "One Word at a Time" lesson (eoy split).
 *
 * Load it from the lesson folder through the proxy:
 *   <script src="/asanai_blog_proxy.php?eoy/wordpress-embed.js"></script>
 *
 * It must be loaded after the iframe markup. It:
 *  - resizes the iframe from the { type: "height" } messages,
 *  - forwards arrow keys and lesson shortcuts into the iframe,
 *    so navigation works without clicking the iframe first.
 */
(function () {
    "use strict";

    var FRAME_ID = "asanai-final-iframe";
    var KEY_ATTR = "data-asanai-lesson";

    function getFrame() {
        return document.getElementById(FRAME_ID)
            || document.querySelector("iframe[" + KEY_ATTR + "]");
    }

    function ensureLoader() {
        var el = document.getElementById("asanai-screen-loader");
        if (!el) {
            el = document.createElement("div");
            el.id = "asanai-screen-loader";
            el.setAttribute("style", "position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;align-items:center;justify-content:center;transition:opacity .28s ease");
            var spinner = document.createElement("div");
            spinner.setAttribute("style", "width:40px;height:40px;border:3px solid #dbe3e0;border-top-color:#63a44b;border-radius:50%;animation:asanaiScreenSpin .8s linear infinite");
            el.appendChild(spinner);
            document.body.appendChild(el);
        }
        if (!document.getElementById("asanai-screen-spin-style")) {
            var style = document.createElement("style");
            style.id = "asanai-screen-spin-style";
            style.textContent = "@keyframes asanaiScreenSpin{to{transform:rotate(360deg)}}";
            document.head.appendChild(style);
        }
        return el;
    }

    function hideLoader() {
        if (window.__asanaiApplyScreenNav) window.__asanaiApplyScreenNav();
        var el = document.getElementById("asanai-screen-loader");
        if (!el) return;
        el.style.opacity = "0";
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }

    var screenNav = { prev: true, next: true, ready: false };
    function sendKey(key) {
        var frame = getFrame();
        if (!frame || !frame.contentWindow) return;
        frame.contentWindow.postMessage({ type: "learnsys-key", key: key, code: key, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false }, "*");
    }
    function makeScreenButton(id, side, label) {
        var b = document.createElement("button");
        b.type = "button";
        b.id = id;
        b.textContent = label;
        b.setAttribute("style", "position:fixed;bottom:14px;" + side + ":14px;z-index:2147483647;display:none;align-items:center;justify-content:center;min-width:120px;min-height:44px;padding:0 16px;border:1px solid #4f8b3c;background:#63a44b;color:#fff;font:600 15px/1 'Open Sans',system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 14px rgba(0,20,30,.18)");
        document.body.appendChild(b);
        return b;
    }
    function ensureScreenNav() {
        var prev = document.getElementById("asanai-screen-prev");
        var next = document.getElementById("asanai-screen-next");
        if (!prev) prev = makeScreenButton("asanai-screen-prev", "left", "← Zurück");
        if (!next) next = makeScreenButton("asanai-screen-next", "right", "Weiter →");
        function apply() {
            prev.style.display = (screenNav.ready && screenNav.prev) ? "inline-flex" : "none";
            next.style.display = (screenNav.ready && screenNav.next) ? "inline-flex" : "none";
        }
        prev.addEventListener("click", function () { sendKey("ArrowLeft"); });
        next.addEventListener("click", function () { sendKey("ArrowRight"); });
        window.addEventListener("message", function (event) {
            if (!event.data || event.data.type !== "ls-nav-state") return;
            screenNav.prev = !!event.data.prev;
            screenNav.next = !!event.data.next;
            screenNav.ready = true;
            apply();
        });
        window.__asanaiApplyScreenNav = function () { screenNav.ready = true; apply(); };
        apply();
    }

    function attachHeight(frame) {
        if (!frame || frame.__asanaiHeightBound) return;
        frame.__asanaiHeightBound = true;

        window.addEventListener("message", function (event) {
            if (!event.data) return;
            if (event.source && frame.contentWindow && event.source !== frame.contentWindow) return;
            if (event.data.type === "lesson-ready") { hideLoader(); return; }
            if (event.data.type !== "height") return;
            var height = parseInt(event.data.val, 10);
            if (height > 0) frame.style.height = height + "px";
            hideLoader();
        }, false);
    }

    var forwardKeys = {
        ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1,
        PageUp: 1, PageDown: 1, Home: 1, End: 1,
        " ": 1, Spacebar: 1, Escape: 1,
        "?": 1, "+": 1, "=": 1, "-": 1,
        "0": 1, "1": 1, "2": 1, "3": 1, "4": 1,
        "5": 1, "6": 1, "7": 1, "8": 1, "9": 1,
        h: 1, H: 1, r: 1, R: 1, f: 1, F: 1, e: 1, E: 1, d: 1, D: 1
    };

    function isEditable(el) {
        if (!el || el.nodeType !== 1) return false;
        var tag = (el.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return true;
        return !!el.isContentEditable;
    }

    function attachKeys() {
        if (window.__asanaiLessonKeysBound) return;
        window.__asanaiLessonKeysBound = true;

        // Capture phase on window: run before theme/navigation handlers and
        // stop them from reacting to the same arrow keys.
        window.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing) return;
            if (event.ctrlKey || event.metaKey) return;
            if (isEditable(event.target)) return;

            var key = event.key;
            if (!forwardKeys[key] && !(event.altKey && key === "0")) return;

            var frame = getFrame();
            if (!frame || !frame.contentWindow) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
            frame.contentWindow.postMessage({
                type: "learnsys-key",
                key: key,
                code: event.code || "",
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey
            }, "*");
        }, true);
    }

    function cacheBustFrame(frame) {
        if (!frame) return;
        var raw = frame.getAttribute("src");
        if (!raw || /[?&]build=/.test(raw)) return;
        var build = "";
        try {
            var ttl = parseInt(window.ASANAI_BUILD_TTL || "900000", 10);
            if (!ttl || ttl < 60000) ttl = 900000;
            var key = "asanai_embed_build";
            var saved = parseInt(localStorage.getItem(key) || "0", 10) || 0;
            if (!saved || (Date.now() - saved) > ttl) {
                saved = Date.now();
                localStorage.setItem(key, String(saved));
            }
            build = String(saved);
        } catch (e) {
            build = String(Date.now());
        }
        if (frame.getAttribute("data-build")) build = frame.getAttribute("data-build");
        frame.setAttribute("src", raw + (raw.indexOf("?") >= 0 ? "&" : "?") + "build=" + encodeURIComponent(build));
    }

    function init() {
        ensureLoader();
        ensureScreenNav();
        var frame = getFrame();
        cacheBustFrame(frame);
        attachHeight(frame);
        attachKeys();
        if (frame) {
            frame.addEventListener("load", function () { setTimeout(hideLoader, 250); });
            try {
                if (frame.contentDocument && frame.contentDocument.readyState === "complete") setTimeout(hideLoader, 250);
            } catch (e) {}
        }
        setTimeout(hideLoader, 12000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
