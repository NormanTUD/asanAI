/*
 * Load an eoy lesson into a normal <div> instead of an iframe.
 *
 *   <div id="asanai-eoy-embed" data-src="eoy/1?lang=de" data-height="1500"></div>
 *   <script src="/asanai_blog_proxy.php?eoy/div-embed.js"></script>
 *
 * The script fetches the lesson through the proxy, scopes its CSS under the
 * target div, injects the lesson markup and loads the lesson scripts in order.
 * The spinner and all fixed-position lesson chrome stay inside the div.
 */
(function () {
  "use strict";

  var scriptEl = document.currentScript;
  if (!scriptEl) {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (/div-embed\.js(?:\?|$)/.test(scripts[i].src || "")) { scriptEl = scripts[i]; break; }
    }
  }
  if (!scriptEl) return;

  function whenReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function scopeCss(css, rootSelector) {
    var i = 0, n = css.length, out = "";
    function isSpace(c) { return c === " " || c === "\n" || c === "\t" || c === "\r" || c === "\f"; }
    function skipComment() {
      if (css[i] === "/" && css[i + 1] === "*") {
        var end = css.indexOf("*/", i + 2);
        if (end === -1) { out += css.slice(i); i = n; return true; }
        out += css.slice(i, end + 2); i = end + 2; return true;
      }
      return false;
    }
    function readUntil(chars) {
      var start = i, paren = 0, bracket = 0, quote = 0, comment = false;
      while (i < n) {
        var c = css[i];
        if (comment) { if (c === "*" && css[i + 1] === "/") { comment = false; i += 2; continue; } i++; continue; }
        if (quote) { if (c === "\\") { i += 2; continue; } if (c === quote) quote = 0; i++; continue; }
        if (c === "/" && css[i + 1] === "*") { comment = true; i += 2; continue; }
        if (c === '"' || c === "'") { quote = c; i++; continue; }
        if (c === "(") { paren++; i++; continue; }
        if (c === ")") { if (paren > 0) paren--; i++; continue; }
        if (c === "[") { bracket++; i++; continue; }
        if (c === "]") { if (bracket > 0) bracket--; i++; continue; }
        if (paren === 0 && bracket === 0 && chars.indexOf(c) !== -1) break;
        i++;
      }
      return css.slice(start, i);
    }
    function readBlock() {
      i++;
      var start = i, depth = 1, quote = 0, comment = false;
      while (i < n) {
        var c = css[i];
        if (comment) { if (c === "*" && css[i + 1] === "/") { comment = false; i += 2; continue; } i++; continue; }
        if (quote) { if (c === "\\") { i += 2; continue; } if (c === quote) quote = 0; i++; continue; }
        if (c === "/" && css[i + 1] === "*") { comment = true; i += 2; continue; }
        if (c === '"' || c === "'") { quote = c; i++; continue; }
        if (c === "{") { depth++; i++; continue; }
        if (c === "}") { depth--; if (depth === 0) { var body = css.slice(start, i); i++; return body; } i++; continue; }
        i++;
      }
      return css.slice(start);
    }
    function splitTopLevel(text) {
      var parts = [], start = 0, paren = 0, bracket = 0, quote = 0, comment = false;
      for (var j = 0; j < text.length; j++) {
        var c = text[j];
        if (comment) { if (c === "*" && text[j + 1] === "/") { comment = false; j++; } continue; }
        if (quote) { if (c === "\\") { j++; continue; } if (c === quote) quote = 0; continue; }
        if (c === "/" && text[j + 1] === "*") { comment = true; j++; continue; }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === "(") { paren++; continue; }
        if (c === ")") { if (paren > 0) paren--; continue; }
        if (c === "[") { bracket++; continue; }
        if (c === "]") { if (bracket > 0) bracket--; continue; }
        if (c === "," && paren === 0 && bracket === 0) { parts.push(text.slice(start, j)); start = j + 1; }
      }
      parts.push(text.slice(start));
      return parts;
    }
    function scopeOne(sel) {
      sel = sel.trim();
      if (!sel) return sel;
      sel = sel.replace(/(^|[\s>+~,(])html((?:\[[^\]]*\]|[.#][\w-]+)*)\s+body((?:\[[^\]]*\]|[.#][\w-]+)*)/gi,
        "$1html$2$3");
      sel = sel.replace(/(^|[\s>+~,(])html(?=[\s.#\[:>+~,)]|$)/gi, "$1" + rootSelector);
      sel = sel.replace(/(^|[\s>+~,(])body(?=[\s.#\[:>+~,)]|$)/gi, "$1" + rootSelector);
      sel = sel.replace(/:root\b/gi, rootSelector);
      if (sel.indexOf(rootSelector) !== 0) sel = rootSelector + " " + sel;
      return sel;
    }
    function scopeSelector(sel) {
      return splitTopLevel(sel).map(scopeOne).join(",");
    }
    while (i < n) {
      if (isSpace(css[i])) { out += css[i]; i++; continue; }
      if (skipComment()) continue;
      var prelude = readUntil("{;}");
      var term = css[i];
      if (term === ";") { out += prelude + ";"; i++; continue; }
      if (term === "}") { out += prelude; i++; continue; }
      if (term === undefined) { out += prelude; break; }
      var trimmed = prelude.trim();
      if (trimmed.charAt(0) === "@") {
        var name = (trimmed.match(/^@([\w-]+)/) || [])[1] || "";
        var body = readBlock();
        var lowerName = name.toLowerCase();
        var widthQuery = lowerName === "media"
          && /(?:min|max)-width\s*:|(?:^|[\s(])width\s*:/i.test(prelude)
          && !/prefers-|print|hover|pointer|resolution|orientation|scripting|color-scheme/i.test(prelude);
        if (widthQuery) {
          out += prelude.replace(/@media/i, "@container") + "{" + scopeCss(body, rootSelector) + "}";
        } else if (/^(media|supports|container|layer|document|-moz-document)$/i.test(name)) {
          out += prelude + "{" + scopeCss(body, rootSelector) + "}";
        } else {
          out += prelude + "{" + body + "}";
        }
      } else {
        var ruleBody = readBlock();
        out += scopeSelector(prelude) + "{" + ruleBody + "}";
      }
    }
    return out;
  }

  function resolveWithProxy(ref) {
    var cfg = window.__ASANAI_EOY_PROXY__;
    if (!cfg) return ref;
    try { return new URL(ref, cfg.base).href; } catch (e) { return ref; }
  }

  function settleLoadBar(root) {
    var bar = root && root.__asanaiLoadBar;
    if (!bar || bar.__asanaiDone) return;
    bar.__asanaiDone = true;
    bar.classList.add("is-done");
    setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 300);
  }

  function focusLoaderOnStage(root) {
    var loader = root.querySelector(".asanai-eoy-loader");
    var stage = root.querySelector(".ls-stage");
    if (!loader || !stage || !loader.parentNode) return;
    var rr = root.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    var st = loader.style;
    st.setProperty("left", (sr.left - rr.left) + "px", "important");
    st.setProperty("top", (sr.top - rr.top) + "px", "important");
    st.setProperty("width", sr.width + "px", "important");
    st.setProperty("height", sr.height + "px", "important");
    st.setProperty("right", "auto", "important");
    st.setProperty("bottom", "auto", "important");
  }

  function fitHeight(root) {
    var frame = root.__asanaiFrame;
    var maxHeight = root.__asanaiMaxHeight;
    if (!frame || !maxHeight) return;

    var scroller = root.querySelector(".ls-text-scroll");
    var textHeight = 0;
    if (scroller) {
      var sr = scroller.getBoundingClientRect();
      var origin = sr.top - scroller.scrollTop;
      var bottom = origin;
      Array.prototype.forEach.call(scroller.children, function (child) {
        if (getComputedStyle(child).display === "none") return;
        var r = child.getBoundingClientRect();
        if (r.height > 0) bottom = Math.max(bottom, r.bottom);
      });
      var padBottom = parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
      textHeight = Math.max(0, bottom - origin + padBottom);
    }

    var head = root.querySelector(".ls-stage-head");
    var foot = root.querySelector(".ls-stage-foot");
    var chrome = (head ? head.getBoundingClientRect().height : 0)
      + (foot ? foot.getBoundingClientRect().height : 0);
    var demo = root.querySelector(".ls-demo");
    var scene = demo ? demo.getAttribute("data-scene") : "";
    var demoHeight = root.__asanaiDemoHeight || (scene === "media" ? 780 : 600);
    demoHeight = Math.max(320, Math.min(demoHeight, maxHeight));
    var stageHeight = demoHeight + chrome;

    var width = root.getBoundingClientRect().width || frame.getBoundingClientRect().width || 0;
    var wanted;
    if (width <= 720) wanted = stageHeight;
    else if (width <= 980) wanted = textHeight + stageHeight + 1;
    else wanted = Math.max(textHeight, stageHeight);

    var fit = Math.max(320, Math.min(maxHeight, Math.round(wanted)));
    if (fit >= maxHeight - 8) fit = maxHeight;
    if (Math.abs(fit - maxHeight) < 2) return;

    frame.style.height = fit + "px";
    root.style.height = fit + "px";
    focusLoaderOnStage(root);
    window.dispatchEvent(new Event("resize"));
  }

  function start() {
    var target = document.querySelector(scriptEl.getAttribute("data-target") || "#asanai-eoy-embed");
    if (!target) return;
    if (target.getAttribute("data-asanai-eoy-loaded")) return;
    target.setAttribute("data-asanai-eoy-loaded", "1");

    var rawSrc = target.getAttribute("data-src") || scriptEl.getAttribute("data-src") || "eoy/1?lang=de";
    var heightAttr = target.getAttribute("data-height") || scriptEl.getAttribute("data-height") || "";
    var heightFromSrc = (rawSrc.match(/[?&]height=(\d+)/i) || [])[1] || "";
    var lang = target.getAttribute("data-lang") || scriptEl.getAttribute("data-lang")
      || (rawSrc.match(/[?&]lang=(de|en)\b/i) || [])[1] || "";
    var src = rawSrc.replace(/^\?/, "").replace(/([?&])height=\d+/ig, "$1")
      .replace(/\?&/g, "?").replace(/&&+/g, "&").replace(/[?&]+$/, "");
    var srcPath = src.split("?")[0];
    if (srcPath.indexOf("/") === -1) {
      src = "eoy/" + src;
      srcPath = "eoy/" + srcPath;
    }
    var lessonDir = srcPath.replace(/[^/]*$/, "");
    var height = heightAttr || heightFromSrc || "min(90vh, 1100px)";
    if (/^\d+$/.test(height)) height += "px";

    var scriptUrl = new URL(scriptEl.src, location.href);
    var proxySpec = scriptEl.getAttribute("data-proxy") || (scriptUrl.origin + scriptUrl.pathname);
    var proxyUrl = new URL(proxySpec, location.href);
    var proxyBaseAbs = proxyUrl.origin + proxyUrl.pathname;
    function proxyFor(path) {
      return proxyBaseAbs + "?" + path;
    }
    var seq = (window.__asanaiEoySeq || 0) + 1;
    window.__asanaiEoySeq = seq;
    var rootId = "asanai-eoy-root-" + seq;
    var rootSelector = "#" + rootId;

    var frame = document.createElement("div");
    frame.className = "asanai-eoy-frame";
    frame.style.cssText = "position:relative;width:100%;height:" + height + ";min-height:0;max-height:none;container-type:size;";
    target.appendChild(frame);

    var root = document.createElement("div");
    root.id = rootId;
    root.className = "asanai-eoy-root";
    root.setAttribute("data-asanai-eoy-root", "1");
    root.setAttribute("data-theme", "light");
    root.style.cssText = "position:relative;width:100%;height:" + height + ";min-height:0;max-height:none;"
      + "overflow:hidden;contain:layout paint;isolation:isolate;box-sizing:border-box;";
    frame.appendChild(root);

    window.__ASANAI_EOY_EMBED__ = true;
    window.__ASANAI_EOY_ROOT__ = root;
    window.__ASANAI_EOY_LANG__ = (lang === "de" || lang === "en") ? lang : "";
    window.__ASANAI_EOY_PROXY__ = { base: proxyUrl.origin + proxyUrl.pathname, dir: lessonDir, origin: proxyUrl.origin };
    window.__lsPageReady = false;
    root.__asanaiFrame = frame;
    root.__asanaiMaxHeight = frame.getBoundingClientRect().height || 0;
    root.__asanaiDemoHeight = parseFloat(target.getAttribute("data-demo-height")
      || scriptEl.getAttribute("data-demo-height")) || 0;

    var loader = document.createElement("div");
    loader.className = "asanai-eoy-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    var spinner = document.createElement("div");
    spinner.className = "asanai-eoy-spinner";
    loader.appendChild(spinner);
    root.appendChild(loader);

    var baseCss = rootSelector + "{position:relative!important;display:block!important;width:100%!important;"
      + "min-height:0!important;max-height:none!important;"
      + "overflow:hidden!important;contain:layout paint!important;isolation:isolate!important;"
      + "box-sizing:border-box!important;background:#fff}"
      + rootSelector + " .ls-app{position:absolute!important;inset:0!important}"
      + rootSelector + " .asanai-eoy-loader{position:absolute!important;inset:0!important;"
      + "z-index:2147483647!important;display:flex!important;align-items:center!important;"
      + "justify-content:center!important;background:#fff!important;transition:opacity .25s ease!important}"
      + rootSelector + " .asanai-eoy-loader.is-done{opacity:0!important;pointer-events:none!important}"
      + rootSelector + " .asanai-eoy-spinner{width:40px!important;height:40px!important;"
      + "border:3px solid #dbe3e0!important;border-top-color:#63a44b!important;"
      + "border-radius:50%!important;animation:asanai-eoy-spin .8s linear infinite!important}"
      + "@keyframes asanai-eoy-spin{to{transform:rotate(360deg)}}"
      + ".asanai-eoy-loadbar{position:fixed;left:0;right:0;top:0;height:3px;z-index:2147483000;"
      + "pointer-events:none;overflow:hidden;background:rgba(0,75,111,.06);opacity:1;"
      + "transition:opacity .25s ease}"
      + ".asanai-eoy-loadbar i{display:block;width:35%;height:100%;"
      + "background:linear-gradient(90deg,#63a44b,#1275ac,#5c9baf);"
      + "animation:asanai-eoy-loadbar 1.15s ease-in-out infinite;transform:translateX(-120%)}"
      + ".asanai-eoy-loadbar.is-done{opacity:0}"
      + "@keyframes asanai-eoy-loadbar{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}";
    var baseStyle = document.createElement("style");
    baseStyle.setAttribute("data-asanai-eoy-base", "1");
    baseStyle.textContent = baseCss;
    document.head.appendChild(baseStyle);

    var loadBar = document.createElement("div");
    loadBar.className = "asanai-eoy-loadbar";
    loadBar.setAttribute("aria-hidden", "true");
    loadBar.appendChild(document.createElement("i"));
    document.body.appendChild(loadBar);
    root.__asanaiLoadBar = loadBar;

    function fail(message) {
      loader.classList.add("is-done");
      settleLoadBar(root);
      var note = document.createElement("p");
      note.textContent = message;
      note.style.cssText = "padding:20px;font:400 16px/1.5 system-ui,sans-serif;color:#2c464d;";
      root.appendChild(note);
      console.error("[asanai-eoy] " + message);
    }

    fetch(proxyFor(src), { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (html) { return boot(html); })
      .catch(function (error) { fail("Lesson could not be loaded (" + error.message + ")."); });

    function boot(html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      if (!doc.getElementById("learnsys")) throw new Error("lesson markup not found");

      var body = doc.body;
      Array.prototype.forEach.call(body.attributes, function (attr) {
        if (/^(class|style|id)$/i.test(attr.name) || /^on/i.test(attr.name)) return;
        if (/^data-/i.test(attr.name) || attr.name === "lang" || attr.name === "dir") {
          root.setAttribute(attr.name, attr.value);
        }
      });
      var htmlEl = doc.documentElement;
      root.setAttribute("data-theme", htmlEl.getAttribute("data-theme") || "light");
      if (htmlEl.getAttribute("lang")) root.setAttribute("lang", htmlEl.getAttribute("lang"));

      var cssEntries = [];
      Array.prototype.forEach.call(doc.head.children, function (el) {
        if (el.tagName === "LINK" && /(^|\s)stylesheet(\s|$)/i.test(el.getAttribute("rel") || "")) {
          cssEntries.push({ href: el.getAttribute("href") });
        } else if (el.tagName === "STYLE") {
          cssEntries.push({ text: el.textContent || "" });
        }
      });

      var headScripts = [];
      Array.prototype.forEach.call(doc.querySelectorAll("head script"), function (el) {
        if (!el.getAttribute("src") && (!el.type || /javascript|module/i.test(el.type))) {
          headScripts.push(el.textContent || "");
        }
      });

      return applyStyles(cssEntries).then(function () {
        injectBody(doc, root, loader);
        headScripts.forEach(runInline);
        if (typeof window.EOY_DAY !== "number") {
          var day = (srcPath.match(/(?:^|\/)(\d+)(?:\?|$)/) || [])[1];
          if (day) window.EOY_DAY = parseInt(day, 10);
        }
        return loadScripts(doc);
      }).then(function (errors) {
        if (errors.length) console.warn("[asanai-eoy] some scripts failed", errors);
        if (window.LearnSys && typeof window.LearnSys.go === "function") {
          try { window.LearnSys.go(0, 0, 0); } catch (error) {
            console.error("[asanai-eoy] demo re-render failed", error);
          }
        }
        return waitForLesson(root);
      }).then(function (ok) {
        if (!ok) {
          fail("Lesson did not finish loading.");
          return;
        }
        finish(root, loader);
      });
    }
  }

  function applyStyles(entries) {
    var fetches = entries.map(function (entry) {
      if (!entry.href) return Promise.resolve(entry.text || "");
      var url = resolveWithProxy(entry.href);
      return fetch(url, { credentials: "same-origin" })
        .then(function (response) { return response.ok ? response.text() : ""; })
        .catch(function () { return ""; });
    });
    return Promise.all(fetches).then(function (texts) {
      var root = window.__ASANAI_EOY_ROOT__;
      if (!root) return;
      var css = texts.map(function (text) { return scopeCss(text, "#" + root.id); }).join("\n")
        .replace(/(\d*\.?\d+)(vw|vh)\b/g, function (match, number, unit) { return number + "cq" + unit; });
      var style = document.createElement("style");
      style.setAttribute("data-asanai-eoy-css", "1");
      style.textContent = css;
      document.head.appendChild(style);

      var layoutStyle = document.createElement("style");
      layoutStyle.setAttribute("data-asanai-eoy-layout", "1");
      layoutStyle.textContent = "#" + root.id + " .ls-body{max-width:none!important}"
        + "#" + root.id + " .ls-text-scroll{max-width:none!important}"
        + "@container (min-width:721px) and (max-width:980px){#" + root.id
        + " .ls-main{display:flex!important;flex-direction:column!important}"
        + "#" + root.id + " .ls-text{flex:0 0 auto!important;max-height:60%!important}"
        + "#" + root.id + " .ls-text-scroll{height:100%!important}"
        + "#" + root.id + " .ls-stage{flex:1 1 0!important;min-height:0!important}}";
      document.head.appendChild(layoutStyle);
    });
  }

  function injectBody(doc, root, loader) {
    var body = doc.body;
    var fragment = document.createDocumentFragment();
    Array.prototype.forEach.call(body.childNodes, function (node) {
      if (node.nodeType === 1) {
        var tag = node.tagName;
        if (tag === "SCRIPT") return;
        if (node.id === "ls-page-loader" || node.id === "asanai-screen-loader") return;
      }
      fragment.appendChild(document.importNode(node, true));
    });
    root.insertBefore(fragment, loader);
  }

  function runInline(code) {
    if (!code || !code.trim()) return;
    var script = document.createElement("script");
    script.text = code;
    document.head.appendChild(script);
    script.parentNode.removeChild(script);
  }

  function loadScripts(doc) {
    var errors = [];
    var seen = {};
    var list = Array.prototype.slice.call(doc.querySelectorAll("script[src]"));
    var earlyOrder = ["site.js", "learnsys-visuals.js", "learnsys-scene-kit.js", "learnsys.js", "data.js"];
    function baseName(src) {
      var path = String(src || "").split("?")[0];
      return path.slice(path.lastIndexOf("/") + 1);
    }
    function skip(src) {
      return /\/frame-height\.js(?:\?|$)/i.test(src) || /\/nav-fix\.js(?:\?|$)/i.test(src)
        || /\/wordpress-embed\.js(?:\?|$)/i.test(src);
    }
    var early = [], rest = [];
    list.forEach(function (el) {
      var src = el.getAttribute("src");
      if (!src || skip(src)) return;
      if (earlyOrder.indexOf(baseName(src)) >= 0) early.push(el);
      else rest.push(el);
    });
    early.sort(function (a, b) {
      return earlyOrder.indexOf(baseName(a.getAttribute("src")))
        - earlyOrder.indexOf(baseName(b.getAttribute("src")));
    });
    function loadOne(el) {
      var src = el.getAttribute("src");
      if (!src || seen[src]) return Promise.resolve();
      seen[src] = true;
      var url = resolveWithProxy(src);
      if (!url) { errors.push(src); return Promise.resolve(); }
      return new Promise(function (resolve) {
        var script = document.createElement("script");
        script.src = url;
        script.async = false;
        script.onload = function () { script.parentNode && script.parentNode.removeChild(script); resolve(); };
        script.onerror = function () {
          script.parentNode && script.parentNode.removeChild(script);
          errors.push(url);
          resolve();
        };
        document.head.appendChild(script);
      });
    }
    function run(group) {
      return group.reduce(function (chain, el) {
        return chain.then(function () { return loadOne(el); });
      }, Promise.resolve());
    }
    return run(early).then(function () {
      var root = window.__ASANAI_EOY_ROOT__;
      if (root) focusLoaderOnStage(root);
      return run(rest);
    }).then(function () { return errors; });
  }

  function waitForLesson(root) {
    var started = Date.now();
    return new Promise(function (resolve) {
      (function check() {
        if (window.LearnSys && root.querySelector("#ls-title")) { focusLoaderOnStage(root); return resolve(true); }
        if (Date.now() - started > 20000) return resolve(false);
        setTimeout(check, 100);
      })();
    });
  }

  function finish(root, loader) {
    if (root.__asanaiFinished) return;
    root.__asanaiFinished = true;
    try {
      if (window.TM && typeof window.TM.initPage === "function" && !root.__asanaiPageInit) {
        root.__asanaiPageInit = true;
        window.TM.initPage();
      }
    } catch (error) {
      console.error("[asanai-eoy] initPage failed", error);
    }
    root.classList.add("ls-loaded");
    window.__lsPageReady = true;
    var settle = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([settle, new Promise(function (resolve) { setTimeout(resolve, 1500); })]).then(function () {
      fitHeight(root);
      setTimeout(function () {
        loader.classList.add("is-done");
        settleLoadBar(root);
        setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 300);
      }, 30);
    });
  }

  whenReady(start);
})();
