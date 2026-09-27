(function () {
	'use strict';

	var started = false;
	var MIN_SHOW = 2.2;

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
			// A soft dawn-sky wash: deep at the top, gently warm-lifted at
			// the bottom. Human warmth without a circle, white, or glare.
			function warmHorizon(ctx, t, w, h) {
				var breathe = 0.5 + 0.5 * Math.sin(t / 6000);
				var mid = (dark ? 0.045 : 0.03) + 0.02 * breathe;
				var bot = (dark ? 0.15 : 0.10) + 0.03 * breathe;
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

			var status = document.getElementById('loader-status');
			var title = document.createElement('div');
			title.className = 'intro-title';
			title.setAttribute('aria-hidden', 'true');
			var head = document.createElement('span');
			head.className = 'intro-head';
			head.textContent = 'From Big Bang to ChatGPT';
			var sub = document.createElement('span');
			sub.className = 'intro-sub';
			sub.textContent = 'A peek inside the black box';
			sub.style.color = dark ? 'rgba(214,176,124,0.85)' : 'rgba(150,110,66,0.88)';
			title.appendChild(head);
			title.appendChild(sub);
			loader.insertBefore(title, status || loader.lastChild);

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
			var progress01 = 0;
			var finale = false;

			function setCount() {
				if (!countEl) return;
				if (total > 0) {
					var d = finale ? total : countDone();
					countEl.textContent = d + ' of ' + total + (total === 1 ? ' module loaded' : ' modules loaded');
				} else {
					countEl.textContent = 'preparing\u2026';
				}
			}
			function setBar() {
				var p = finale ? 1 : progress01;
				progressFill.style.width = (p * 100) + '%';
			}
			setCount();
			setBar();

			if (window.MutationObserver) {
				var cc = document.getElementById('loader-checklist');
				if (cc) {
					new MutationObserver(function () {
						total = countRows();
						progress01 = total ? countDone() / total : 0;
						setCount();
						setBar();
					}).observe(cc, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
				}
			}

			var finaleAt = 0, running = true, lastTick = 0, t0 = (window.performance && performance.now()) || Date.now();

			function triggerFinale() {
				if (finale) return;
				finale = true;
				finaleAt = (window.performance && performance.now()) || Date.now();
				setCount();
				setBar();
				loader.style.animation = 'none';
				loader.style.transition = 'opacity 0.6s ease';
				loader.style.opacity = '1';
				void loader.offsetWidth;
				loader.style.opacity = '0';
				loader.style.pointerEvents = 'none';
			}

			setTimeout(function () { if (!finale) triggerFinale(); }, 12000);

			if (reduced) return;

			function tick(now) {
				if (!running) return;
				try {
					if (!document.body.contains(loader) && !finale) triggerFinale();

					if (now - lastTick >= 120) {
						lastTick = now;
						if (!finale && (now - t0) >= MIN_SHOW * 1000 && (total === 0 || countDone() === total)) {
							triggerFinale();
						}
					}

					if (finale && (now - finaleAt) >= 700) {
						running = false;
						if (net) net.destroy();
						return;
					}
					requestAnimationFrame(tick);
				} catch (err) {
					running = false;
					if (window.console) { try { console.info('[intro] stopped: ' + err.message); } catch (e) {} }
				}
			}
			requestAnimationFrame(tick);
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
