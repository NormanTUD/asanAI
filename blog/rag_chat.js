/* Floating "ask the course" chat. The answer backend is optional: the widget
 * only appears when ask.php reports a healthy local service.
 */
(function() {
	'use strict';

	var state = {
		history: [],
		busy: false,
		mounted: false,
		pollTimer: null,
		streamNode: null
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

	function answerHtml(answer, sources) {
		var byId = {};
		(sources || []).forEach(function(source) {
			byId[source.id] = source;
		});
		var html = esc(answer).replace(/\[S(\d+)\]/g, function(marker, number) {
			var source = byId['S' + number];
			if (!source) return marker;
			return '<a class="rag-cite" href="' + escAttr(source.url) + '">[' + number + ']</a>';
		});
		if (sources && sources.length) {
			html += '<div class="rag-sources"><strong>Sources</strong><ul>';
			sources.forEach(function(source) {
				var label = esc(source.title);
				if (source.heading) label += ' — ' + esc(source.heading);
				html += '<li><a href="' + escAttr(source.url) + '">' + label + '</a></li>';
			});
			html += '</ul></div>';
		}
		return html;
	}

	function language() {
		var lang = (navigator.language || document.documentElement.lang || 'en');
		return String(lang).slice(0, 2).toLowerCase();
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
				'<span>Ask the course</span>' +
				'<button type="button" class="rag-chat-close" aria-label="Close">&times;</button>' +
			'</div>' +
			'<div class="rag-chat-messages" aria-live="polite">' +
				'<div class="rag-chat-welcome">Ask about anything in the lessons. ' +
				'Answers use only course text and cite the pages they come from.</div>' +
			'</div>' +
			'<div class="rag-chat-status" aria-live="polite"></div>' +
			'<form class="rag-chat-form">' +
				'<textarea class="rag-chat-input" rows="2" maxlength="2000" ' +
				'placeholder="Ask a question…" aria-label="Your question"></textarea>' +
				'<button type="submit" class="rag-chat-send">Send</button>' +
			'</form>';

		document.body.appendChild(button);
		document.body.appendChild(panel);
		els.button = button;
		els.panel = panel;
		els.messages = panel.querySelector('.rag-chat-messages');
		els.status = panel.querySelector('.rag-chat-status');
		els.input = panel.querySelector('.rag-chat-input');
		els.send = panel.querySelector('.rag-chat-send');

		button.addEventListener('click', open);
		panel.querySelector('.rag-chat-close').addEventListener('click', close);
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

	function addMessage(role, html, extraClass) {
		var node = document.createElement('div');
		node.className = 'rag-chat-msg rag-chat-msg-' + role + (extraClass ? ' ' + extraClass : '');
		node.innerHTML = html;
		els.messages.appendChild(node);
		els.messages.scrollTop = els.messages.scrollHeight;
		return node;
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

	function showPartial(text) {
		text = visiblePartial(text);
		if (!text) return;
		if (!state.streamNode) {
			state.streamNode = addMessage('assistant', '');
			state.streamNode.classList.add('rag-chat-streaming');
		}
		// Never replace the node while the reader is selecting its text.
		if (selectionInside(state.streamNode)) return;
		state.streamNode.innerHTML = answerHtml(text, []) +
			'<span class="rag-cursor" aria-hidden="true"></span>';
		els.messages.scrollTop = els.messages.scrollHeight;
	}

	function submit() {
		if (state.busy) return;
		var question = (els.input.value || '').trim();
		if (question.length < 3) return;
		addMessage('user', esc(question));
		els.input.value = '';
		els.status.textContent = 'Generating your answer…';
		state.streamNode = null;
		setBusy(true);

		var payload = {
			question: question,
			lang: language(),
			history: state.history.slice(-6)
		};
		fetch('ask.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})
		.then(function(response) { return response.json(); })
		.then(function(data) {
			if (data && data.status === 'done') {
				finish(question, data);
			} else if (data && data.id) {
				poll(question, data.id, data);
			} else {
				fail(data);
			}
		})
		.catch(function() { fail(null); });
	}

	function poll(question, id, first) {
		els.status.textContent = statusText(first);
		state.pollTimer = setTimeout(function() {
			fetch('ask.php?status=' + encodeURIComponent(id), { cache: 'no-store' })
				.then(function(response) { return response.json(); })
				.then(function(data) {
					if (data && data.status === 'done') {
						finish(question, data);
					} else if (data && data.status === 'error') {
						fail(data);
					} else {
						els.status.textContent = statusText(data) ||
							'Generating your answer…';
						showPartial(data.partial || '');
						poll(question, id, data);
					}
				})
				.catch(function() { fail(null); });
		}, 400);
	}

	function finish(question, data) {
		clearTimeout(state.pollTimer);
		els.status.textContent = '';
		var node = state.streamNode;
		state.streamNode = null;
		if (!node) node = addMessage('assistant', '');
		node.classList.remove('rag-chat-streaming');
		node.className = 'rag-chat-msg rag-chat-msg-assistant' +
			(data.grounded === false ? ' rag-chat-msg-refusal' : '');
		node.innerHTML = answerHtml(data.answer, data.sources);
		state.history.push({ role: 'user', content: question });
		state.history.push({ role: 'assistant', content: data.answer || '' });
		state.history = state.history.slice(-6);
		setBusy(false);
	}

	function fail(data) {
		clearTimeout(state.pollTimer);
		if (state.streamNode) {
			state.streamNode.remove();
			state.streamNode = null;
		}
		var message = 'The answer service is unavailable right now.';
		if (data && data.error === 'queue_full') {
			message = 'The answer queue is full. Please try again in a minute.';
		} else if (data && data.error === 'rate_limited') {
			message = 'Too many questions. Please try again in ' +
				Math.max(1, parseInt(data.retry_after, 10) || 10) + ' seconds.';
		} else if (data && data.error === 'question_too_long') {
			message = 'That question is too long. Please shorten it.';
		}
		els.status.textContent = message;
		setBusy(false);
	}

	function start() {
		if (typeof document === 'undefined' || !document.body) return;
		if (document.getElementById('rag-chat-toggle')) return;
		setTimeout(function() {
			fetch('ask.php?health=1', { cache: 'no-store' })
				.then(function(response) { return response.json(); })
				.then(function(data) {
					if (data && data.ok) mount();
				})
				.catch(function() { /* optional feature: stay silent */ });
		}, 1200);
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
			_internals: {
				esc: esc,
				language: language,
				setBusy: setBusy
			}
		};
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = {
			statusText: statusText,
			answerHtml: answerHtml,
			esc: esc,
			visiblePartial: visiblePartial
		};
	}
})();
