/*
 * WordPress embed bridge for the "One Word at a Time" lesson (eoy split).
 *
 * Load it from the lesson folder through the proxy:
 *   <script src="/asanai_blog_proxy.php?eoy/wordpress-embed.js"></script>
 *
 * It must be loaded after the iframe markup. It:
 *  - honours an explicit height=... query parameter, otherwise keeps the
 *    iframe viewport-sized so the lesson scrolls internally and its own
 *    prev/next buttons stay visible,
 *  - resizes the iframe from the { type: "height" } messages (a fixed-height
 *    iframe reports its viewport height, so the CSS height wins),
 *  - forwards arrow keys and lesson shortcuts into the iframe,
 *    so navigation works without clicking the iframe first.
 *
 * The prev/next buttons and the loading spinner belong inside the lesson
 * page. Do not add fixed overlays to the parent page: they would cover the
 * whole WordPress page instead of just the iframe.
 */
(function () {
    "use strict";

    var FRAME_ID = "asanai-final-iframe";
    var KEY_ATTR = "data-asanai-lesson";

    function getFrame() {
        return document.getElementById(FRAME_ID)
            || document.querySelector("iframe[" + KEY_ATTR + "]");
    }

    function removeLegacyLoader() {
        var el = document.getElementById("asanai-screen-loader");
        if (el && el.parentNode) el.parentNode.removeChild(el);
        var style = document.getElementById("asanai-screen-spin-style");
        if (style && style.parentNode) style.parentNode.removeChild(style);
    }

    function viewportHeight() {
        return Math.min(1100, Math.max(420, Math.round((window.innerHeight || 800) * 0.9)));
    }

    function normalizeFrameSize(frame) {
        if (!frame) return;
        var raw = frame.getAttribute("src") || "";
        var match = raw.match(/[?&]height=(\d+)/i);
        var paramHeight = match ? parseInt(match[1], 10) : 0;
        if (paramHeight > 0) {
            frame.style.height = paramHeight + "px";
            return;
        }
        var cssHeight = parseInt(frame.style.height, 10) || frame.offsetHeight || 0;
        var limit = viewportHeight();
        if (cssHeight > limit) frame.style.height = limit + "px";
    }

    function attachHeight(frame) {
        if (!frame || frame.__asanaiHeightBound) return;
        frame.__asanaiHeightBound = true;

        window.addEventListener("message", function (event) {
            if (!event.data) return;
            if (event.source && frame.contentWindow && event.source !== frame.contentWindow) return;
            if (event.data.type !== "height") return;
            var height = parseInt(event.data.val, 10);
            if (height > 0) frame.style.height = height + "px";
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
        removeLegacyLoader();
        var frame = getFrame();
        normalizeFrameSize(frame);
        cacheBustFrame(frame);
        attachHeight(frame);
        attachKeys();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
