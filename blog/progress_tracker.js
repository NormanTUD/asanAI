/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS — per-tile dwell tracker (orange #f97316)
   Active only on pages that contain .course-tile. Silent
   everywhere else.

   Each .course-tile gets two children inserted by this script:

     • .tile-progress-bar  — 5 px orange strip on the RIGHT edge
                             that fills as ≥30 % viewport coverage
                             accumulates. Continuous feedback
                             during the 3-second dwell window.
                             Faint trace at 0 %, solid orange with
                             glow at 100 %.

     • .tile-progress-tip  — tiny "67 %" pill, bottom-right, fades
                             in on hover. Always shows the current
                             dwell percentage (never a checkmark —
                             the bar filling up *is* the visited
                             indicator).

   Each tile is tracked, stored and shown independently. State
   lives in a single localStorage key `course_progress_v1`:

     { tiles: { [slug]: { dwellMs, dwelled, lastSeen } } }

   A reset command is logged to the console once at startup so
   power-users can wipe history from devtools without grepping
   through source.
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

	function normalizeTile(raw) {
		if (!raw || typeof raw !== 'object') {
			return { dwellMs: 0, dwelled: false, lastSeen: 0 };
		}
		const dwellMs = Number(raw.dwellMs);
		const lastSeen = Number(raw.lastSeen);
		return {
			dwellMs:  isFinite(dwellMs) && dwellMs > 0 ? dwellMs : 0,
			dwelled:  raw.dwelled === true,
			lastSeen: isFinite(lastSeen) && lastSeen > 0 ? lastSeen : 0
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
			if (!parsed || parsed.version !== STORAGE_VERSION || typeof parsed !== 'object') return;

			const normalizedTiles = Object.create(null);
			if (parsed.tiles && typeof parsed.tiles === 'object') {
				for (const slug in parsed.tiles) {
					if (Object.prototype.hasOwnProperty.call(parsed.tiles, slug)) {
						normalizedTiles[slug] = normalizeTile(parsed.tiles[slug]);
					}
				}
			}
			state = {
				version: STORAGE_VERSION,
				tiles: normalizedTiles,
				updatedAt: Number(parsed.updatedAt) || 0
			};
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

		const slug = tile.dataset.slug;
		const ts = slug ? state.tiles[slug] : null;
		if (ts && ts.dwelled) {
			tile.classList.add('tile-visited');
			const bar = tile.querySelector(':scope > .tile-progress-bar');
			if (bar) bar.style.setProperty('--progress', '100%');
			const tip = tile.querySelector(':scope > .tile-progress-tip');
			if (tip) tip.textContent = '100%';
		}
	}

	function updateTileUI(tile, pct) {
		const safe = isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
		const bar = tile.querySelector(':scope > .tile-progress-bar');
		if (bar) bar.style.setProperty('--progress', safe + '%');
		const tip = tile.querySelector(':scope > .tile-progress-tip');
		if (tip) tip.textContent = Math.round(safe) + '%';
	}

	function markVisited(tile) {
		tile.classList.add('tile-visited');
		const bar = tile.querySelector(':scope > .tile-progress-bar');
		if (bar) bar.style.setProperty('--progress', '100%');
	}

	function tick(now) {
		if (lastTickTime === null) lastTickTime = now;
		const dt = (isFinite(now) && isFinite(lastTickTime))
			? Math.min(Math.max(0, now - lastTickTime), TICK_DT_CAP_MS)
			: 0;
		lastTickTime = now;

		const vh = window.innerHeight || document.documentElement.clientHeight || 0;
		const tiles = getTiles();
		let changed = false;

		if (vh > 0 && dt > 0) {
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

				if (!ts || typeof ts.dwellMs !== 'number' || !isFinite(ts.dwellMs)) {
					ts = { dwellMs: 0, dwelled: false, lastSeen: 0 };
					state.tiles[slug] = ts;
				}

				ts.dwellMs += dt;
				const progressPct = Math.min(100, Math.max(0, (ts.dwellMs / DWELL_TIME_MS) * 100));
				updateTileUI(tile, progressPct);

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

		/* One-time hint for power-users / the author. Styled with the
		   same orange accent as the on-tile indicator. */
		console.log(
			'%c Course Progress %c reset →  localStorage.removeItem("course_progress_v1") ',
			'background:#f97316;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px;',
			'background:#fff7ed;color:#f97316;font-family:ui-monospace,Menlo,monospace;padding:2px 6px;border-radius:0 3px 3px 0;border:1px solid #f97316;border-left:none;'
		);

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
				const tip = tile.querySelector(':scope > .tile-progress-tip');
				if (tip) tip.textContent = '0%';
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
