/* Floating "ask the course" chat. The answer backend is optional: the widget
 * only appears when ask.php reports a healthy local service.
 */
(function() {
	'use strict';

	var MAX_QUESTION = 2000;
	var REQUEST_TIMEOUT = 15000;
	var JOB_TIMEOUT = 200000;
	var STORAGE_KEY = 'mn_rag_chat_v1';
	var ACTIVE_KEY = 'mn_rag_chat_job_v1';

	var state = {
		history: [],
		messages: [],
		busy: false,
		mounted: false,
		pollTimer: null,
		streamNode: null,
		welcome: null,
		seq: 0,
		lastQuestion: '',
		startedAt: 0,
		eta: null,
		slow: false,
		lastPartial: '',
		offline: false
	};
	var els = {};

	function esc(value) {
		return String(value == null ? '' : value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function escAttr(value) {
		return esc(value);
	}

	function statusText(data) {
		if (!data) return '';
		if (data.status === 'queued') {
			var position = Math.max(1, parseInt(data.position, 10) || 1);
			var wait = Math.max(1, Math.round(Number(data.eta_seconds) || 0));
			return 'Your answer is being generated. You are #' + position +
				' in the queue. About ' + wait + ' seconds.';
		}
		if (data.status === 'running') {
			var remaining = Math.max(1, Math.round(Number(data.eta_seconds) || 0));
			return 'Generating your answer… about ' + remaining + ' seconds.';
		}
		return '';
	}

	function errorText(data) {
		var error = data && data.error ? String(data.error) : 'unavailable';
		if (error === 'queue_full') {
			return 'The answer queue is full right now. Please try again in a minute.';
		}
		if (error === 'rate_limited') {
			return 'Too many questions. Please try again in ' +
				Math.max(1, parseInt(data.retry_after, 10) || 10) + ' seconds.';
		}
		if (error === 'unknown_job') {
			return 'The answer service restarted while generating. Please try again.';
		}
		if (error === 'generation_failed') {
			return 'The answer could not be generated. Please try again.';
		}
		if (error === 'timeout') {
			return 'This is taking longer than expected. Please try again.';
		}
		if (error === 'question_too_long') {
			return 'That question is too long. Please shorten it.';
		}
		if (error === 'question_too_short') {
			return 'Please ask a slightly longer question.';
		}
		if (error === 'bad_response' || error === 'invalid_json') {
			return 'The answer service sent an invalid response. Please try again.';
		}
		return 'The answer service is unavailable right now. Please try again.';
	}

	function unescapeHtml(value) {
		return String(value || '')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'");
	}

	function safeLink(url) {
		url = String(url || '').trim();
		if (!url) return '';
		if (/(^|\/)\.\.(\/|$)/.test(url) || /%2e%2e/i.test(url)) return '';
		if (/^#/.test(url) || /^\/(?!\/)/.test(url)) return url;
		if (/^[a-zA-Z0-9_.-]+(?:[\/#?][a-zA-Z0-9_.\/#?=&%+-]*)?$/.test(url)) return url;
		if (typeof window !== 'undefined' && window.location) {
			try {
				var parsed = new URL(url, window.location.href);
				if (parsed.origin === window.location.origin) {
					return parsed.pathname + parsed.search + parsed.hash;
				}
			} catch (error) {
				return '';
			}
		}
		return '';
	}

	function answerHtml(answer, sources) {
		var byId = Object.create(null);
		(sources || []).forEach(function(source) {
			if (source && source.id) byId[source.id] = source;
		});
		var stashed = [];
		function stash(html) {
			stashed.push(html);
			return '\u0000T' + (stashed.length - 1) + '\u0000';
		}

		var html = esc(answer);
		html = html.replace(/`([^`\n]+)`/g, function(_, code) {
			return stash('<code>' + code + '</code>');
		});
		html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function(_, alt, rawUrl) {
			var safe = safeLink(unescapeHtml(rawUrl));
			if (!safe) return alt;
			return stash('<img class="rag-inline-image" src="' + escAttr(safe) +
				'" alt="' + alt + '" loading="lazy">');
		});
		html = html.replace(/\[(?:S(\d+)|(\d+))\]/g, function(marker, sourceNumber, bareNumber) {
			var number = sourceNumber || bareNumber;
			var source = byId['S' + number];
			var sourceUrl = source ? safeLink(source.url) : '';
			if (!sourceUrl) return marker;
			return stash('<a class="rag-cite" href="' + escAttr(sourceUrl) + '">[' + number + ']</a>');
		});
		html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_, label, rawUrl) {
			var safe = safeLink(unescapeHtml(rawUrl));
			if (!safe) return label;
			return stash('<a href="' + escAttr(safe) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>');
		});
		html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
		html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
		html = html.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
		html = html.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
		html = '<p>' + html + '</p>';
		html = html.replace(/\u0000T(\d+)\u0000/g, function(_, index) {
			return stashed[Number(index)] || '';
		});

		if (sources && sources.length) {
			html += '<div class="rag-sources"><strong>Sources</strong><ul>';
			sources.forEach(function(source) {
				if (!source || !source.url) return;
				var safe = safeLink(source.url);
				if (!safe) return;
				var label = esc(source.title || source.url);
				if (source.heading) label += ' — ' + esc(source.heading);
				var image = source.img ? safeLink(source.img) : '';
				html += '<li>';
				if (image) {
					var imageAlt = esc(source.imgCaption || source.title || '');
					html += '<a class="rag-source-figure" href="' + escAttr(safe) + '">' +
						'<img class="rag-source-thumb" src="' + escAttr(image) + '" alt="' +
						imageAlt + '" loading="lazy"></a>';
				}
				html += '<a href="' + escAttr(safe) + '">' + label + '</a></li>';
			});
			html += '</ul></div>';
		}
		return html;
	}

	function slowNote(data, text) {
		var SLOW_NOTE = 'This is taking a bit longer than expected.';
		if (state.slow) {
			return (text ? text + ' ' : '') + SLOW_NOTE;
		}
		var raw = data && data.eta_seconds;
		var eta = raw == null ? null : Math.round(Number(raw));
		if (eta == null || !isFinite(eta)) {
			state.eta = null;
			return text;
		}
		if (state.eta && state.eta.value === eta) {
			state.eta.repeats += 1;
		} else {
			state.eta = { value: eta, repeats: 1 };
		}
		if (state.eta.repeats >= 4) {
			state.slow = true;
			return (text ? text + ' ' : '') + SLOW_NOTE;
		}
		return text;
	}

	function language() {
		var lang = (navigator.language || document.documentElement.lang || 'en');
		return String(lang).slice(0, 2).toLowerCase();
	}

	function readJson(response) {
		return response.text().then(function(text) {
			var data = {};
			try {
				data = text ? JSON.parse(text) : {};
			} catch (error) {
				data = { error: 'bad_response' };
			}
			if (!response.ok && !data.error) {
				data.error = response.status === 429 ? 'rate_limited' : 'unavailable';
			}
			return data;
		});
	}

	function fetchJson(url, options, timeout) {
		var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
		var timer = setTimeout(function() {
			if (controller) controller.abort();
		}, timeout || REQUEST_TIMEOUT);
		options = options || {};
		if (controller) options.signal = controller.signal;
		return fetch(url, options)
			.then(function(response) { return readJson(response); })
			.then(function(data) {
				clearTimeout(timer);
				return data;
			}, function(error) {
				clearTimeout(timer);
				throw error;
			});
	}

	function saveConversation() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				history: state.history.slice(-6),
				messages: state.messages.slice(-20)
			}));
		} catch (error) {
			/* private mode or quota: the chat still works without persistence */
		}
	}

	function restoreConversation() {
		var raw;
		try {
			raw = localStorage.getItem(STORAGE_KEY);
		} catch (error) {
			return;
		}
		if (!raw) return;
		var stored;
		try {
			stored = JSON.parse(raw);
		} catch (error) {
			return;
		}
		if (!stored || !Array.isArray(stored.messages)) return;
		state.history = Array.isArray(stored.history) ? stored.history.slice(-6) : [];
		state.messages = stored.messages.slice(-20).filter(function(message) {
			return message && (message.role === 'user' || message.role === 'assistant') &&
				typeof message.text === 'string';
		});
		state.messages.forEach(function(message) {
			if (message.role === 'user') {
				addMessage('user', esc(message.text.slice(0, MAX_QUESTION)));
				return;
			}
			var node = addMessage('assistant', answerHtml(
				message.text.slice(0, 4000),
				Array.isArray(message.sources) ? message.sources : []
			));
			pruneBrokenImages(node);
			if (message.grounded === false) node.classList.add('rag-chat-msg-refusal');
		});
		if (state.messages.length) scrollMessages();
	}

	function readActiveJob() {
		try {
			var raw = localStorage.getItem(ACTIVE_KEY);
			if (!raw) return null;
			var job = JSON.parse(raw);
			if (!job || !job.id || !job.question) return null;
			if (Date.now() - (job.startedAt || 0) > JOB_TIMEOUT) {
				localStorage.removeItem(ACTIVE_KEY);
				return null;
			}
			return job;
		} catch (error) {
			return null;
		}
	}

	function saveActiveJob(job) {
		try {
			localStorage.setItem(ACTIVE_KEY, JSON.stringify(job));
		} catch (error) {
			/* ignore */
		}
	}

	function clearActiveJob() {
		try {
			localStorage.removeItem(ACTIVE_KEY);
		} catch (error) {
			/* ignore */
		}
	}

	function hasStoredConversation() {
		try {
			return !!localStorage.getItem(STORAGE_KEY);
		} catch (error) {
			return false;
		}
	}

	function resumeActiveJob() {
		var job = readActiveJob();
		if (!job || state.busy) return;
		var seq = ++state.seq;
		state.lastQuestion = job.question;
		state.startedAt = job.startedAt || Date.now();
		state.streamNode = null;
		state.eta = null;
		state.slow = false;
		state.lastPartial = '';
		setBusy(true);
		els.status.textContent = 'Reconnecting to your answer…';
		showTyping();
		poll(seq, job.question, job.id, { status: 'queued' }, 0);
	}

	function mount() {
		if (state.mounted) return;
		state.mounted = true;

		var button = document.createElement('button');
		button.id = 'rag-chat-toggle';
		button.type = 'button';
		button.setAttribute('aria-label', 'Ask the course');
		button.setAttribute('title', 'Ask the course');
		button.innerHTML =
			'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
			'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
			'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
			'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>' +
			'<circle cx="8" cy="10" r="0.8" fill="currentColor" stroke="none"/>' +
			'<circle cx="12" cy="10" r="0.8" fill="currentColor" stroke="none"/>' +
			'<circle cx="16" cy="10" r="0.8" fill="currentColor" stroke="none"/>' +
			'</svg>';

		var panel = document.createElement('div');
		panel.id = 'rag-chat-panel';
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-label', 'Ask the course');
		panel.setAttribute('aria-hidden', 'true');
		panel.hidden = true;
		panel.innerHTML =
			'<div class="rag-chat-header">' +
				'<div class="rag-chat-brand">' +
					'<span class="rag-chat-brand-mark" aria-hidden="true">' +
						'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
						'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>' +
						'<path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>' +
						'</svg>' +
					'</span>' +
					'<span class="rag-chat-title-main">Ask the course</span>' +
				'</div>' +
				'<div class="rag-chat-actions">' +
					'<button type="button" class="rag-chat-clear" aria-label="Clear conversation" title="Clear conversation">' +
						'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
						'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>' +
						'</svg>' +
					'</button>' +
					'<button type="button" class="rag-chat-close" aria-label="Close">&times;</button>' +
				'</div>' +
			'</div>' +
			'<div class="rag-chat-messages" aria-live="polite">' +
				'<div class="rag-chat-welcome">' +
					'<div class="rag-chat-welcome-icon" aria-hidden="true">' +
						'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
						'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>' +
						'<path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>' +
						'</svg>' +
					'</div>' +
					'<div class="rag-chat-welcome-text">' +
						'<strong>Ask anything about the course.</strong> Answers come only from the lessons and link their sources. ' +
						'<span class="rag-chat-ai-note">This is an AI assistant: it can make mistakes even when it sounds confident. Check the cited lesson and its sources.</span>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="rag-chat-status" aria-live="polite"></div>' +
			'<div class="rag-chat-disclaimer">AI-generated answers can be wrong. Always verify with the linked lessons, the sources they cite, and other reliable sources.</div>' +
			'<form class="rag-chat-form">' +
				'<textarea class="rag-chat-input" rows="2" maxlength="2000" ' +
				'placeholder="Ask a question about the course…" aria-label="Your question"></textarea>' +
				'<button type="submit" class="rag-chat-send" aria-label="Send" title="Send">' +
					'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
					'<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>' +
					'</svg>' +
				'</button>' +
			'</form>';

		document.body.appendChild(button);
		document.body.appendChild(panel);
		els.button = button;
		els.panel = panel;
		els.messages = panel.querySelector('.rag-chat-messages');
		els.status = panel.querySelector('.rag-chat-status');
		els.input = panel.querySelector('.rag-chat-input');
		els.send = panel.querySelector('.rag-chat-send');
		els.welcome = panel.querySelector('.rag-chat-welcome');
		state.welcome = els.welcome;
		restoreConversation();
		window.addEventListener('offline', function() {
			state.offline = true;
			if (state.busy) els.status.textContent = 'You are offline. Waiting to reconnect…';
		});
		window.addEventListener('online', function() {
			state.offline = false;
			if (!state.busy && state.lastQuestion) {
				els.status.textContent = 'Back online. Tap “Try again”.';
			}
		});
		resumeActiveJob();

		button.addEventListener('click', open);
		panel.querySelector('.rag-chat-close').addEventListener('click', close);
		panel.querySelector('.rag-chat-clear').addEventListener('click', clearConversation);
		els.input.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				submit();
			}
		});
		panel.querySelector('.rag-chat-form').addEventListener('submit', function(event) {
			event.preventDefault();
			submit();
		});
		panel.addEventListener('keydown', function(event) {
			if (event.key === 'Escape') close();
		});
	}

	function open() {
		if (!els.panel) return;
		els.panel.hidden = false;
		els.panel.setAttribute('aria-hidden', 'false');
		setTimeout(function() { els.input.focus(); }, 50);
	}

	function close() {
		if (!els.panel) return;
		els.panel.hidden = true;
		els.panel.setAttribute('aria-hidden', 'true');
		if (els.button) els.button.focus();
	}

	function isNearBottom() {
		if (!els.messages) return true;
		return els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight < 48;
	}

	function scrollMessages() {
		if (els.messages) els.messages.scrollTop = els.messages.scrollHeight;
	}

	function addMessage(role, html, extraClass, forceScroll) {
		var follow = forceScroll === true || isNearBottom();
		var node = document.createElement('div');
		node.className = 'rag-chat-msg rag-chat-msg-' + role + (extraClass ? ' ' + extraClass : '');
		node.innerHTML = html;
		els.messages.appendChild(node);
		if (follow) scrollMessages();
		return node;
	}

	function pruneBrokenImages(root) {
		if (!root) return;
		root.querySelectorAll('img').forEach(function(image) {
			if (image.complete && image.naturalWidth === 0) {
				image.remove();
				return;
			}
			image.addEventListener('error', function() { image.remove(); }, { once: true });
		});
	}

	function setBusy(busy) {
		state.busy = busy;
		if (els.send) els.send.disabled = busy;
	}

	function visiblePartial(text) {
		return String(text || '').replace(
			/\[\[?\s*NOT[\s_-]*IN[\s_-]*COURSE\s*\]?\]/gi, ''
		);
	}

	function selectionInside(node) {
		var selection = window.getSelection && window.getSelection();
		if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
			return false;
		}
		return node.contains(selection.anchorNode) || node.contains(selection.focusNode);
	}

	function showTyping() {
		if (state.streamNode) return;
		state.streamNode = addMessage(
			'assistant',
			'<div class="rag-chat-wait"><span class="rag-spinner" aria-hidden="true"></span>' +
				'<span class="rag-chat-wait-label">Searching the course…</span></div>',
			'rag-chat-waiting'
		);
	}

	function setWaitLabel(text) {
		if (!state.streamNode) return;
		var label = state.streamNode.querySelector('.rag-chat-wait-label');
		if (label) label.textContent = text;
	}

	function showPartial(text) {
		text = visiblePartial(text);
		if (!text) return;
		if (!state.streamNode) {
			state.streamNode = addMessage('assistant', '');
			state.streamNode.classList.add('rag-chat-streaming');
		}
		// Never replace the node while the reader is selecting its text.
		if (selectionInside(state.streamNode)) return;
		if (state.lastPartial === text) return;
		var follow = isNearBottom();
		state.lastPartial = text;
		state.streamNode.innerHTML = answerHtml(text, []) +
			'<span class="rag-cursor" aria-hidden="true"></span>';
		pruneBrokenImages(state.streamNode);
		if (follow) scrollMessages();
	}

	function submit() {
		if (state.busy) return;
		var question = (els.input.value || '').trim();
		if (question.length < 3) {
			els.status.textContent = 'Please ask a slightly longer question.';
			return;
		}
		if (question.length > MAX_QUESTION) {
			els.status.textContent = 'Please shorten your question (maximum 2000 characters).';
			return;
		}
		els.input.value = '';
		ask(question, true);
	}

	function ask(question, addUser) {
		if (state.busy || !question) return;
		clearActiveJob();
		var seq = ++state.seq;
		state.lastQuestion = question;
		state.startedAt = Date.now();
		state.streamNode = null;
		state.eta = null;
		state.slow = false;
		state.lastPartial = '';
		if (addUser) {
			addMessage('user', esc(question), null, true);
			state.messages.push({ role: 'user', text: question });
			saveConversation();
		}
		setBusy(true);
		els.status.textContent = 'Contacting the answer service…';
		showTyping();

		var payload = {
			question: question,
			lang: language(),
			history: state.history.slice(-6)
		};
		fetchJson('ask.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		}, 20000)
			.then(function(data) {
				if (seq !== state.seq) return;
				if (data && data.status === 'done') {
					finish(seq, question, data);
				} else if (data && data.id) {
					saveActiveJob({
						id: data.id,
						question: question,
						startedAt: state.startedAt
					});
					poll(seq, question, data.id, data, 0);
				} else {
					showError(seq, errorText(data));
				}
			})
			.catch(function(error) {
				if (seq !== state.seq) return;
				showError(seq, errorText({
					error: error && error.name === 'AbortError' ? 'timeout' : 'unavailable'
				}));
			});
	}

	function poll(seq, question, id, first, attempt) {
		if (seq !== state.seq) return;
		setWaitLabel(first && first.status === 'queued'
			? 'Waiting for a free model slot…'
			: 'Writing the answer…');
		els.status.textContent = slowNote(first, statusText(first) || 'Waiting for the answer…');
		if (Date.now() - state.startedAt > JOB_TIMEOUT) {
			showError(seq, errorText({ error: 'timeout' }));
			return;
		}
		var delay = first && first.status === 'running' ? 100 : 900;
		state.pollTimer = setTimeout(function() {
			if (seq !== state.seq) return;
			fetchJson('ask.php?status=' + encodeURIComponent(id), { cache: 'no-store' }, 10000)
				.then(function(data) {
					if (seq !== state.seq) return;
					if (data && data.status === 'done') {
						finish(seq, question, data);
					} else if (data && data.status === 'error') {
						showError(seq, errorText(data));
					} else if (data && data.status === 'running') {
						setWaitLabel('Writing the answer…');
						els.status.textContent = slowNote(
							data, statusText(data) || 'Generating your answer…'
						);
						showPartial(data.partial || '');
						poll(seq, question, id, data, 0);
					} else if (data && data.status === 'queued') {
						setWaitLabel('Waiting for a free model slot…');
						els.status.textContent = slowNote(data, statusText(data));
						poll(seq, question, id, data, 0);
					} else if (data && data.error) {
						showError(seq, errorText(data));
					} else if (attempt < 2) {
						els.status.textContent = 'Reconnecting…';
						poll(seq, question, id, first, attempt + 1);
					} else {
						showError(seq, errorText({ error: 'bad_response' }));
					}
				})
				.catch(function() {
					if (seq !== state.seq) return;
					if (attempt < 2) {
						els.status.textContent = 'Reconnecting…';
						poll(seq, question, id, first, attempt + 1);
					} else {
						showError(seq, errorText({ error: 'unavailable' }));
					}
				});
		}, delay);
	}

	function finish(seq, question, data) {
		if (seq !== state.seq) return;
		var answer = data && typeof data.answer === 'string' ? data.answer : '';
		if (!answer.trim()) {
			showError(seq, 'The service returned an empty answer. Please try again.');
			return;
		}
		clearTimeout(state.pollTimer);
		state.eta = null;
		state.slow = false;
		state.lastPartial = '';
		els.status.textContent = '';
		var sources = Array.isArray(data.sources) ? data.sources : [];
		var node = state.streamNode;
		state.streamNode = null;
		var follow = isNearBottom();
		if (!node) node = addMessage('assistant', '');
		node.className = 'rag-chat-msg rag-chat-msg-assistant' +
			(data.grounded === false ? ' rag-chat-msg-refusal' : '');
		node.innerHTML = answerHtml(answer, sources);
		pruneBrokenImages(node);
		if (follow) scrollMessages();
		state.history.push({ role: 'user', content: question });
		var contextSources = sources.slice(0, 4).map(function(source) {
			return {
				title: String(source && source.title || '').slice(0, 200),
				heading: String(source && source.heading || '').slice(0, 200)
			};
		});
		state.history.push({
			role: 'assistant',
			content: answer,
			query_en: data && typeof data.query_en === 'string' ? data.query_en : '',
			sources: contextSources
		});
		state.history = state.history.slice(-6);
		state.messages.push({
			role: 'assistant',
			text: answer,
			sources: sources,
			grounded: data.grounded !== false
		});
		state.messages = state.messages.slice(-20);
		saveConversation();
		clearActiveJob();
		state.lastQuestion = '';
		setBusy(false);
	}

	function showError(seq, message) {
		if (seq !== state.seq) return;
		clearTimeout(state.pollTimer);
		clearActiveJob();
		if (typeof navigator !== 'undefined' && navigator.onLine === false) {
			message = 'You are offline. Reconnect and try again.';
		}
		state.eta = null;
		state.slow = false;
		state.lastPartial = '';
		if (state.streamNode) {
			state.streamNode.remove();
			state.streamNode = null;
		}
		setBusy(false);
		els.status.innerHTML =
			'<span class="rag-chat-error-text">' + esc(message) + '</span>' +
			(state.lastQuestion
				? ' <button type="button" class="rag-chat-retry">Try again</button>'
				: '');
		var retryButton = els.status.querySelector('.rag-chat-retry');
		if (retryButton) retryButton.addEventListener('click', retry);
	}

	function retry() {
		if (state.busy || !state.lastQuestion) return;
		els.status.textContent = '';
		ask(state.lastQuestion, false);
	}

	function clearConversation() {
		state.seq++;
		clearTimeout(state.pollTimer);
		state.streamNode = null;
		state.lastQuestion = '';
		state.history = [];
		state.messages = [];
		state.eta = null;
		state.slow = false;
		state.lastPartial = '';
		clearActiveJob();
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			/* ignore */
		}
		setBusy(false);
		if (els.status) els.status.textContent = '';
		if (els.messages) {
			Array.prototype.slice.call(els.messages.children).forEach(function(child) {
				if (child !== state.welcome) child.remove();
			});
		}
		if (els.input) {
			els.input.value = '';
			els.input.focus();
		}
	}

	function start() {
		if (typeof document === 'undefined' || !document.body) return;
		if (document.getElementById('rag-chat-toggle')) return;
		var attempt = 0;
		function healthCheck() {
			fetchJson('ask.php?health=1', { cache: 'no-store' }, 5000)
				.then(function(data) {
					if (data && data.ok) {
						mount();
					} else if (hasStoredConversation() || readActiveJob()) {
						mount();
					} else if (attempt < 2) {
						attempt++;
						setTimeout(healthCheck, 2000 * attempt);
					}
				})
				.catch(function() {
					if (attempt < 2) {
						attempt++;
						setTimeout(healthCheck, 2000 * attempt);
					}
				});
		}
		setTimeout(healthCheck, 1200);
	}

	if (typeof document !== 'undefined') {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', start);
		} else {
			start();
		}
	}

	if (typeof window !== 'undefined') {
		window.MNRagChat = {
			mount: mount,
			statusText: statusText,
			answerHtml: answerHtml,
			clear: clearConversation,
			_internals: {
				esc: esc,
				language: language,
				setBusy: setBusy,
				visiblePartial: visiblePartial,
				errorText: errorText
			}
		};
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = {
			statusText: statusText,
			answerHtml: answerHtml,
			esc: esc,
			visiblePartial: visiblePartial,
			errorText: errorText
		};
	}
})();
