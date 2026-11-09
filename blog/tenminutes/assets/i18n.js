/* TEN MINUTES — bilingual overlay with live switching. One HTML tree, per-page German strings. */
(function () {
	"use strict";

	var dataEl = document.getElementById("tm-i18n");
	if (!dataEl) return;

	var data;
	try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
	var de = data.de || {};
	var blocks = de.blocks || {};
	var texts = de.texts || {};
	var attrs = de.attrs || {};
	var current = data.lang === "de" ? "de" : "en";
	var contentLang = "en";
	var applying = false;

	var originals = {
		html: new WeakMap(),
		text: new WeakMap(),
		attrs: new WeakMap()
	};
	var changed = { html: [], text: [], attrs: [] };

	var enTitle = document.title;
	var descMeta = document.querySelector('meta[name="description"]');
	var enDescription = descMeta ? descMeta.getAttribute("content") : "";

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

	var ATTR_NAMES = [
		"aria-label", "alt", "title", "placeholder", "data-image-caption",
		"data-image-alt", "data-title", "data-body", "data-href-label", "data-meta"
	];

	function norm(value) {
		return String(value).replace(/\s+/g, " ").trim();
	}

	function skip(el) {
		return !el || !el.closest || el.closest(
			"script,style,code,pre,textarea,math,[data-tex],[data-no-i18n],.no-i18n,.full-article,#tm-lang-switch"
		);
	}

	function rememberHtml(el) {
		if (!originals.html.has(el)) {
			originals.html.set(el, el.innerHTML);
			changed.html.push(el);
		}
	}

	function rememberText(node) {
		if (!originals.text.has(node)) {
			originals.text.set(node, node.nodeValue);
			changed.text.push(node);
		}
	}

	function rememberAttr(el, name, value) {
		var map = originals.attrs.get(el);
		if (!map) {
			map = {};
			originals.attrs.set(el, map);
			changed.attrs.push(el);
		}
		if (!(name in map)) map[name] = value;
	}

	function translateAttrs(el, record) {
		if (skip(el)) return;
		ATTR_NAMES.forEach(function (name) {
			if (!el.hasAttribute(name)) return;
			var value = el.getAttribute(name);
			var key = norm(value);
			if (attrs[key] == null || value === attrs[key]) return;
			if (record) rememberAttr(el, name, value);
			el.setAttribute(name, attrs[key]);
		});
	}

	function translateTextNode(node, record) {
		var raw = node.nodeValue;
		if (!raw || !/\S/.test(raw)) return;
		var match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
		if (!match) return;
		var key = norm(match[2]);
		if (texts[key] == null || match[2] === texts[key]) return;
		if (record) rememberText(node);
		node.nodeValue = match[1] + texts[key] + match[3];
	}

	function translateElement(el, record) {
		if (!(el instanceof Element) || skip(el)) return;
		if (el.matches(BLOCK_SELECTOR)) {
			var html = norm(el.innerHTML);
			if (blocks[html] != null && html !== blocks[html]) {
				if (record) rememberHtml(el);
				el.innerHTML = blocks[html];
				return;
			}
		}
		translateAttrs(el, record);
		for (var child = el.firstChild; child; child = child.nextSibling) {
			if (child.nodeType === 3) translateTextNode(child, record);
			else if (child.nodeType === 1) translateElement(child, record);
		}
	}

	function clearOriginals() {
		originals = { html: new WeakMap(), text: new WeakMap(), attrs: new WeakMap() };
		changed = { html: [], text: [], attrs: [] };
	}

	function applyGerman() {
		clearOriginals();
		translateElement(document.body, true);
	}

	function restoreEnglish() {
		changed.html.forEach(function (el) {
			var html = originals.html.get(el);
			if (html != null) el.innerHTML = html;
		});
		changed.text.forEach(function (node) {
			var text = originals.text.get(node);
			if (text != null) node.nodeValue = text;
		});
		changed.attrs.forEach(function (el) {
			var map = originals.attrs.get(el);
			if (!map) return;
			Object.keys(map).forEach(function (name) { el.setAttribute(name, map[name]); });
		});
		clearOriginals();
	}

	function rewriteLinks() {
		var dir = location.pathname.replace(/[^/]*$/, "");
		document.querySelectorAll("a[href]").forEach(function (link) {
			var href = link.getAttribute("href");
			if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:|data:)/i.test(href)) return;
			var url;
			try { url = new URL(href, location.href); } catch (e) { return; }
			if (url.origin !== location.origin || url.pathname.indexOf(dir) !== 0) return;
			if (current === "de") url.searchParams.set("lang", "de");
			else url.searchParams.delete("lang");
			var next = url.pathname + url.search + url.hash;
			if (href !== next) link.setAttribute("href", next);
		});
	}

	function updateSwitcher() {
		var wrap = document.getElementById("tm-lang-switch");
		if (!wrap) return;
		wrap.setAttribute("aria-label", current === "de" ? "Sprache wechseln" : "Switch language");
		wrap.querySelectorAll("[data-lang]").forEach(function (btn) {
			var on = btn.getAttribute("data-lang") === current;
			btn.classList.toggle("is-on", on);
			btn.setAttribute("aria-pressed", on ? "true" : "false");
			var label = btn.getAttribute("data-lang") === "de" ? "Deutsch" : "English";
			btn.setAttribute("title", label);
			var img = btn.querySelector("img");
			if (img) img.alt = label;
		});
	}

	function updateLangOnly() {
		document.querySelectorAll(".tm-lang-only-en").forEach(function (el) {
			el.classList.toggle("tm-lang-hidden", current === "de");
		});
		document.querySelectorAll(".tm-lang-only-de").forEach(function (el) {
			el.classList.toggle("tm-lang-hidden", current !== "de");
		});
	}

	function applyState(lang) {
		current = lang;
		document.documentElement.lang = lang;
		document.title = lang === "de" && de.title ? de.title : enTitle;
		var meta = document.querySelector('meta[name="description"]');
		var description = lang === "de" && de.description ? de.description : enDescription;
		if (meta && description) meta.setAttribute("content", description);
		updateLangOnly();
		updateSwitcher();
		rewriteLinks();
	}

	function apply(lang) {
		lang = lang === "de" ? "de" : "en";
		if (lang === "de" && contentLang !== "de") {
			applyGerman();
			contentLang = "de";
		} else if (lang === "en" && contentLang === "de") {
			restoreEnglish();
			contentLang = "en";
		}
		applyState(lang);
	}

	function buildSwitcher() {
		if (document.getElementById("tm-lang-switch")) return;
		var wrap = document.createElement("div");
		wrap.id = "tm-lang-switch";
		wrap.className = "tm-lang-switch";
		wrap.setAttribute("role", "group");
		wrap.innerHTML =
			'<button type="button" data-lang="de" aria-pressed="false" title="Deutsch">' +
				'<img src="assets/icons/german.svg" alt="Deutsch">' +
			'</button>' +
			'<button type="button" data-lang="en" aria-pressed="true" title="English">' +
				'<img src="assets/icons/english.svg" alt="English">' +
			'</button>';
		wrap.addEventListener("click", function (event) {
			var btn = event.target && event.target.closest ? event.target.closest("[data-lang]") : null;
			if (!btn || !window.TM || !TM.setLang) return;
			TM.setLang(btn.getAttribute("data-lang"));
		});
		document.body.appendChild(wrap);
		updateSwitcher();
	}

	function start() {
		buildSwitcher();
		apply(current);

		var observer = new MutationObserver(function (mutations) {
			if (applying) return;
			applying = true;
			if (contentLang === "de") {
				mutations.forEach(function (mutation) {
					if (mutation.type === "childList") {
						mutation.addedNodes.forEach(function (node) {
							if (node.nodeType === 1) translateElement(node, false);
							else if (node.nodeType === 3) translateTextNode(node, false);
						});
					} else if (mutation.type === "characterData") {
						translateTextNode(mutation.target, false);
					} else if (mutation.type === "attributes") {
						if (mutation.attributeName !== "href") translateElement(mutation.target, false);
					}
				});
			}
			applying = false;
			rewriteLinks();
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ATTR_NAMES.concat(["href"])
		});
	}

	if (window.TM) {
		TM.i18n = {
			apply: apply,
			current: function () { return contentLang; }
		};
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
	else start();
})();
