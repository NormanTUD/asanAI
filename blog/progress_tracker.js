/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS — per-tile dwell + page overview strip

   Active only on pages that contain .course-tile. On every other
   page the script is completely silent (early return, no DOM
   mutation, no listeners).

   Two visualizations on the RIGHT edge of the viewport, both in
   orange (#f97316):

   ── PER-TILE ───────────────────────────────────────────────────
   Each .course-tile gets three children inserted by this script:

     • .tile-progress-bar  — a 5 px strip glued to the RIGHT edge
                             of the tile. Fills with orange as the
                             reader accumulates ≥30 % viewport
                             visibility. Continuous feedback during
                             the 3-second dwell window. At 0 % it's
                             a faint orange trace so the reader can
                             see the indicator exists.

     • .tile-progress-tip  — a tiny "67 %" / "✓" pill in the
                             bottom-right that fades in on hover.
                             Shows the current dwell percentage or
                             "✓" once visited.

     • .tile-visited-badge — a 22×22 orange ✓ circle in the top-
                             right corner. Stays invisible until
                             the 3-second threshold is crossed,
                             then fades+scales in with a small
                             overshoot and persists forever.

   ── PAGE-LEVEL ─────────────────────────────────────────────────
   A thin fixed column on the right edge of the viewport
   (.progress-page-strip). It contains one button per tile,
   positioned at the tile's document Y inside a tall inner
   container that's translated by -scrollY so segments stay
   anchored to their tiles as the page scrolls.

     • Visited tile (≥3 s dwell)   → solid orange segment with glow
     • Unvisited tile              → faint orange trace (20 %)
     • Hover segment               → brightens, scaleX 1.4
     • Click segment               → smooth-scrolls to the tile
     • Native tooltip on segment   → shows the tile title

   Persistence: a single localStorage key `course_progress_v1`.
   Public API: window.CourseProgress.{get,reset}.
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

	let pageStripEl    = null;
	let pageStripInner = null;
	let pageStripSegs  = [];
	let layoutRafPending = false;

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
		} catch (e) { /* disabled / corrupt */ }
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

	function escapeHtml(s) {
		const d = document.createElement('div');
		d.textContent = s == null ? '' : String(s);
		return d.innerHTML;
	}

	/* ── per-tile setup ───────────────────────────────────────── */

	function setupTile(tile) {
		if (!tile.dataset.slug) {
			tile.dataset.slug = getSlugFromHref(tile.getAttribute('href'));
		}

		if (!tile.querySelector(':scope > .tile-progress-bar')) {
			const bar = document.createElement('div');
			bar.className = 'tile-progress-bar';
			bar.setAttribute('aria-hidden', 'true');
			tile.appendChild(bar);
		}

		if (!tile.querySelector(':scope > .tile-progress-tip')) {
			const tip = document.createElement('span');
			tip.className = 'tile-progress-tip';
			tip.setAttribute('aria-hidden', 'true');
			tip.textContent = '0%';
			tile.appendChild(tip);
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
			const tip = tile.querySelector(':scope > .tile-progress-tip');
			if (tip) tip.textContent = '✓';
		}
	}

	function updateTileUI(tile, pct) {
		const bar = tile.querySelector(':scope > .tile-progress-bar');
		if (bar) bar.style.setProperty('--progress', pct + '%');
		const tip = tile.querySelector(':scope > .tile-progress-tip');
		if (tip) tip.textContent = pct >= 100 ? '✓' : (Math.round(pct) + '%');
	}

	function markVisited(tile, idx) {
		tile.classList.add('tile-visited');
		const bar = tile.querySelector(':scope > .tile-progress-bar');
		if (bar) bar.style.setProperty('--progress', '100%');
		const tip = tile.querySelector(':scope > .tile-progress-tip');
		if (tip) tip.textContent = '✓';
		const seg = pageStripSegs[idx];
		if (seg) seg.classList.add('visited');
	}

	/* ── page-level overview strip ────────────────────────────── */

	function buildPageStrip(tiles) {
		pageStripEl = document.createElement('nav');
		pageStripEl.className = 'progress-page-strip';
		pageStripEl.setAttribute('aria-label', 'Course progress overview');

		pageStripInner = document.createElement('div');
		pageStripInner.className = 'progress-page-strip-inner';
		pageStripEl.appendChild(pageStripInner);

		for (let i = 0; i < tiles.length; i++) {
			const tile   = tiles[i];
			const slug   = tile.dataset.slug;
			const titleEl = tile.querySelector('h3');
			const title  = titleEl ? titleEl.textContent.trim() : slug;

			const seg = document.createElement('button');
			seg.type = 'button';
			seg.className = 'progress-page-seg';
			seg.setAttribute('aria-label', 'Scroll to: ' + title);
			seg.title = title;

			const ts = state.tiles[slug];
			if (ts && ts.dwelled) seg.classList.add('visited');

			seg.addEventListener('click', function () {
				const rect = tile.getBoundingClientRect();
				const targetY = rect.top + window.scrollY - 80;
				window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
			});

			pageStripInner.appendChild(seg);
		}

		document.body.appendChild(pageStripEl);
		pageStripSegs = Array.prototype.slice.call(
			pageStripInner.querySelectorAll('.progress-page-seg')
		);

		layoutPageStrip();
	}

	function layoutPageStrip() {
		if (!pageStripInner) return;
		const docH    = document.documentElement.scrollHeight;
		const scrollY = window.scrollY;

		pageStripInner.style.height = docH + 'px';
		pageStripInner.style.transform = 'translateY(' + (-scrollY) + 'px)';

		const tiles = getTiles();
		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const rect = tile.getBoundingClientRect();
			const tileY = rect.top + scrollY;
			const seg = pageStripSegs[i];
			if (!seg) continue;
			seg.style.top = tileY + 'px';
			seg.style.height = Math.max(10, Math.round(rect.height)) + 'px';
		}
	}

	function onScrollOrResize() {
		if (layoutRafPending) return;
		layoutRafPending = true;
		requestAnimationFrame(function () {
			layoutRafPending = false;
			layoutPageStrip();
		});
	}

	/* ── dwell tracking loop ──────────────────────────────────── */

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
				updateTileUI(tile, progressPct);

				if (ts.dwellMs >= DWELL_TIME_MS) {
					ts.dwelled = true;
					ts.lastSeen = Date.now();
					markVisited(tile, i);
					changed = true;
				}
			}
		}

		if (changed) saveState();
		requestAnimationFrame(tick);
	}

	/* ── init ──────────────────────────────────────────────────── */

	function init() {
		loadState();

		const tiles = getTiles();
		if (tiles.length === 0) return;

		for (let i = 0; i < tiles.length; i++) setupTile(tiles[i]);
		buildPageStrip(tiles);

		window.addEventListener('scroll',   onScrollOrResize, { passive: true });
		window.addEventListener('resize',   onScrollOrResize, { passive: true });

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
				const tip = tile.querySelector(':scope > .tile-progress-tip');
				if (tip) tip.textContent = '0%';
			}
			for (let i = 0; i < pageStripSegs.length; i++) {
				pageStripSegs[i].classList.remove('visited');
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
