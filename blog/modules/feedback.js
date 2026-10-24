/* Reader feedback on a selected passage.
 *
 * The panel is anchored to the right of the paragraph (never at the
 * cursor). All data stays local until the reader presses Send. Bug
 * reports attach console output/recent clicks only after explicit
 * consent. The optional email is remembered in localStorage only when
 * the reader ticks "Remember on this device".
 */
(function () {
	"use strict";

	var EMAIL_KEY = "mn_feedback_email";
	var BLOCK_SELECTOR = "p, li, h2, h3, h4, h5, h6, blockquote, pre, figure, table, figcaption, .cl-eq, .cl-block";
	var BLOCK_QUERY = BLOCK_SELECTOR.split(",").map(function (part) {
		return "#contents .md " + part.trim();
	}).join(", ");
	var SKIP_CLOSEST = ".sidenote-source, .sideimage-source, .toc, nav, .mn-quiz, .mn-feedback-layer, button, input, textarea, select, [contenteditable='true']";

	var cfg = window.__MNFeedback;
	if (!cfg || !cfg.enabled || !cfg.endpoint) {
		return;
	}

	var contents = null;

	var layer = null;
	var panel = null;
	var body = null;
	var successEl = null;
	var quoteEl = null;
	var reactionWrap = null;
	var commentEl = null;
	var emailEl = null;
	var rememberEl = null;
	var forgetEl = null;
	var bugBox = null;
	var bugConsentEl = null;
	var statusEl = null;
	var sendBtn = null;

	var reaction = "";
	var pending = null;
	var formKey = "";
	var open = false;
	var busy = false;
	var positionRaf = 0;
	var closeTimer = 0;
	var started = false;
	var lastSelectionEvent = 0;
	var keyboardSelection = false;

	function start() {
		if (started) {
			return;
		}
		contents = contents || document.getElementById("contents");
		if (!contents) {
			return;
		}
		started = true;
		build();
		bind();
	}

	function build() {
		if (panel) {
			return;
		}
		layer = document.createElement("div");
		layer.id = "mn-feedback-layer";
		layer.hidden = true;

		panel = document.createElement("div");
		panel.className = "mn-feedback-panel";
		panel.setAttribute("role", "dialog");
		panel.setAttribute("aria-modal", "false");
		panel.setAttribute("aria-label", "Reader feedback");
		panel.hidden = true;

		var head = document.createElement("div");
		head.className = "mnf-head";
		var kicker = document.createElement("span");
		kicker.className = "mnf-kicker";
		kicker.textContent = "Reader feedback";
		var close = document.createElement("button");
		close.type = "button";
		close.className = "mnf-close";
		close.setAttribute("aria-label", "Close feedback");
		close.textContent = "×";
		close.addEventListener("click", closePanel);
		head.appendChild(kicker);
		head.appendChild(close);

		body = document.createElement("div");
		body.className = "mnf-body";

		quoteEl = document.createElement("blockquote");
		quoteEl.className = "mnf-quote";

		reactionWrap = document.createElement("div");
		reactionWrap.className = "mnf-reactions";
		reactionWrap.setAttribute("role", "group");
		reactionWrap.setAttribute("aria-label", "What kind of feedback is this?");
		var reactions = Array.isArray(cfg.reactions) ? cfg.reactions : [];
		reactions.forEach(function (item) {
			if (!item || !item.key) {
				return;
			}
			var btn = document.createElement("button");
			btn.type = "button";
			btn.className = "mnf-reaction";
			btn.setAttribute("data-reaction", String(item.key));
			btn.setAttribute("aria-pressed", "false");
			btn.title = String(item.label || item.key);
			btn.setAttribute("aria-label", String(item.label || item.key));
			var icon = document.createElement("span");
			icon.className = "mnf-reaction-icon";
			icon.setAttribute("aria-hidden", "true");
			icon.textContent = String(item.icon || "");
			var label = document.createElement("span");
			label.className = "mnf-reaction-label";
			label.textContent = String(item.label || item.key);
			btn.appendChild(icon);
			btn.appendChild(label);
			btn.addEventListener("click", function () {
				selectReaction(String(item.key));
			});
			reactionWrap.appendChild(btn);
		});

		commentEl = document.createElement("textarea");
		commentEl.className = "mnf-comment";
		commentEl.rows = 2;
		commentEl.maxLength = 6000;
		commentEl.placeholder = "Add a comment (optional)";
		commentEl.setAttribute("aria-label", "Comment on the selected passage");

		var emailRow = document.createElement("div");
		emailRow.className = "mnf-email";
		emailEl = document.createElement("input");
		emailEl.type = "email";
		emailEl.className = "mnf-email-input";
		emailEl.maxLength = 254;
		emailEl.autocomplete = "email";
		emailEl.placeholder = "Email (optional)";
		emailEl.setAttribute("aria-label", "Email address for a reply (optional)");
		var emailNote = document.createElement("div");
		emailNote.className = "mnf-note";
		emailNote.textContent = "Sent with this message so the editor can reply.";

		var rememberWrap = document.createElement("label");
		rememberWrap.className = "mnf-remember";
		rememberEl = document.createElement("input");
		rememberEl.type = "checkbox";
		var rememberText = document.createElement("span");
		rememberText.textContent = "Remember on this device";
		rememberWrap.appendChild(rememberEl);
		rememberWrap.appendChild(rememberText);

		forgetEl = document.createElement("button");
		forgetEl.type = "button";
		forgetEl.className = "mnf-forget";
		forgetEl.textContent = "Forget";
		forgetEl.hidden = true;

		emailRow.appendChild(emailEl);
		emailRow.appendChild(emailNote);
		emailRow.appendChild(rememberWrap);
		emailRow.appendChild(forgetEl);

		bugBox = document.createElement("label");
		bugBox.className = "mnf-bug";
		bugBox.hidden = true;
		bugConsentEl = document.createElement("input");
		bugConsentEl.type = "checkbox";
		var bugText = document.createElement("span");
		bugText.innerHTML = "<b>Attach console log and recent clicks</b><small>Only sent if you tick this box. It helps diagnose the problem.</small>";
		bugBox.appendChild(bugConsentEl);
		bugBox.appendChild(bugText);

		statusEl = document.createElement("span");
		statusEl.className = "mnf-status";
		statusEl.setAttribute("aria-live", "polite");

		sendBtn = document.createElement("button");
		sendBtn.type = "button";
		sendBtn.className = "mnf-send";
		sendBtn.textContent = "Send";
		sendBtn.disabled = true;
		sendBtn.addEventListener("click", send);

		var foot = document.createElement("div");
		foot.className = "mnf-foot";
		foot.appendChild(statusEl);
		foot.appendChild(sendBtn);

		body.appendChild(quoteEl);
		body.appendChild(reactionWrap);
		body.appendChild(commentEl);
		body.appendChild(emailRow);
		body.appendChild(bugBox);
		body.appendChild(foot);

		successEl = document.createElement("div");
		successEl.className = "mnf-success";
		successEl.hidden = true;
		var successIcon = document.createElement("div");
		successIcon.className = "mnf-success-icon";
		successIcon.setAttribute("aria-hidden", "true");
		successIcon.textContent = "✓";
		var successText = document.createElement("div");
		successText.className = "mnf-success-text";
		successText.textContent = "Thanks — the editor will see this.";
		successEl.appendChild(successIcon);
		successEl.appendChild(successText);

		panel.appendChild(head);
		panel.appendChild(body);
		panel.appendChild(successEl);
		layer.appendChild(panel);
		document.body.appendChild(layer);

		prefillEmail();
		bindPanel();
	}

	function bindPanel() {
		reactionWrap.addEventListener("keydown", function (event) {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
				return;
			}
			event.preventDefault();
			var buttons = Array.prototype.slice.call(reactionWrap.querySelectorAll(".mnf-reaction"));
			var index = buttons.indexOf(document.activeElement);
			if (index < 0) {
				buttons[0].focus();
				return;
			}
			index += event.key === "ArrowRight" ? 1 : -1;
			if (index < 0) index = buttons.length - 1;
			if (index >= buttons.length) index = 0;
			buttons[index].focus();
		});

		commentEl.addEventListener("input", updateSendState);
		emailEl.addEventListener("blur", saveEmailIfRemembered);
		rememberEl.addEventListener("change", function () {
			if (rememberEl.checked) {
				saveEmailIfRemembered();
			} else {
				clearStoredEmail();
			}
			updateForgetVisibility();
		});
		forgetEl.addEventListener("click", function () {
			clearStoredEmail();
			emailEl.value = "";
			rememberEl.checked = false;
			updateForgetVisibility();
			emailEl.focus();
		});
		bugConsentEl.addEventListener("change", function () {
			statusEl.textContent = "";
		});
	}

	function bind() {
		document.addEventListener("mouseup", function (event) {
			if (event.button !== 0) {
				return;
			}
			keyboardSelection = false;
			lastSelectionEvent = Date.now();
			setTimeout(checkSelection, 0);
		}, true);
		document.addEventListener("touchend", function () {
			keyboardSelection = false;
			lastSelectionEvent = Date.now();
			setTimeout(checkSelection, 380);
		}, true);
		document.addEventListener("keyup", function (event) {
			if (event.shiftKey || /^(Arrow|Home|End|Page)/.test(event.key)) {
				keyboardSelection = true;
				lastSelectionEvent = Date.now();
				setTimeout(checkSelection, 0);
			}
		}, true);
		document.addEventListener("selectionchange", function () {
			if (Date.now() - lastSelectionEvent < 120) {
				return;
			}
			clearTimeout(bind._selectionTimer);
			bind._selectionTimer = setTimeout(checkSelection, 260);
		});

		document.addEventListener("mousedown", function (event) {
			if (!open || !panel) {
				return;
			}
			if (panel.contains(event.target)) {
				return;
			}
			if (isDirty()) {
				return;
			}
			closePanel();
		}, true);

		document.addEventListener("keydown", function (event) {
			if (!open) {
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				closePanel();
				return;
			}
			if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
				event.preventDefault();
				send();
			}
		});

		window.addEventListener("scroll", schedulePosition, { passive: true });
		window.addEventListener("resize", schedulePosition);
		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", schedulePosition);
			window.visualViewport.addEventListener("scroll", schedulePosition);
		}
	}

	function checkSelection() {
		if (busy) {
			return;
		}
		if (open && panel && panel.contains(document.activeElement)) {
			return;
		}
		var sel = window.getSelection();
		if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
			return;
		}
		var text = String(sel.toString() || "").replace(/\u00a0/g, " ").trim();
		if (!text) {
			return;
		}
		var range;
		try {
			range = sel.getRangeAt(0);
		} catch (e) {
			return;
		}
		var node = range.startContainer;
		var el = node && node.nodeType === 1 ? node : node && node.parentElement;
		if (!el || !el.closest) {
			return;
		}
		if (el.closest("#mn-feedback-layer") || el.closest(SKIP_CLOSEST)) {
			return;
		}
		var md = el.closest("#contents .md");
		if (!md) {
			return;
		}
		var block = findBlock(el, md);
		if (!block) {
			return;
		}
		var info = capture(infoOf(block, md), sel, range, block, md);
		if (!info) {
			return;
		}
		if (open && pending && isDirty()) {
			if (pending.key === info.key) {
				pending = info;
				quoteEl.textContent = info.selectedText;
				applyHighlight(info.ranges);
			}
			return;
		}
		show(info);
	}

	function findBlock(el, md) {
		var block = el.closest(BLOCK_SELECTOR);
		if (block && md.contains(block)) {
			return block;
		}
		return md;
	}

	function infoOf(block, md) {
		var nav = window.__moduleNavData || {};
		var slug = slugOf(window.location.pathname);
		var mod = null;
		if (nav.modules && slug) {
			for (var i = 0; i < nav.modules.length; i++) {
				if (nav.modules[i] && nav.modules[i].slug === slug) {
					mod = nav.modules[i];
					break;
				}
			}
		}
		if (!mod && nav.modules && typeof nav.current === "number" && nav.current >= 0) {
			mod = nav.modules[nav.current] || null;
		}
		var partTitle = "";
		if (mod && nav.parts && nav.parts[mod.part]) {
			partTitle = String(nav.parts[mod.part].title || "");
		}
		var section = sectionFor(block);
		var sectionKey = section.title.toLowerCase()
			.replace(/[^a-z0-9äöüß]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 40) || "section";
		var blockIndex = blockIndexOf(block);
		return {
			slug: slug,
			lessonTitle: mod && mod.title ? String(mod.title) : String(document.title || ""),
			part: mod && mod.part ? Number(mod.part) : 0,
			partTitle: partTitle,
			sectionTitle: section.title,
			sectionAnchor: section.anchor,
			block: block,
			blockIndex: blockIndex,
			blockSelector: cssPath(block),
			blockKey: slug + ":" + sectionKey + ":" + blockIndex,
			key: slug + ":" + sectionKey + ":" + blockIndex
		};
	}

	function slugOf(pathname) {
		var path = String(pathname || "").replace(/\/+$/, "");
		var part = path.split("/").pop() || "index";
		return part.replace(/\.php$/, "") || "index";
	}

	function sectionFor(block) {
		var headings = [];
		try {
			headings = Array.prototype.slice.call(contents.querySelectorAll("h2, h3, h4"));
		} catch (e) {
			headings = [];
		}
		var last = null;
		headings.forEach(function (heading) {
			if (heading.closest(".toc, nav, .sidenote, .sideimage, .optional")) {
				return;
			}
			var pos = heading.compareDocumentPosition(block);
			if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
				last = heading;
			}
		});
		if (!last && /^H[2-4]$/.test(String(block.tagName || ""))) {
			last = block;
		}
		if (!last) {
			return { title: "", anchor: "" };
		}
		return {
			title: String(last.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200),
			anchor: String(last.id || "")
		};
	}

	function blockIndexOf(block) {
		var nodes;
		try {
			nodes = Array.prototype.slice.call(contents.querySelectorAll(BLOCK_QUERY));
		} catch (e) {
			nodes = [];
		}
		var index = nodes.indexOf(block);
		return index < 0 ? 0 : index;
	}

	function cssPath(el) {
		var parts = [];
		var node = el;
		while (node && node !== contents && node.nodeType === 1 && parts.length < 6) {
			var tag = String(node.tagName || "").toLowerCase();
			var parent = node.parentElement;
			if (parent) {
				var same = Array.prototype.filter.call(parent.children, function (child) {
					return child.tagName === node.tagName;
				});
				if (same.length > 1) {
					tag += ":nth-of-type(" + (same.indexOf(node) + 1) + ")";
				}
			}
			parts.unshift(tag);
			node = parent;
		}
		return parts.join(" > ");
	}

	function capture(info, sel, range, block, md) {
		var text = String(sel.toString() || "").replace(/\u00a0/g, " ").trim();
		if (!text) {
			return null;
		}
		var blockText = String(block.innerText || block.textContent || "").replace(/\u00a0/g, " ").trim();
		if (!blockText) {
			return null;
		}
		var start = offsetIn(block, range.startContainer, range.startOffset);
		var end = offsetIn(block, range.endContainer, range.endOffset);
		if (start === null || end === null) {
			start = 0;
			end = Math.min(text.length, blockText.length);
		}
		if (end < start) {
			end = start;
		}
		var html = "";
		try {
			var tmp = document.createElement("div");
			tmp.appendChild(range.cloneContents());
			html = tmp.innerHTML;
		} catch (e) {
			html = "";
		}
		var ranges = [];
		for (var i = 0; i < sel.rangeCount; i++) {
			try {
				ranges.push(sel.getRangeAt(i).cloneRange());
			} catch (e) { /* ignore */ }
		}
		var selectionRect = null;
		var blockRect = null;
		try {
			selectionRect = rectOf(range.getBoundingClientRect());
			blockRect = rectOf(block.getBoundingClientRect());
		} catch (e) { /* ignore */ }
		var direction = "forward";
		try {
			if (sel.anchorNode && sel.focusNode) {
				var anchorRange = document.createRange();
				anchorRange.setStart(sel.anchorNode, sel.anchorOffset);
				anchorRange.collapse(true);
				var focusRange = document.createRange();
				focusRange.setStart(sel.focusNode, sel.focusOffset);
				focusRange.collapse(true);
				direction = anchorRange.compareBoundaryPoints(Range.START_TO_START, focusRange) <= 0 ? "forward" : "backward";
			}
		} catch (e) {
			direction = "forward";
		}
		return {
			key: info.key,
			slug: info.slug,
			lessonTitle: info.lessonTitle,
			part: info.part,
			partTitle: info.partTitle,
			sectionTitle: info.sectionTitle,
			sectionAnchor: info.sectionAnchor,
			block: block,
			blockIndex: info.blockIndex,
			blockSelector: info.blockSelector,
			blockKey: info.blockKey,
			blockText: blockText.slice(0, 12000),
			blockHtml: String(block.innerHTML || "").slice(0, 30000),
			selectedText: text.slice(0, 4000),
			selectedHtml: html.slice(0, 20000),
			start: start,
			end: end,
			prefix: blockText.slice(Math.max(0, start - 80), start),
			suffix: blockText.slice(end, Math.min(blockText.length, end + 80)),
			blockTextLength: blockText.length,
			rangeCount: sel.rangeCount,
			direction: direction,
			ranges: ranges,
			selectionRect: selectionRect,
			blockRect: blockRect,
			scrollY: Math.max(0, Math.round(window.scrollY || window.pageYOffset || 0)),
			viewportW: Math.max(0, Math.round(window.innerWidth || 0)),
			viewportH: Math.max(0, Math.round(window.innerHeight || 0)),
			requestId: newRequestId()
		};
	}

	function offsetIn(block, container, offset) {
		try {
			if (!block.contains(container)) {
				return null;
			}
			var range = document.createRange();
			range.selectNodeContents(block);
			range.setEnd(container, offset);
			return range.toString().length;
		} catch (e) {
			return null;
		}
	}

	function rectOf(rect) {
		if (!rect) {
			return null;
		}
		return {
			x: Math.round(rect.x || rect.left || 0),
			y: Math.round(rect.y || rect.top || 0),
			top: Math.round(rect.top || 0),
			left: Math.round(rect.left || 0),
			right: Math.round(rect.right || 0),
			bottom: Math.round(rect.bottom || 0),
			width: Math.round(rect.width || 0),
			height: Math.round(rect.height || 0)
		};
	}

	function show(info) {
		if (!panel) {
			build();
		}
		clearTimeout(closeTimer);
		successEl.hidden = true;
		body.hidden = false;
		if (!open || formKey !== info.key) {
			resetForm();
		}
		pending = info;
		formKey = info.key;
		quoteEl.textContent = info.selectedText;
		open = true;
		layer.hidden = false;
		panel.hidden = false;
		panel.classList.remove("mnf-success-state");
		requestAnimationFrame(function () {
			position();
			panel.classList.add("is-open");
			if (keyboardSelection) {
				var first = reactionWrap.querySelector(".mnf-reaction");
				if (first) {
					first.focus({ preventScroll: true });
				}
				keyboardSelection = false;
			}
		});
		applyHighlight(info.ranges);
	}

	function resetForm() {
		reaction = "";
		Array.prototype.forEach.call(reactionWrap.querySelectorAll(".mnf-reaction"), function (btn) {
			btn.classList.remove("is-selected");
			btn.setAttribute("aria-pressed", "false");
		});
		commentEl.value = "";
		bugConsentEl.checked = false;
		bugBox.hidden = true;
		statusEl.textContent = "";
		sendBtn.disabled = true;
		sendBtn.textContent = "Send";
		busy = false;
	}

	function selectReaction(key) {
		reaction = key;
		Array.prototype.forEach.call(reactionWrap.querySelectorAll(".mnf-reaction"), function (btn) {
			var selected = btn.getAttribute("data-reaction") === key;
			btn.classList.toggle("is-selected", selected);
			btn.setAttribute("aria-pressed", selected ? "true" : "false");
		});
		bugBox.hidden = key !== "bug";
		if (key === "bug" && !bugConsentEl.checked) {
			bugConsentEl.checked = false;
		}
		if (key !== "bug") {
			bugConsentEl.checked = false;
		}
		if (statusEl.textContent === "Choose a reaction first.") {
			statusEl.textContent = "";
		}
		updateSendState();
	}

	function updateSendState() {
		sendBtn.disabled = busy || !reaction;
	}

	function isDirty() {
		return Boolean(reaction || (commentEl && commentEl.value.trim()));
	}

	function send() {
		if (busy || !pending) {
			return;
		}
		if (!reaction) {
			statusEl.textContent = "Choose a reaction first.";
			return;
		}
		var email = String(emailEl.value || "").trim();
		if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			statusEl.textContent = "Please enter a valid email or leave it blank.";
			return;
		}
		busy = true;
		sendBtn.disabled = true;
		sendBtn.textContent = "Sending…";
		statusEl.textContent = "";
		if (rememberEl.checked && email) {
			setStoredEmail(email);
		}
		var payload = {
			token: cfg.token,
			request_id: pending.requestId,
			path: pending.slug,
			lesson_title: pending.lessonTitle,
			part: pending.part,
			part_title: pending.partTitle,
			block_index: pending.blockIndex,
			block_key: pending.blockKey,
			block_selector: pending.blockSelector,
			section_title: pending.sectionTitle,
			section_anchor: pending.sectionAnchor,
			block_text: pending.blockText,
			block_html: pending.blockHtml,
			reaction: reaction,
			comment: String(commentEl.value || "").trim(),
			email: email,
			selection: {
				text: pending.selectedText,
				html: pending.selectedHtml,
				start: pending.start,
				end: pending.end,
				prefix: pending.prefix,
				suffix: pending.suffix,
				block_length: pending.blockTextLength,
				range_count: pending.rangeCount,
				direction: pending.direction,
				rect: pending.selectionRect,
				block_rect: pending.blockRect,
				scroll_y: pending.scrollY,
				viewport_w: pending.viewportW,
				viewport_h: pending.viewportH
			}
		};
		if (reaction === "bug") {
			var consent = Boolean(bugConsentEl.checked);
			var snapshot = { consent: consent };
			if (consent && window.__MNFeedbackCapture) {
				var captured = window.__MNFeedbackCapture.snapshot(true);
				snapshot.console = captured.logs || [];
				snapshot.clicks = captured.clicks || [];
				snapshot.last_error = captured.last_error || null;
				snapshot.user_agent = String(navigator.userAgent || "");
				snapshot.url = String(window.location.href || "");
				snapshot.viewport = Math.round(window.innerWidth || 0) + "x" + Math.round(window.innerHeight || 0);
			}
			payload.bug = snapshot;
		}

		var controller = null;
		var timer = 0;
		try {
			controller = new AbortController();
			timer = setTimeout(function () { controller.abort(); }, 12000);
		} catch (e) {
			controller = null;
		}
		var options = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			credentials: "omit",
			cache: "no-store"
		};
		if (controller) {
			options.signal = controller.signal;
		}
		fetch(cfg.endpoint, options).then(function (response) {
			if (!response.ok) {
				throw new Error("request failed");
			}
			return response.json().catch(function () { return { ok: true }; });
		}).then(function (result) {
			if (!result || result.ok !== true) {
				throw new Error("request failed");
			}
			clearTimeout(timer);
			finishSuccess();
		}).catch(function () {
			clearTimeout(timer);
			busy = false;
			sendBtn.disabled = false;
			sendBtn.textContent = "Send";
			statusEl.textContent = "Could not send. Please try again.";
		});
	}

	function finishSuccess() {
		busy = false;
		body.hidden = true;
		successEl.hidden = false;
		panel.classList.add("mnf-success-state");
		clearHighlight();
		try {
			if (window.MNQuest && typeof window.MNQuest.toast === "function") {
				window.MNQuest.toast('<b class="mnq-plus">💬</b> Thanks — this helps improve the article.', "xp");
			}
		} catch (e) { /* ignore */ }
		closeTimer = setTimeout(closePanel, 2800);
	}

	function closePanel() {
		clearTimeout(closeTimer);
		open = false;
		if (layer) layer.hidden = true;
		if (panel) {
			panel.hidden = true;
			panel.classList.remove("is-open", "mnf-success-state");
		}
		clearHighlight();
		pending = null;
		formKey = "";
		busy = false;
		if (panel && body) {
			resetForm();
			body.hidden = false;
			successEl.hidden = true;
		}
	}

	function schedulePosition() {
		if (!open || positionRaf) {
			return;
		}
		positionRaf = requestAnimationFrame(function () {
			positionRaf = 0;
			position();
		});
	}

	function position() {
		if (!open || !panel || !pending) {
			return;
		}
		var sheet = window.innerWidth < 760;
		panel.classList.toggle("mnf-sheet", sheet);
		if (sheet) {
			panel.style.left = "";
			panel.style.right = "";
			panel.style.top = "";
			panel.style.bottom = "";
			if (window.visualViewport) {
				var offset = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
				panel.style.bottom = Math.round(12 + offset) + "px";
			}
			return;
		}
		panel.style.bottom = "auto";
		var block = pending.block;
		if (!block || !document.contains(block)) {
			return;
		}
		var blockRect = block.getBoundingClientRect();
		var panelHeight = panel.offsetHeight || 300;
		var top = Math.max(12, Math.min(window.innerHeight - panelHeight - 12, blockRect.top));
		panel.style.top = Math.round(top) + "px";
		var contentRect = contents.getBoundingClientRect();
		var panelWidth = panel.offsetWidth || 300;
		var left = contentRect.right + 20;
		if (left + panelWidth > window.innerWidth - 12) {
			panel.style.left = "auto";
			panel.style.right = "12px";
		} else {
			panel.style.left = Math.round(left) + "px";
			panel.style.right = "auto";
		}
	}

	function applyHighlight(ranges) {
		try {
			if (!window.CSS || !CSS.highlights || typeof Highlight === "undefined") {
				return;
			}
			if (window.__mnFeedbackHighlight) {
				CSS.highlights.delete("mn-feedback-selection");
			}
			var highlight = new Highlight();
			ranges.forEach(function (range) {
				try {
					highlight.add(range);
				} catch (e) { /* ignore */ }
			});
			CSS.highlights.set("mn-feedback-selection", highlight);
			window.__mnFeedbackHighlight = highlight;
		} catch (e) { /* ignore */ }
	}

	function clearHighlight() {
		try {
			if (window.CSS && CSS.highlights) {
				CSS.highlights.delete("mn-feedback-selection");
			}
			window.__mnFeedbackHighlight = null;
		} catch (e) { /* ignore */ }
	}

	function newRequestId() {
		try {
			if (window.crypto && window.crypto.getRandomValues) {
				var bytes = new Uint8Array(16);
				window.crypto.getRandomValues(bytes);
				return Array.prototype.map.call(bytes, function (b) {
					return ("0" + b.toString(16)).slice(-2);
				}).join("");
			}
		} catch (e) { /* ignore */ }
		return String(Date.now()) + Math.random().toString(16).slice(2, 18);
	}

	function storedEmail() {
		try {
			return String(window.localStorage.getItem(EMAIL_KEY) || "");
		} catch (e) {
			return "";
		}
	}

	function setStoredEmail(value) {
		try {
			if (value) {
				window.localStorage.setItem(EMAIL_KEY, value);
			} else {
				window.localStorage.removeItem(EMAIL_KEY);
			}
		} catch (e) { /* private mode / storage blocked */ }
	}

	function clearStoredEmail() {
		setStoredEmail("");
		updateForgetVisibility();
	}

	function saveEmailIfRemembered() {
		if (!rememberEl || !rememberEl.checked) {
			updateForgetVisibility();
			return;
		}
		var value = String(emailEl.value || "").trim();
		if (value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
			setStoredEmail(value);
		}
		updateForgetVisibility();
	}

	function prefillEmail() {
		var saved = storedEmail();
		if (saved) {
			emailEl.value = saved;
			rememberEl.checked = true;
		}
		updateForgetVisibility();
	}

	function updateForgetVisibility() {
		if (forgetEl) {
			forgetEl.hidden = !storedEmail();
		}
	}

	function boot() {
		start();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", function () {
			window.addEventListener("blogPostLoadComplete", boot, { once: true });
			setTimeout(boot, document.documentElement.classList.contains("is-ready") ? 900 : 2200);
		}, { once: true });
	} else {
		window.addEventListener("blogPostLoadComplete", boot, { once: true });
		setTimeout(boot, document.documentElement.classList.contains("is-ready") ? 900 : 2200);
	}
})();
