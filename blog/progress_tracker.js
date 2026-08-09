/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS — per-tile dwell tracker

   Activates only on pages that contain .course-tile elements
   (i.e. the homepage). Every other page is completely silent:
   no DOM mutations, no event listeners, no UI rendered.

   On the homepage each tile gets two visual elements inserted
   into itself:

     • .tile-progress-bar   — a 5 px strip on the left edge that
                              fills with the tile's accent colour
                              as the reader accumulates ≥30 %
                              viewport visibility. Continuous
                              feedback during the 3-second dwell
                              window.

     • .tile-visited-badge  — a 24×24 green ✓ in the top-right
                              corner. Stays invisible until the
                              3-second threshold is crossed, then
                              fades + scales into view with a tiny
                              overshoot and persists forever.

   Persistence is a single localStorage key, `course_progress_v1`,
   with shape `{ tiles: { [slug]: { dwellMs, dwelled, lastSeen } } }`.
   Nothing leaves the browser.

   Public API (for debug / power users):
     window.CourseProgress.reset()  — wipes all progress
     window.CourseProgress.get()    — returns a JSON copy of state
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	const STORAGE_KEY        = 'course_progress_v1';
	const STORAGE_VERSION    = 1;
	const DWELL_TIME_MS      = 3000;
	const VISIBILITY_THRESHOLD = 0.3;
	const SAVE_DEBOUNCE_MS   = 300;
	const TICK_DT_CAP_MS     = 100;

	function defaultState() {
		return {
			version: STORAGE_VERSION,
			tiles:   Object.create(null),
			updatedAt: 0
		};
	}

	let state = defaultState();
	let saveTimer = null;
	let lastTickTime = null;

	function loadState() {
		try {
			if (typeof localStorage === 'undefined') return;
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (parsed && parsed.version === STORAGE_VERSION && typeof parsed === 'object') {
				state = Object.assign(defaultState(), parsed, {
					tiles: Object.assign(Object.create(null), parsed.tiles || {})
				});
			}
		} catch (e) { /* localStorage disabled / corrupt */ }
	}

	function saveState() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(function () {
			saveTimer = null;
			try {
				state.updatedAt = Date.now();
				localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			} catch (e) { /* quota / private mode */ }
		}, SAVE_DEBOUNCE_MS);
	}

	function getTiles() {
		return Array.prototype.slice.call(document.querySelectorAll('.course-tile'));
	}

	function getSlugFromHref(href) {
		if (!href) return '';
		const cleaned = String(href).split('?')[0].split('#')[0];
		const filename = cleaned.split('/').pop() || '';
		return filename.replace(/\.php$/, '');
	}

	function setupTile(tile) {
		if (!tile.dataset.slug) {
			tile.dataset.slug = getSlugFromHref(tile.getAttribute('href'));
		}

		if (!tile.querySelector(':scope > .tile-progress-bar')) {
			const bar = document.createElement('div');
			bar.className = 'tile-progress-bar';
			bar.setAttribute('aria-hidden', 'true');
			tile.insertBefore(bar, tile.firstChild);
		}

		if (!tile.querySelector(':scope > .tile-visited-badge')) {
			const badge = document.createElement('div');
			badge.className = 'tile-visited-badge';
			badge.setAttribute('aria-hidden', 'true');
			badge.innerHTML =
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
				+ 'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" '
				+ 'aria-hidden="true">'
				+ '<polyline points="20 6 9 17 4 12"/>'
				+ '</svg>';
			tile.appendChild(badge);
		}

		const slug = tile.dataset.slug;
		const ts = slug ? state.tiles[slug] : null;
		if (ts && ts.dwelled) {
			tile.classList.add('tile-visited');
			const bar = tile.querySelector(':scope > .tile-progress-bar');
			if (bar) bar.style.setProperty('--progress', '100%');
		}
	}

	function updateBar(tile, pct) {
		const bar = tile.querySelector(':scope > .tile-progress-bar');
		if (bar) bar.style.setProperty('--progress', pct + '%');
	}

	function markVisited(tile) {
		tile.classList.add('tile-visited');
		const bar = tile.querySelector(':scope > .tile-progress-bar');
		if (bar) bar.style.setProperty('--progress', '100%');
	}

	function tick(now) {
		if (lastTickTime === null) lastTickTime = now;
		const dt = Math.min(now - lastTickTime, TICK_DT_CAP_MS);
		lastTickTime = now;

		const vh = window.innerHeight || document.documentElement.clientHeight || 0;
		const tiles = getTiles();
		let changed = false;

		if (vh > 0) {
			for (let i = 0; i < tiles.length; i++) {
				const tile = tiles[i];
				const slug = tile.dataset.slug;
				if (!slug) continue;

				let ts = state.tiles[slug];
				if (ts && ts.dwelled) continue;

				const rect = tile.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) continue;
				if (rect.bottom <= 0 || rect.top >= vh) continue;

				const visH = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
				const pct  = visH / rect.height;
				if (pct < VISIBILITY_THRESHOLD) continue;

				if (!ts) {
					ts = { dwellMs: 0, dwelled: false, lastSeen: 0 };
					state.tiles[slug] = ts;
				}

				ts.dwellMs += dt;
				const progressPct = Math.min(100, (ts.dwellMs / DWELL_TIME_MS) * 100);
				updateBar(tile, progressPct);

				if (ts.dwellMs >= DWELL_TIME_MS) {
					ts.dwelled = true;
					ts.lastSeen = Date.now();
					markVisited(tile);
					changed = true;
				}
			}
		}

		if (changed) saveState();
		requestAnimationFrame(tick);
	}

	function init() {
		loadState();

		const tiles = getTiles();
		if (tiles.length === 0) return;

		for (let i = 0; i < tiles.length; i++) setupTile(tiles[i]);
		requestAnimationFrame(tick);
	}

	window.CourseProgress = {
		reset: function () {
			state = defaultState();
			saveState();
			const tiles = getTiles();
			for (let i = 0; i < tiles.length; i++) {
				const tile = tiles[i];
				tile.classList.remove('tile-visited');
				const bar = tile.querySelector(':scope > .tile-progress-bar');
				if (bar) bar.style.setProperty('--progress', '0%');
			}
		},
		get: function () {
			return JSON.parse(JSON.stringify(state));
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
