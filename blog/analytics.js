/*
 * Anonymous page-time tracker.
 *
 * This file sets no cookies and reads/writes no localStorage or
 * sessionStorage. It keeps a page-scoped random token (issued by PHP) and a
 * visible-time counter in memory only, and sends a single final beacon when
 * the page is left. The server already counted the pageview when it rendered
 * the page; these messages only add duration/scroll depth.
 */
(function () {
	'use strict';

	function boot() {
		var cfg = window.__MNAnalytics;
		if (!cfg || !cfg.enabled || !cfg.token || !cfg.endpoint) {
			return;
		}

		var endpoint = cfg.endpoint;
		var token = cfg.token;
		var heartbeatMs = Math.max(15000, Math.min(120000, cfg.heartbeat || 60000));
		var last = now();
		var active = 0;
		var visible = document.visibilityState !== 'hidden';
		var sentFinal = false;
		var maxScroll = scrollPct();

		function now() {
			return (window.performance && window.performance.now)
				? window.performance.now()
				: Date.now();
		}

		function elapsed() {
			var t = active;
			if (visible && last !== null) {
				t += now() - last;
			}
			return Math.max(0, Math.round(t / 1000));
		}

		function pause() {
			if (visible && last !== null) {
				active += now() - last;
			}
			visible = false;
			last = null;
		}

		function resume() {
			visible = true;
			last = now();
		}

		function scrollPct() {
			var doc = document.documentElement;
			var body = document.body;
			var height = Math.max(
				doc ? doc.scrollHeight : 0,
				body ? body.scrollHeight : 0
			);
			var view = window.innerHeight || (doc ? doc.clientHeight : 0);
			if (height <= view) {
				return 100;
			}
			var y = window.pageYOffset || (doc ? doc.scrollTop : 0) || 0;
			return Math.max(0, Math.min(100, Math.round(((y + view) / height) * 100)));
		}

		function updateScroll() {
			var p = scrollPct();
			if (p > maxScroll) {
				maxScroll = p;
			}
		}

		function send(event, duration, scroll, final) {
			if (final && sentFinal) {
				return;
			}
			if (final) {
				sentFinal = true;
			}
			var payload = JSON.stringify({
				event: event,
				token: token,
				duration: Math.max(0, Math.min(14400, duration | 0)),
				scroll: (scroll === null || typeof scroll === 'undefined')
					? null
					: Math.max(0, Math.min(100, scroll | 0))
			});

			var blob = null;
			try {
				blob = new Blob([payload], { type: 'application/json' });
			} catch (e) {
				blob = null;
			}

			if (navigator.sendBeacon) {
				try {
					if (blob && navigator.sendBeacon(endpoint, blob)) {
						return;
					}
					if (!blob && navigator.sendBeacon(endpoint, payload)) {
						return;
					}
				} catch (e) {
					// fall through to fetch
				}
			}

			try {
				fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: payload,
					credentials: 'omit',
					cache: 'no-store',
					keepalive: true
				});
			} catch (e) {
				// Tracking must never affect the page.
			}
		}

		var dnt = (
			navigator.doNotTrack === '1' ||
			navigator.doNotTrack === 'yes' ||
			navigator.msDoNotTrack === '1' ||
			window.doNotTrack === '1' ||
			navigator.globalPrivacyControl === true
		);
		if (dnt) {
			send('optout', 0, null, true);
			return;
		}

		var scrollScheduled = false;
		window.addEventListener('scroll', function () {
			if (scrollScheduled) {
				return;
			}
			scrollScheduled = true;
			var raf = window.requestAnimationFrame || function (fn) {
				return setTimeout(fn, 50);
			};
			raf(function () {
				scrollScheduled = false;
				updateScroll();
			});
		}, { passive: true });

		document.addEventListener('visibilitychange', function () {
			if (document.visibilityState === 'hidden') {
				pause();
				updateScroll();
				send('heartbeat', elapsed(), maxScroll, false);
			} else {
				resume();
			}
		});

		window.addEventListener('pageshow', function (e) {
			if (e.persisted) {
				sentFinal = false;
				resume();
			}
		});

		window.addEventListener('pagehide', function (e) {
			if (e.persisted) {
				pause();
				updateScroll();
				send('heartbeat', elapsed(), maxScroll, false);
				return;
			}
			pause();
			updateScroll();
			send('leave', elapsed(), maxScroll, true);
		});

		setInterval(function () {
			if (document.visibilityState === 'hidden') {
				return;
			}
			updateScroll();
			send('heartbeat', elapsed(), maxScroll, false);
		}, heartbeatMs);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot, { once: true });
	} else {
		boot();
	}
})();
