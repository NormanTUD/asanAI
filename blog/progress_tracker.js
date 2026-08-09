/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS — segmented per-tile "where I've been" bar
   (orange #f97316). Active on every page; on the homepage it just
   paints the bars from saved state, on a subpage it watches the
   scroll position and accumulates dwell time per segment.

   Each .course-tile on the homepage gets two children inserted by
   this script:

     • .tile-progress-bar  — 5 px column on the RIGHT edge with N
                             stacked "segments". Each segment = one
                             equal slice of the linked page's scroll
                             range (10 by default). Filled segments
                             are orange, the rest are a faint
                             orange trace. A segment is marked
                             filled only after ≥3 s of dwell while
                             the viewport sits inside that slice.
                             No transitions, no animation — the
                             state is rendered synchronously on load.

     • .tile-progress-tip  — tiny "60 %" pill, bottom-right,
                             appears on hover. Shows the share of
                             segments that have been filled so far.

   State lives in a single localStorage key `course_progress_v2`:
     { tiles: { [slug]: { segments: [bool;10], lastSeen } } }

   A reset command is logged to the console on every page load so
   power-users can wipe history from devtools without grepping.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	const STORAGE_KEY          = 'course_progress_v2';
	const STORAGE_VERSION      = 2;
	const DWELL_TIME_MS        = 3000;
	const SAVE_DEBOUNCE_MS     = 300;
	const TICK_DT_CAP_MS       = 100;
	const TOTAL_SEGMENTS       = 10;

	function defaultState() {
		return {
			version: STORAGE_VERSION,
			tiles:   Object.create(null),
			updatedAt: 0
		};
	}

	function makeSegments(value) {
		const v = !!value;
		const arr = new Array(TOTAL_SEGMENTS);
		for (let i = 0; i < TOTAL_SEGMENTS; i++) arr[i] = v;
		return arr;
	}

	function normalizeTile(raw) {
		const segments = makeSegments(false);
		if (raw && typeof raw === 'object' && Array.isArray(raw.segments)) {
			for (let i = 0; i < Math.min(raw.segments.length, TOTAL_SEGMENTS); i++) {
				segments[i] = raw.segments[i] === true;
			}
		}
		const lastSeen = raw && isFinite(Number(raw.lastSeen)) && Number(raw.lastSeen) > 0
			? Number(raw.lastSeen)
			: 0;
		return { segments: segments, lastSeen: lastSeen };
	}

	let state   = defaultState();
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
			/* legacy / malformed bar — rebuild segment children */
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

		const segs = (ts && Array.isArray(ts.segments)) ? ts.segments : makeSegments(false);
		const segElements = bar.children;
		let seenCount = 0;
		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			const isFilled = !!segs[i];
			const el = segElements[i];
			if (el) {
				if (isFilled) el.classList.add('filled');
				else          el.classList.remove('filled');
			}
			if (isFilled) seenCount++;
		}

		const pct = Math.round((seenCount / TOTAL_SEGMENTS) * 100);
		tip.textContent = pct + '%';

		if (seenCount === TOTAL_SEGMENTS) {
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
			ts = { segments: makeSegments(false), lastSeen: 0 };
			state.tiles[slug] = ts;
		}
		if (!Array.isArray(ts.segments) || ts.segments.length !== TOTAL_SEGMENTS) {
			ts.segments = makeSegments(false);
		}

		/* Per-segment dwell accumulator, in-memory only.
		   Once a segment is filled we stop counting for it. */
		const segmentDwellMs = new Array(TOTAL_SEGMENTS).fill(0);
		const segmentDone    = new Array(TOTAL_SEGMENTS).fill(false);
		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			segmentDone[i] = ts.segments[i] === true;
		}

		let lastTick     = performance.now();
		let dirty        = false;
		let localSaveTmr = null;

		function flush() {
			localSaveTmr = null;
			if (!dirty) return;
			dirty = false;
			ts.lastSeen = Date.now();
			saveState();
		}

		function tick() {
			const now = performance.now();
			const dt  = (isFinite(now) && isFinite(lastTick))
				? Math.min(Math.max(0, now - lastTick), TICK_DT_CAP_MS)
				: 0;
			lastTick = now;

			if (dt > 0 && document.visibilityState === 'visible' && !document.hidden) {
				const docHeight = document.documentElement.scrollHeight - window.innerHeight;
				if (docHeight > 0) {
					const scrollPct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
					const segIdx = Math.min(TOTAL_SEGMENTS - 1, Math.floor((scrollPct / 100) * TOTAL_SEGMENTS));

					if (!segmentDone[segIdx]) {
						segmentDwellMs[segIdx] += dt;
						if (segmentDwellMs[segIdx] >= DWELL_TIME_MS) {
							segmentDone[segIdx] = true;
							ts.segments[segIdx] = true;
							dirty = true;
							if (localSaveTmr) clearTimeout(localSaveTmr);
							localSaveTmr = setTimeout(flush, SAVE_DEBOUNCE_MS);
						}
					}
				}
			}

			requestAnimationFrame(tick);
		}

		requestAnimationFrame(tick);
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
