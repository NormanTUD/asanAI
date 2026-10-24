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
		var events = [];
		var eventKeys = {};
		var sections = [];
		var sectionObserver = null;

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

		function pageSlug(pathname) {
			var path = String(pathname || window.location.pathname || '');
			path = path.replace(/\/+$/, '');
			var part = path.split('/').pop() || 'index';
			return part.replace(/\.php$/, '') || 'index';
		}

		function cleanTarget(value) {
			return String(value || '').replace(/[?#].*$/, '').replace(/\s+/g, ' ').trim().slice(0, 96);
		}

		function addEvent(type, target, value) {
			if (events.length >= 20) {
				return;
			}
			var safeTarget = cleanTarget(target);
			if (!safeTarget) {
				return;
			}
			var safeValue = (value === null || typeof value === 'undefined') ? 1 : Math.max(-1, Math.min(100000, value | 0));
			var key = type + '|' + safeTarget + '|' + safeValue;
			if (eventKeys[key]) {
				return;
			}
			eventKeys[key] = true;
			events.push({ type: type, target: safeTarget, value: safeValue });
		}

		function sectionText(value) {
			return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 64);
		}

		function sectionKey(value) {
			return sectionText(value).toLowerCase()
				.replace(/[^a-z0-9äöüß]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.slice(0, 48) || 'section';
		}

		function initSections() {
			if (sections.length > 0) {
				return;
			}
			var headings = Array.prototype.slice.call(document.querySelectorAll('.md h2, .md h3'));
			if (!headings.length) {
				headings = Array.prototype.slice.call(document.querySelectorAll('main h2, main h3, article h2, article h3'));
			}
			if (!headings.length) {
				return;
			}
			var i = 0;
			headings.forEach(function (heading) {
				if (i >= 12 || !heading || heading.closest('.toc, nav, .sidenote, .optional')) {
					return;
				}
				var label = sectionText(heading.textContent);
				if (!label) {
					return;
				}
				var entry = {
					i: i,
					k: sectionKey(label),
					l: label,
					v: 0,
					d: 0,
					since: null
				};
				heading.setAttribute('data-mn-section-index', String(i));
				sections.push(entry);
				i++;
			});
			if (!sections.length || !('IntersectionObserver' in window)) {
				return;
			}
			sectionObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					var index = parseInt(entry.target.getAttribute('data-mn-section-index') || '-1', 10);
					var section = sections[index];
					if (!section) {
						return;
					}
					var ratio = Math.round((entry.intersectionRatio || 0) * 100);
					if (ratio > section.v) {
						section.v = ratio;
					}
					if (entry.isIntersecting) {
						if (section.since === null) {
							section.since = now();
						}
					} else if (section.since !== null) {
						section.d += (now() - section.since) / 1000;
						section.since = null;
					}
				});
			}, { threshold: [0, 0.25, 0.5, 0.75, 1] });
			sections.forEach(function (section) {
				var heading = document.querySelector('[data-mn-section-index="' + section.i + '"]');
				if (heading) {
					sectionObserver.observe(heading);
				}
			});
		}

		function finalizeSections() {
			return sections.map(function (section) {
				var dwell = section.d;
				if (section.since !== null) {
					dwell += (now() - section.since) / 1000;
				}
				return {
					i: section.i,
					k: section.k,
					l: section.l,
					v: Math.max(0, Math.min(100, Math.round(section.v))),
					d: Math.max(0, Math.min(14400, Math.round(dwell)))
				};
			}).filter(function (section) {
				return section.v > 0 || section.d > 0;
			});
		}

		function send(event, duration, scroll, final) {
			if (final && sentFinal) {
				return;
			}
			if (final) {
				sentFinal = true;
			}
			var payloadData = {
				event: event,
				token: token,
				duration: Math.max(0, Math.min(14400, duration | 0)),
				scroll: (scroll === null || typeof scroll === 'undefined')
					? null
					: Math.max(0, Math.min(100, scroll | 0))
			};
			if (final && event === 'leave') {
				payloadData.sections = finalizeSections();
				payloadData.events = events.slice(0, 20);
			}
			var payload = JSON.stringify(payloadData);

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

		window.MNAnalyticsTrack = addEvent;

		document.addEventListener('click', function (event) {
			var target = event.target;
			if (!target || !target.closest) {
				return;
			}

			var copy = target.closest('.code-copy-btn');
			if (copy) {
				var pre = copy.closest('pre');
				var language = 'code';
				if (pre) {
					var match = String(pre.className || '').match(/language-([a-z0-9_-]+)/i);
					if (match) {
						language = match[1].toLowerCase();
					}
				}
				addEvent('code_copy', language, 1);
				return;
			}

			var citation = target.closest('a.cite-stealth[data-target^="bib-"]');
			if (citation) {
				addEvent('citation', String(citation.getAttribute('data-target') || '').slice(4), 1);
				return;
			}

			var searchResult = target.closest('.search-result-item');
			if (searchResult) {
				var resultHref = searchResult.getAttribute('href') || '';
				try {
					var resultUrl = new URL(resultHref, window.location.href);
					addEvent('search_result', pageSlug(resultUrl.pathname), parseInt(searchResult.getAttribute('data-index') || '-1', 10));
				} catch (e) {}
				return;
			}

			var link = target.closest('a[href]');
			if (!link) {
				return;
			}
			var href = link.getAttribute('href') || '';
			if (!href || href.charAt(0) === '#') {
				return;
			}
			var url;
			try {
				url = new URL(href, window.location.href);
			} catch (e) {
				return;
			}
			if (url.protocol !== 'http:' && url.protocol !== 'https:') {
				return;
			}
			var extension = (url.pathname.split('.').pop() || '').toLowerCase();
			if (['pdf', 'zip', 'csv', 'xlsx', 'docx', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'svg'].indexOf(extension) >= 0) {
				addEvent('download', extension + ':' + pageSlug(url.pathname), 1);
				return;
			}
			if (url.origin !== window.location.origin) {
				addEvent('external_link', url.hostname, 1);
				return;
			}
			if (url.pathname === window.location.pathname && url.hash) {
				return;
			}
			addEvent('internal_link', pageSlug(url.pathname), 1);
		}, true);

		document.addEventListener('play', function (event) {
			var media = event.target;
			if (media && media.matches && media.matches('video,audio')) {
				addEvent('media_play', pageSlug() + ':' + media.tagName.toLowerCase(), 1);
			}
		}, true);

		window.addEventListener('mnsearch:results', function (event) {
			var detail = event.detail || {};
			addEvent('search', 'results', parseInt(detail.count || '0', 10));
		});
		window.addEventListener('mnsearch:select', function (event) {
			var detail = event.detail || {};
			addEvent('search_result', pageSlug(detail.slug || detail.url || ''), parseInt(detail.index || '-1', 10));
		});
		window.addEventListener('mnquiz:answer', function (event) {
			var detail = event.detail || {};
			if (!detail.id) {
				return;
			}
			addEvent('quiz_answer', String(detail.id) + ':' + String(detail.index), detail.right ? 1 : 0);
		});
		window.addEventListener('mnquiz:finish', function (event) {
			var detail = event.detail || {};
			if (detail.id) {
				addEvent('quiz_finish', String(detail.id), parseInt(detail.score || '0', 10));
			}
		});
		window.addEventListener('mnchallenge:done', function (event) {
			var detail = event.detail || {};
			if (detail.id) {
				addEvent('lab_run', String(detail.id), 1);
			}
		});

		document.addEventListener('blogPostLoadComplete', initSections, { once: true });
		window.addEventListener('load', function () {
			setTimeout(initSections, 100);
		}, { once: true });
		setTimeout(initSections, 1200);

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
