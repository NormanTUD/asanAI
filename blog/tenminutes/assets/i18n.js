/* TEN MINUTES — bilingual overlay. One HTML tree, per-page German strings. */
(function () {
	"use strict";

	var dataEl = document.getElementById("tm-i18n");
	if (!dataEl) return;

	var data;
	try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
	var lang = data.lang === "de" ? "de" : "en";
	var blocks = data.blocks || {};
	var texts = data.texts || {};
	var attrs = data.attrs || {};
	var applying = false;

	try { localStorage.setItem("tm_lang", lang); } catch (e) {}
	document.cookie = "tm_lang=" + lang + "; path=/; SameSite=Lax";
	document.documentElement.lang = lang;

	var BLOCK_SELECTOR = [
		"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "figcaption",
		".kicker", ".section-title", ".section-kicker", ".week-label",
		".aha-big", ".aha-sub", ".demo-title", ".demo-sub", ".demo-insight",
		".keypoint", ".day-card h3", ".day-card p", ".dc-open", ".dc-tag",
		".dc-part", ".dc-num", ".sp-title", ".sp-kicker", ".dp-title", ".dp-sub",
		".calendar-notice h3", ".calendar-notice p",
		".full-article-kicker", ".full-article-main", ".lesson-card h3",
		".lesson-card p", ".lc-part", ".shelf-card .sc-title",
		".shelf-card .sc-desc", ".path-card h3", ".path-card p",
		".tl-name", ".tl-date", ".ism-title", ".ism-body", ".step-out",
		".step-note", ".ffn-col-head", ".res-legend", ".pos-note"
	].join(",");

	function norm(value) {
		return String(value).replace(/\s+/g, " ").trim();
	}

	function skip(el) {
		return !el || !el.closest || el.closest("script,style,code,pre,textarea,math,[data-tex],[data-no-i18n],.no-i18n");
	}

	function translateAttrs(el) {
		if (skip(el)) return;
		["aria-label", "alt", "title", "placeholder", "data-image-caption", "data-image-alt", "data-title", "data-body", "data-href-label", "data-meta"].forEach(function (name) {
			if (!el.hasAttribute(name)) return;
			var value = el.getAttribute(name);
			var key = norm(value);
			if (attrs[key] != null) el.setAttribute(name, attrs[key]);
		});
	}

	function translateTextNode(node) {
		var raw = node.nodeValue;
		if (!raw || !/\S/.test(raw)) return;
		var match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
		if (!match) return;
		var key = norm(match[2]);
		if (texts[key] != null) node.nodeValue = match[1] + texts[key] + match[3];
	}

	function translateElement(el) {
		if (!(el instanceof Element) || skip(el)) return;
		if (el.matches(BLOCK_SELECTOR)) {
			var html = norm(el.innerHTML);
			if (blocks[html] != null) {
				el.innerHTML = blocks[html];
				return;
			}
		}
		translateAttrs(el);
		for (var child = el.firstChild; child; child = child.nextSibling) {
			if (child.nodeType === 3) translateTextNode(child);
			else if (child.nodeType === 1) translateElement(child);
		}
	}

	var rewriting = false;
	function rewriteLinks() {
		if (rewriting) return;
		rewriting = true;
		var dir = location.pathname.replace(/[^/]*$/, "");
		document.querySelectorAll("a[href]").forEach(function (link) {
			var href = link.getAttribute("href");
			if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:|data:)/i.test(href)) return;
			var url;
			try { url = new URL(href, location.href); } catch (e) { return; }
			if (url.origin !== location.origin || url.pathname.indexOf(dir) !== 0) return;
			if (lang === "de") url.searchParams.set("lang", "de");
			else url.searchParams.delete("lang");
			var next = url.pathname + url.search + url.hash;
			if (href !== next) link.setAttribute("href", next);
		});
		rewriting = false;
	}

	function apply() {
		rewriteLinks();
		if (lang !== "de") return;
		applying = true;
		if (data.title) document.title = data.title;
		if (data.description) {
			var meta = document.querySelector('meta[name="description"]');
			if (meta) meta.setAttribute("content", data.description);
		}
		translateElement(document.body);
		applying = false;
	}

	function start() {
		apply();
		var observer = new MutationObserver(function (mutations) {
			if (applying) return;
			applying = true;
			mutations.forEach(function (mutation) {
				if (mutation.type === "childList") {
					mutation.addedNodes.forEach(function (node) {
						if (node.nodeType === 1) translateElement(node);
						else if (node.nodeType === 3) translateTextNode(node);
					});
				} else if (mutation.type === "characterData") {
					translateTextNode(mutation.target);
				} else if (mutation.type === "attributes") {
					if (mutation.attributeName !== "href") translateElement(mutation.target);
				}
			});
			applying = false;
			rewriteLinks();
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["aria-label", "alt", "title", "placeholder", "data-image-caption", "data-image-alt", "data-title", "data-body", "data-href-label", "data-meta", "href"]
		});
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else start();
})();
