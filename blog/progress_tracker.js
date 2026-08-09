/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS — segmented per-tile "where I've been" bar
   (orange #f97316). Active on every page; on the homepage it just
   paints the bars from saved state, on a subpage it watches the
   scroll position and remembers the maximum scroll percentage the
   user has reached.

   Each .course-tile on the homepage gets two children inserted by
   this script:

     • .tile-progress-bar  — 5 px column on the RIGHT edge with 10
                             stacked segments. Each segment fills
                             1/10 of the bar's height (no gap, no
                             padding). A segment is filled iff the
                             user has ever scrolled past the top of
                             its corresponding slice of the linked
                             page. Filled segments are solid orange,
                             the rest are a faint orange trace.
                             No transitions, no animation — the
                             state is rendered synchronously on load.

     • .tile-progress-tip  — tiny "60 %" pill, bottom-right,
                             appears on hover. Shows the deepest
                             scroll percentage reached.

   State lives in a single localStorage key `course_progress_v3`:
     { tiles: { [slug]: { maxScrollPct, lastSeen } } }

   A reset command is logged to the console on every page load so
   power-users can wipe history from devtools without grepping.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	const STORAGE_KEY          = 'course_progress_v3';
	const STORAGE_VERSION      = 3;
	const SAVE_DEBOUNCE_MS     = 300;
	const SCROLL_THROTTLE_MS   = 100;
	const TOTAL_SEGMENTS       = 10;
	const SEGMENT_HEIGHT_PCT   = 100 / TOTAL_SEGMENTS;

	function defaultState() {
		return {
			version: STORAGE_VERSION,
			tiles:   Object.create(null),
			updatedAt: 0
		};
	}

	function normalizeTile(raw) {
		let maxScrollPct = 0;
		if (raw && typeof raw === 'object') {
			if (typeof raw.maxScrollPct === 'number' && isFinite(raw.maxScrollPct)) {
				maxScrollPct = Math.min(100, Math.max(0, raw.maxScrollPct));
			} else if (Array.isArray(raw.segments)) {
				/* Migrate from v2: segments[0..9] of booleans → maxScrollPct */
				let trueCount = 0;
				for (let i = 0; i < Math.min(raw.segments.length, TOTAL_SEGMENTS); i++) {
					if (raw.segments[i] === true) trueCount++;
				}
				maxScrollPct = trueCount * SEGMENT_HEIGHT_PCT;
			}
		}
		const lastSeen = raw && isFinite(Number(raw.lastSeen)) && Number(raw.lastSeen) > 0
			? Number(raw.lastSeen)
			: 0;
		return { maxScrollPct: maxScrollPct, lastSeen: lastSeen };
	}

	let state     = defaultState();
	let saveTimer = null;

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
				tiles:   normalizedTiles,
				updatedAt: Number(parsed.updatedAt) || 0
			};
		} catch (e) { /* disabled / corrupt — keep default */ }
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

	function getCurrentSlug() {
		return getSlugFromHref(window.location.pathname);
	}

	function buildBar() {
		const bar = document.createElement('div');
		bar.className = 'tile-progress-bar';
		bar.setAttribute('aria-hidden', 'true');
		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			const seg = document.createElement('span');
			seg.className = 'seg';
			bar.appendChild(seg);
		}
		return bar;
	}

	function buildTip() {
		const tip = document.createElement('span');
		tip.className = 'tile-progress-tip';
		tip.setAttribute('aria-hidden', 'true');
		tip.textContent = '0%';
		return tip;
	}

	function renderTile(tile, ts) {
		let bar = tile.querySelector(':scope > .tile-progress-bar');
		if (!bar) {
			bar = buildBar();
			tile.appendChild(bar);
		} else if (bar.children.length !== TOTAL_SEGMENTS) {
			bar.innerHTML = '';
			for (let i = 0; i < TOTAL_SEGMENTS; i++) {
				const seg = document.createElement('span');
				seg.className = 'seg';
				bar.appendChild(seg);
			}
		}

		let tip = tile.querySelector(':scope > .tile-progress-tip');
		if (!tip) {
			tip = buildTip();
			tile.appendChild(tip);
		}

		const maxScroll  = (ts && typeof ts.maxScrollPct === 'number') ? ts.maxScrollPct : 0;
		const segsFilled = Math.min(
			TOTAL_SEGMENTS,
			Math.max(0, Math.floor(maxScroll / SEGMENT_HEIGHT_PCT))
		);

		const segElements = bar.children;
		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			const isFilled = i < segsFilled;
			const el = segElements[i];
			if (el) {
				if (isFilled) el.classList.add('filled');
				else          el.classList.remove('filled');
			}
		}

		const pct = Math.round(maxScroll);
		tip.textContent = pct + '%';

		if (segsFilled === TOTAL_SEGMENTS) {
			tile.classList.add('tile-visited');
		} else {
			tile.classList.remove('tile-visited');
		}
	}

	function setupTile(tile) {
		if (!tile.dataset.slug) {
			tile.dataset.slug = getSlugFromHref(tile.getAttribute('href'));
		}
		const slug = tile.dataset.slug;
		const ts   = slug ? state.tiles[slug] : null;
		renderTile(tile, ts);
	}

	function trackSubpage(slug) {
		if (!slug) return;

		let ts = state.tiles[slug];
		if (!ts) {
			ts = { maxScrollPct: 0, lastSeen: 0 };
			state.tiles[slug] = ts;
		}
		if (typeof ts.maxScrollPct !== 'number' || !isFinite(ts.maxScrollPct)) {
			ts.maxScrollPct = 0;
		}

		let dirty        = false;
		let localSaveTmr = null;

		function flush() {
			localSaveTmr = null;
			if (!dirty) return;
			dirty = false;
			ts.lastSeen = Date.now();
			saveState();
		}

		function updateScroll() {
			const scrollHeight = document.documentElement.scrollHeight;
			const innerHeight  = window.innerHeight || 0;
			if (innerHeight <= 0 || scrollHeight <= innerHeight) {
				/* Page fits in viewport, hasn't loaded yet, or is empty.
				   Never auto-mark as fully seen — a page that just
				   opened has not been "read" yet. We only respond to
				   real scroll events. */
				return;
			}
			const docHeight = scrollHeight - innerHeight;
			const scrollPct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
			if (scrollPct > ts.maxScrollPct + 0.5) {
				ts.maxScrollPct = scrollPct;
				dirty = true;
				if (localSaveTmr) clearTimeout(localSaveTmr);
				localSaveTmr = setTimeout(flush, SAVE_DEBOUNCE_MS);
			}
		}

		let scrollTickTimer = null;
		function onScroll() {
			if (scrollTickTimer) return;
			scrollTickTimer = setTimeout(function () {
				scrollTickTimer = null;
				updateScroll();
			}, SCROLL_THROTTLE_MS);
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		/* No initial updateScroll() — the bar starts empty and only
		   fills as the user actually scrolls. */
	}

	function logResetHint() {
		console.log(
			'%c Course Progress %c reset →  localStorage.removeItem("' + STORAGE_KEY + '") ',
			'background:#f97316;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px;',
			'background:#fff7ed;color:#f97316;font-family:ui-monospace,Menlo,monospace;padding:2px 6px;border-radius:0 3px 3px 0;border:1px solid #f97316;border-left:none;'
		);
	}

	function init() {
		loadState();

		/* Console hint is logged on every page load, not just on the
		   homepage, so a user on any subpage can find the reset cmd. */
		logResetHint();

		const tiles = getTiles();
		if (tiles.length > 0) {
			for (let i = 0; i < tiles.length; i++) setupTile(tiles[i]);
			return;
		}

		const slug = getCurrentSlug();
		if (slug && slug !== 'index' && slug !== 'index_full') {
			trackSubpage(slug);
		}
	}

	window.CourseProgress = {
		reset: function () {
			state = defaultState();
			try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
			const tiles = getTiles();
			for (let i = 0; i < tiles.length; i++) {
				const tile = tiles[i];
				tile.classList.remove('tile-visited');
				const bar = tile.querySelector(':scope > .tile-progress-bar');
				if (bar) {
					for (let j = 0; j < bar.children.length; j++) {
						bar.children[j].classList.remove('filled');
					}
				}
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
