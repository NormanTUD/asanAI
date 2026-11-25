/*
 * [youtube]VIDEO_ID[/youtube] — privacy-friendly YouTube embeds.
 *
 * The marker is replaced before marked.js runs. The resulting card makes no
 * outbound request until the reader presses play; only then is the
 * youtube-nocookie iframe inserted. IDs are validated against YouTube's
 * 11-character alphabet so a malformed marker cannot inject markup.
 */
(function () {
	'use strict';

	if (window.BlogYouTube) return;

	const ID_RE = /^[A-Za-z0-9_-]{11}$/;
	const MARKER_RE = /\[youtube\]\s*([A-Za-z0-9_-]+)\s*\[\/youtube\]/g;

	function card(id) {
		return '<div class="mn-youtube" data-youtube-id="' + id + '" data-interactive>' +
			'<button type="button" class="mn-youtube-play" aria-label="Play YouTube video">' +
			'<span class="mn-youtube-icon" aria-hidden="true">&#9654;</span>' +
			'<span class="mn-youtube-label">Play YouTube video</span>' +
			'</button></div>';
	}

	function preprocess(html) {
		if (!html || html.indexOf('[youtube]') === -1) return html;
		return html.replace(MARKER_RE, function (match, id) {
			return ID_RE.test(id) ? card(id) : match;
		});
	}

	function mount() {
		document.addEventListener('click', function (event) {
			const button = event.target.closest && event.target.closest('.mn-youtube-play');
			if (!button) return;
			const host = button.closest('.mn-youtube');
			if (!host) return;
			const id = host.getAttribute('data-youtube-id');
			if (!ID_RE.test(id)) return;

			const iframe = document.createElement('iframe');
			iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
			iframe.title = 'YouTube video';
			iframe.loading = 'lazy';
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
			iframe.allowFullscreen = true;
			host.textContent = '';
			host.appendChild(iframe);
		});
	}

	window.BlogYouTube = { preprocess: preprocess, mount: mount };

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mount);
	} else {
		mount();
	}
})();
