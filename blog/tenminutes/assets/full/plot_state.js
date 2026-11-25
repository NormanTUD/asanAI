/* Shared empty / loading / error states for in-page visualizations.
   Keeps every lab's placeholder consistent instead of each module
   inventing its own inline markup. */
(function () {
	'use strict';

	function esc(value) {
		return String(value == null ? '' : value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function resolve(target) {
		if (!target) return null;
		return (typeof target === 'string') ? document.getElementById(target) : target;
	}

	function loadingMarkup(text) {
		return '<div class="plot-loading" style="height:100%; flex-direction:column; gap:14px;">' +
			'<div class="spinner"></div><span>' + esc(text || 'Loading...') + '</span></div>';
	}

	function loading(target, text) {
		var el = resolve(target);
		if (el) el.innerHTML = loadingMarkup(text);
	}

	function empty(target, title, message) {
		var el = resolve(target);
		if (!el) return;
		el.innerHTML = '<div class="plot-state plot-state--empty">' +
			(title ? '<div class="plot-state-title">' + esc(title) + '</div>' : '') +
			(message ? '<div class="plot-state-msg">' + message + '</div>' : '') +
			'</div>';
	}

	function error(target, title, message, onRetry) {
		var el = resolve(target);
		if (!el) return;
		el.innerHTML = '<div class="plot-state plot-state--error">' +
			(title ? '<div class="plot-state-title">' + esc(title) + '</div>' : '') +
			(message ? '<div class="plot-state-msg">' + message + '</div>' : '') +
			(onRetry ? '<button type="button" class="plot-state-retry">Try again</button>' : '') +
			'</div>';
		if (onRetry) {
			var btn = el.querySelector('.plot-state-retry');
			if (btn) btn.addEventListener('click', onRetry);
		}
	}

	function clear(target) {
		var el = resolve(target);
		if (el) el.innerHTML = '';
	}

	window.PlotState = {
		loading: loading,
		loadingMarkup: loadingMarkup,
		empty: empty,
		error: error,
		clear: clear,
		escape: esc
	};
})();
