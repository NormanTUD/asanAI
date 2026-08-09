/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS TRACKER — a passive scroll-based "where you've
   been" map for the course homepage.

   Two kinds of progress are tracked independently and merged into
   a single visual overview that lives on the course tiles:

     1. Tile visibility (homepage only)
        ─────────────────────────────
        As the reader scrolls the homepage we measure, for each
        .course-tile, the maximum fraction that was ever visible
        inside the viewport. A thin vertical strip on the left
        edge of the tile fills up in the tile's accent colour as
        that maximum grows; once 60 %+ was visible at any point
        the tile gets a soft "seen" glow. The currently most-
        visible tile gets a slightly stronger "you are here"
        outline so the reader always knows where they are on the
        page.

     2. Module reading depth (each *.php module page)
        ─────────────────────────────────────────────
        While a reader is on a module page (e.g. history.php),
        the maximum scroll percentage they reached is stored
        against that module's slug. The homepage then shows that
        as a second bar per tile in the details panel — so a
        reader can tell at a glance which modules they've actually
        opened and read vs. only skimmed the homepage card.

   Everything is persisted in a single localStorage key
   (`course_progress_v1`) and never leaves the browser. No
   cookies, no server round-trip. There's a "Reset" button in the
   details panel for people who want a clean slate.

   A small floating badge (bottom-right on desktop, bottom-centre
   on mobile) always shows the overall tile-seen percentage and
   expands into a per-tile list grouped by Part.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	/* ───────────────────────── constants ───────────────────────── */

	const STORAGE_KEY       = 'course_progress_v1';
	const STORAGE_VERSION   = 1;
	const TILE_SEEN_OK      = 60;   // % of tile that had to be visible to count as "seen"
	const TILE_CURRENT_MIN  = 12;   // % of tile visible before we treat it as "you are here"
	const SAVE_DEBOUNCE_MS  = 300;
	const SCROLL_RAF_GUARD  = true;

	/* ───────────────────────── state ───────────────────────────── */

	function defaultState() {
		return {
			version: STORAGE_VERSION,
			tiles:   Object.create(null), // slug -> { maxSeen, lastSeen }
			modules: Object.create(null), // slug -> { maxSeen, lastSeen }
			updatedAt: 0
		};
	}

	let state = defaultState();
	let saveTimer = null;

	function loadState() {
		try {
			if (typeof localStorage === 'undefined') return;
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (parsed && parsed.version === STORAGE_VERSION && typeof parsed === 'object') {
				state = Object.assign(defaultState(), parsed, {
					tiles:   Object.assign(Object.create(null), parsed.tiles   || {}),
					modules: Object.assign(Object.create(null), parsed.modules || {})
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

	/* ───────────────────────── helpers ─────────────────────────── */

	function getSlugFromHref(href) {
		if (!href) return '';
		const cleaned = href.split('?')[0].split('#')[0];
		const filename = cleaned.split('/').pop() || '';
		return filename.replace(/\.php$/, '');
	}

	function escapeHtml(s) {
		const d = document.createElement('div');
		d.textContent = s == null ? '' : String(s);
		return d.innerHTML;
	}

	/* ════════════════════════════════════════════════════════════
	   TILE TRACKING (homepage)
	   ════════════════════════════════════════════════════════════ */

	function getTiles() {
		return Array.prototype.slice.call(document.querySelectorAll('.course-tile'));
	}

	function ensureTileMeta(tile) {
		if (!tile.dataset.slug) {
			tile.dataset.slug = getSlugFromHref(tile.getAttribute('href'));
		}
		if (!tile.querySelector(':scope > .tile-progress')) {
			const strip = document.createElement('div');
			strip.className = 'tile-progress';
			strip.setAttribute('aria-hidden', 'true');
			tile.insertBefore(strip, tile.firstChild);
		}
		return tile;
	}

	function applyTileState(tile) {
		const slug = tile.dataset.slug;
		if (!slug) return;
		const ts = state.tiles[slug];
		const pct = ts ? Math.round(ts.maxSeen) : 0;
		tile.style.setProperty('--tile-progress', pct + '%');
		tile.classList.toggle('tile-seen', pct >= TILE_SEEN_OK);
		const strip = tile.querySelector(':scope > .tile-progress');
		if (strip) strip.style.setProperty('--progress', pct + '%');
	}

	let scrollRafPending = false;

	function computeTilePcts() {
		const vh = window.innerHeight || document.documentElement.clientHeight || 0;
		const tiles = getTiles();
		const out = [];
		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			ensureTileMeta(tile);
			const rect = tile.getBoundingClientRect();
			if (rect.bottom <= 0 || rect.top >= vh) {
				out.push({ tile: tile, pct: 0 });
				continue;
			}
			const visTop = Math.max(0, rect.top);
			const visBot = Math.min(vh, rect.bottom);
			const visH  = Math.max(0, visBot - visTop);
			const tileH = rect.height || 1;
			const pct = Math.min(100, Math.max(0, (visH / tileH) * 100));
			out.push({ tile: tile, pct: pct });
		}
		return out;
	}

	function onScrollIndex() {
		if (SCROLL_RAF_GUARD && scrollRafPending) return;
		scrollRafPending = true;
		requestAnimationFrame(function () {
			scrollRafPending = false;
			const vh = window.innerHeight || document.documentElement.clientHeight || 0;
			if (vh <= 0) return;

			const tiles = getTiles();
			let bestTile = null;
			let bestPct  = 0;
			let changed  = false;

			for (let i = 0; i < tiles.length; i++) {
				const tile = tiles[i];
				ensureTileMeta(tile);
				const slug = tile.dataset.slug;
				if (!slug) continue;

				const rect = tile.getBoundingClientRect();
				let pct = 0;
				if (rect.bottom > 0 && rect.top < vh) {
					const visTop = Math.max(0, rect.top);
					const visBot = Math.min(vh, rect.bottom);
					const visH  = Math.max(0, visBot - visTop);
					const tileH = rect.height || 1;
					pct = Math.min(100, Math.max(0, (visH / tileH) * 100));
				}

				if (!state.tiles[slug]) {
					state.tiles[slug] = { maxSeen: 0, lastSeen: 0 };
				}
				if (pct > state.tiles[slug].maxSeen) {
					state.tiles[slug].maxSeen = pct;
					state.tiles[slug].lastSeen = Date.now();
					applyTileState(tile);
					changed = true;
				}

				if (pct > bestPct) {
					bestPct = pct;
					bestTile = tile;
				}
			}

			for (let i = 0; i < tiles.length; i++) {
				tiles[i].classList.remove('tile-current');
			}
			if (bestTile && bestPct > TILE_CURRENT_MIN) {
				bestTile.classList.add('tile-current');
			}

			if (changed) {
				saveState();
				updateBadgeText();
			}
		});
	}

	function initIndex() {
		const tiles = getTiles();
		if (tiles.length === 0) return false;

		for (let i = 0; i < tiles.length; i++) {
			ensureTileMeta(tiles[i]);
			applyTileState(tiles[i]);
		}

		window.addEventListener('scroll', onScrollIndex, { passive: true });
		window.addEventListener('resize', onScrollIndex, { passive: true });
		// Run once after a tick so layout has settled.
		setTimeout(onScrollIndex, 0);
		return true;
	}

	/* ════════════════════════════════════════════════════════════
	   MODULE PAGE TRACKING (every *.php except index*)
	   ════════════════════════════════════════════════════════════ */

	function getCurrentModuleSlug() {
		const path = window.location.pathname;
		const filename = (path.split('?')[0].split('#')[0].split('/').pop() || '');
		const slug = filename.replace(/\.php$/, '');
		if (!slug || slug === 'index' || slug === 'index_full') return null;
		return slug;
	}

	function ensureModuleBar() {
		let bar = document.getElementById('module-progress-bar');
		if (bar) return bar;
		bar = document.createElement('div');
		bar.id = 'module-progress-bar';
		bar.className = 'module-progress-bar';
		bar.innerHTML = '<div class="module-progress-bar-fill"></div>';
		document.body.appendChild(bar);
		return bar;
	}

	function initModule() {
		const slug = getCurrentModuleSlug();
		if (!slug) return false;

		const bar = ensureModuleBar();
		const fill = bar.querySelector('.module-progress-bar-fill');

		let rafPending = false;
		function update() {
			rafPending = false;
			const docH = document.documentElement.scrollHeight - window.innerHeight;
			const scrollY = window.scrollY || window.pageYOffset || 0;
			const pct = docH > 0 ? Math.min(100, Math.max(0, (scrollY / docH) * 100)) : 0;

			fill.style.width = pct + '%';

			if (!state.modules[slug]) {
				state.modules[slug] = { maxSeen: 0, lastSeen: 0 };
			}
			if (pct > state.modules[slug].maxSeen) {
				state.modules[slug].maxSeen = pct;
				state.modules[slug].lastSeen = Date.now();
				saveState();
			}
		}
		function onScroll() {
			if (rafPending) return;
			rafPending = true;
			requestAnimationFrame(update);
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		update();
		return true;
	}

	/* ════════════════════════════════════════════════════════════
	   OVERALL BADGE + DETAILS PANEL (homepage only)
	   ════════════════════════════════════════════════════════════ */

	function computeOverall() {
		const tiles = getTiles();
		const total = tiles.length;
		if (total === 0) {
			return { tilePct: 0, modulePct: 0, seenCount: 0, totalCount: 0, moduleReadCount: 0 };
		}
		let totalTile = 0;
		let seenCount = 0;
		for (let i = 0; i < tiles.length; i++) {
			const slug = tiles[i].dataset.slug;
			const ts = state.tiles[slug] || { maxSeen: 0 };
			totalTile += ts.maxSeen;
			if (ts.maxSeen >= TILE_SEEN_OK) seenCount++;
		}

		let moduleTotal = 0;
		let moduleReadCount = 0;
		let moduleOpenedCount = 0;
		for (let i = 0; i < tiles.length; i++) {
			const slug = tiles[i].dataset.slug;
			const ms = state.modules[slug];
			if (ms && ms.maxSeen > 0) {
				moduleTotal += ms.maxSeen;
				moduleOpenedCount++;
				if (ms.maxSeen >= 60) moduleReadCount++;
			}
		}

		return {
			tilePct:        Math.round(totalTile / total),
			modulePct:      moduleOpenedCount > 0 ? Math.round(moduleTotal / moduleOpenedCount) : 0,
			seenCount:      seenCount,
			totalCount:     total,
			moduleReadCount: moduleReadCount
		};
	}

	function createBadge() {
		if (document.getElementById('course-progress-badge')) return;

		const wrap = document.createElement('div');
		wrap.id = 'course-progress-badge';
		wrap.className = 'course-progress-badge';
		wrap.innerHTML =
			'<button type="button" class="cpb-toggle" aria-label="Course progress" title="Course progress">' +
				'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
					'<path d="M3 3v18h18"/>' +
					'<path d="M7 14l3-3 3 3 5-6"/>' +
				'</svg>' +
				'<span class="cpb-pct">0%</span>' +
			'</button>' +
			'<div class="cpb-panel" hidden role="dialog" aria-label="Course progress">' +
				'<header class="cpb-head">' +
					'<h3>Course progress</h3>' +
					'<button type="button" class="cpb-close" aria-label="Close panel">&times;</button>' +
				'</header>' +
				'<div class="cpb-summary">' +
					'<div class="cpb-stat">' +
						'<span class="cpb-stat-val" data-stat="tile">0%</span>' +
						'<span class="cpb-stat-label">homepage tiles seen</span>' +
					'</div>' +
					'<div class="cpb-stat">' +
						'<span class="cpb-stat-val" data-stat="module">0%</span>' +
						'<span class="cpb-stat-label">modules read</span>' +
					'</div>' +
				'</div>' +
				'<div class="cpb-legend">' +
					'<span><i class="cpb-leg cpb-leg-tile"></i> tile</span>' +
					'<span><i class="cpb-leg cpb-leg-mod"></i> module</span>' +
					'<span class="cpb-hint">Bars show the deepest scroll you reached</span>' +
				'</div>' +
				'<ul class="cpb-list" role="list"></ul>' +
				'<footer class="cpb-foot">' +
					'<button type="button" class="cpb-reset">Reset all progress</button>' +
				'</footer>' +
			'</div>';

		document.body.appendChild(wrap);

		const panel = wrap.querySelector('.cpb-panel');

		wrap.querySelector('.cpb-toggle').addEventListener('click', function (e) {
			e.stopPropagation();
			if (panel.hidden) {
				renderPanel();
				panel.hidden = false;
			} else {
				panel.hidden = true;
			}
		});

		wrap.querySelector('.cpb-close').addEventListener('click', function () {
			panel.hidden = true;
		});

		wrap.querySelector('.cpb-reset').addEventListener('click', function () {
			if (!window.confirm('Reset all course progress? This cannot be undone.')) return;
			state = defaultState();
			saveState();
			getTiles().forEach(function (t) {
				t.style.removeProperty('--tile-progress');
				t.classList.remove('tile-seen', 'tile-current');
				const s = t.querySelector(':scope > .tile-progress');
				if (s) s.style.setProperty('--progress', '0%');
			});
			renderPanel();
			updateBadgeText();
		});

		document.addEventListener('click', function (e) {
			if (panel.hidden) return;
			if (!wrap.contains(e.target)) panel.hidden = true;
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !panel.hidden) panel.hidden = true;
		});
	}

	function updateBadgeText() {
		const wrap = document.getElementById('course-progress-badge');
		if (!wrap) return;
		const o = computeOverall();
		const pctLabel = wrap.querySelector('.cpb-pct');
		if (pctLabel) pctLabel.textContent = o.tilePct + '%';
		const tileStat  = wrap.querySelector('[data-stat="tile"]');
		const moduleStat = wrap.querySelector('[data-stat="module"]');
		if (tileStat)   tileStat.textContent   = o.tilePct + '%';
		if (moduleStat) moduleStat.textContent = o.modulePct + '%';
	}

	function buildListItem(tile) {
		const slug = tile.dataset.slug;
		const titleEl = tile.querySelector('h3');
		const title = titleEl ? titleEl.textContent.trim() : slug;
		const href  = tile.getAttribute('href') || '#';
		const ts = state.tiles[slug]   || { maxSeen: 0 };
		const ms = state.modules[slug] || { maxSeen: 0 };

		const tilePct  = Math.round(ts.maxSeen);
		const modulePct = Math.round(ms.maxSeen);

		const li = document.createElement('li');
		li.className = 'cpb-item';
		if (tilePct >= TILE_SEEN_OK) li.classList.add('cpb-item-seen');
		if (modulePct >= 80) li.classList.add('cpb-item-read');

		li.innerHTML =
			'<a class="cpb-link" href="' + escapeHtml(href) + '">' +
				'<span class="cpb-title">' + escapeHtml(title) + '</span>' +
				'<span class="cpb-meta">' +
					'<span class="cpb-bar cpb-bar-tile" title="Tile seen: ' + tilePct + '%">' +
						'<span class="cpb-bar-fill" style="width:' + tilePct + '%"></span>' +
						'<span class="cpb-bar-num">' + tilePct + '%</span>' +
					'</span>' +
					'<span class="cpb-bar cpb-bar-mod" title="Module read: ' + modulePct + '%">' +
						'<span class="cpb-bar-fill" style="width:' + modulePct + '%"></span>' +
						'<span class="cpb-bar-num">' + modulePct + '%</span>' +
					'</span>' +
				'</span>' +
			'</a>';
		return li;
	}

	function renderPanel() {
		const wrap = document.getElementById('course-progress-badge');
		if (!wrap) return;
		const list = wrap.querySelector('.cpb-list');
		const tiles = getTiles();

		updateBadgeText();

		list.innerHTML = '';
		const frag = document.createDocumentFragment();

		const parts = Array.prototype.slice.call(document.querySelectorAll('.course-part'));
		if (parts.length > 0) {
			for (let p = 0; p < parts.length; p++) {
				const partEl = parts[p];
				const headerEl = partEl.querySelector('.course-part-header h2');
				const partName = headerEl ? headerEl.textContent.trim() : ('Part ' + (p + 1));
				const partTiles = Array.prototype.slice.call(partEl.querySelectorAll('.course-tile'));
				let seen = 0;
				for (let i = 0; i < partTiles.length; i++) {
					const slug = partTiles[i].dataset.slug;
					const ts = state.tiles[slug] || { maxSeen: 0 };
					if (ts.maxSeen >= TILE_SEEN_OK) seen++;
				}
				const head = document.createElement('li');
				head.className = 'cpb-part';
				head.innerHTML =
					'<span class="cpb-part-name">' + escapeHtml(partName) + '</span>' +
					'<span class="cpb-part-count">' + seen + ' / ' + partTiles.length + '</span>';
				frag.appendChild(head);

				for (let i = 0; i < partTiles.length; i++) {
					frag.appendChild(buildListItem(partTiles[i]));
				}
			}
		} else {
			for (let i = 0; i < tiles.length; i++) {
				frag.appendChild(buildListItem(tiles[i]));
			}
		}

		list.appendChild(frag);
	}

	/* ════════════════════════════════════════════════════════════
	   INIT
	   ════════════════════════════════════════════════════════════ */

	function init() {
		loadState();

		const isIndex = getTiles().length > 0;

		if (isIndex) {
			createBadge();
			initIndex();
			updateBadgeText();
		}

		initModule();
	}

	/* ─── public API (small, just for power users / debug) ─── */

	window.CourseProgress = {
		reset: function () {
			state = defaultState();
			saveState();
		},
		get: function () {
			return JSON.parse(JSON.stringify(state));
		},
		_clearVisuals: function () {
			getTiles().forEach(function (t) {
				t.classList.remove('tile-seen', 'tile-current');
				const s = t.querySelector(':scope > .tile-progress');
				if (s) s.style.setProperty('--progress', '0%');
			});
			updateBadgeText();
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
