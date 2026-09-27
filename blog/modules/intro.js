(function () {
	'use strict';

	var started = false;

	function begin() {
		if (started) return;
		var loader = document.getElementById('loader');
		if (!loader) return;
		started = true;
		try {
			var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			var dark = document.documentElement.classList.contains('dark');

			var warm = dark ? '233,170,96' : '190,120,50';
			var heroColor = function () {
				return document.documentElement.classList.contains('dark')
					? [165, 180, 252] : [99, 102, 241];
			};
			// A static dawn-sky wash: deep at the top, gently warm-lifted at
			// the bottom. Human warmth without a circle, white, glare, or pulse.
			function warmHorizon(ctx, t, w, h) {
				var mid = dark ? 0.05 : 0.03;
				var bot = dark ? 0.16 : 0.10;
				var g = ctx.createLinearGradient(0, 0, 0, h);
				g.addColorStop(0, 'rgba(' + warm + ',0)');
				g.addColorStop(0.55, 'rgba(' + warm + ',' + mid + ')');
				g.addColorStop(1, 'rgba(' + warm + ',' + bot + ')');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, w, h);
			}

			var net = null;
			if (!reduced && window.OrganicNetwork) {
				var cv = document.createElement('canvas');
				cv.id = 'intro-canvas';
				cv.setAttribute('aria-hidden', 'true');
				loader.insertBefore(cv, loader.firstChild);
				net = window.OrganicNetwork.create(cv, {
					targetCount: 60,
					minCount: 24,
					densityDivis: 5000,
					maxLinkPx: 200,
					linkAlpha: 0.5,
					nodeAlpha: 0.8,
					speed: 0.042,
					wobble: 0.032,
					color: heroColor,
					onBackground: warmHorizon
				});
			}

			// Soft scrim behind the title: stabilises the backdrop (no shimmer
			// of the drifting network through the letters) and lifts the type.
			var scrim = document.createElement('div');
			scrim.className = 'intro-scrim';
			scrim.setAttribute('aria-hidden', 'true');
			scrim.style.background = dark
				? 'radial-gradient(ellipse 64% 46% at 50% 46%, rgba(7,11,22,0.5), rgba(7,11,22,0) 72%)'
				: 'radial-gradient(ellipse 64% 46% at 50% 46%, rgba(250,248,241,0.62), rgba(250,248,241,0) 72%)';
			loader.appendChild(scrim);

			loader.style.setProperty('--intro-glow', dark ? 'rgba(233,170,96,0.20)' : 'rgba(150,110,66,0.28)');

			var status = document.getElementById('loader-status');
			var title = document.createElement('div');
			title.className = 'intro-title';
			title.setAttribute('aria-hidden', 'true');

			var head = document.createElement('span');
			head.className = 'intro-head';
			var HEADLINE = 'From Big Bang to ChatGPT';
			var li = 0;
			HEADLINE.split(' ').forEach(function (word) {
				var w = document.createElement('span');
				w.className = 'intro-word';
				word.split('').forEach(function (ch) {
					var s = document.createElement('span');
					s.className = 'intro-letter';
					s.textContent = ch;
					s.style.animationDelay = (li * 0.012).toFixed(3) + 's';
					w.appendChild(s);
					li++;
				});
				head.appendChild(w);
				head.appendChild(document.createTextNode(' '));
			});

			var sub = document.createElement('span');
			sub.className = 'intro-sub';
			sub.textContent = 'A peek inside the black box';
			sub.style.color = dark ? 'rgba(214,176,124,0.85)' : 'rgba(150,110,66,0.88)';

			title.appendChild(head);
			title.appendChild(sub);
			loader.insertBefore(title, status || loader.lastChild);

			// Reveal the type only once the serif is loaded, so it appears in
			// one clean, animated beat instead of a font-swap flicker.
			var armed = false;
			function armReady() {
				if (armed) return;
				armed = true;
				title.classList.add('is-ready');
				// The type is fully materialised ~0.65 s after arming (letter
				// stagger + subtitle). revealContent() reads this and holds the
				// loader until 3 s after it, so the reader actually has time to
				// read the title before the page takes over.
				window.__mnIntroTextDone = (window.performance ? performance.now() : 0) + (reduced ? 120 : 650);
			}
			try {
				if (document.fonts && document.fonts.ready) document.fonts.ready.then(armReady, armReady);
			} catch (e) {}
			setTimeout(armReady, 250);

			var countEl = document.createElement('p');
			countEl.id = 'intro-count';
			countEl.setAttribute('aria-hidden', 'true');
			countEl.style.color = dark ? 'rgba(198,168,128,0.72)' : 'rgba(150,116,80,0.8)';
			loader.appendChild(countEl);

			var progress = document.createElement('div');
			progress.id = 'intro-progress';
			progress.setAttribute('aria-hidden', 'true');
			progress.style.background = dark ? 'rgba(148,163,184,0.16)' : 'rgba(120,112,98,0.2)';
			var progressFill = document.createElement('span');
			progressFill.className = 'intro-progress-fill';
			progressFill.style.background = dark ? 'rgba(233,170,96,0.8)' : 'rgba(178,110,44,0.85)';
			progress.appendChild(progressFill);
			loader.appendChild(progress);

			function countRows() {
				var c = document.getElementById('loader-checklist');
				return c ? c.querySelectorAll('.loader-section-row').length : 0;
			}
			function countDone() {
				var c = document.getElementById('loader-checklist');
				if (!c) return 0;
				var rows = c.querySelectorAll('.loader-section-row');
				var d = 0;
				for (var q = 0; q < rows.length; q++) if (rows[q].classList.contains('done')) d++;
				return d;
			}
			var total = countRows();

			function setCount() {
				if (!countEl) return;
				if (total > 0) {
					var d = countDone();
					countEl.textContent = d + ' of ' + total + (total === 1 ? ' module loaded' : ' modules loaded');
				} else {
					countEl.textContent = 'preparing\u2026';
				}
			}
			function setBar() {
				var p = total ? countDone() / total : 0;
				progressFill.style.width = (p * 100) + '%';
			}
			setCount();
			setBar();

			if (window.MutationObserver) {
				var cc = document.getElementById('loader-checklist');
				if (cc) {
					new MutationObserver(function () {
						total = countRows();
						setCount();
						setBar();
					}).observe(cc, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
				}
			}

			if (reduced) return;

			// The reveal itself is owned by revealContent() (a crossfade).
			// This loop only exists to release the network once the loader is
			// gone, so it cannot draw to a detached canvas forever.
			var stopped = false;
			function stop() {
				if (stopped) return;
				stopped = true;
				if (net) net.destroy();
			}
			(function tick() {
				if (stopped) return;
				if (!document.body.contains(loader)) { stop(); return; }
				requestAnimationFrame(tick);
			})();
			setTimeout(stop, 30000);
		} catch (err) {
			if (window.console) { try { console.info('[intro] intro skipped: ' + err.message); } catch (e) {} }
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', begin);
	} else {
		begin();
	}
})();
