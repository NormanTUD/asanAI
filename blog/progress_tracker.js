/* ════════════════════════════════════════════════════════════════
   COURSE PROGRESS — per-tile "where I've read" bar (orange #f97316).

   Each .course-tile gets a 5 px column on its RIGHT edge
   (.tile-progress-bar). The bar is a MAP of the whole chapter: top =
   start of the chapter, bottom = end. Every part the reader has read
   is coloured orange at its own position; everything else stays the
   dim base colour. One colour only, no percentage.

   Tracking (lesson pages): a chapter is split into SLOTS (100 slots of
   1 % of the page length each — relative, so a page that grows or
   shrinks keeps its marks in place). Everything that passes through
   the visible window while scrolling counts as read (checked at most
   every MARK_EVERY_MS; the stretch between two checks is filled in for
   normal scrolling, but not for jumps via TOC/links). The state is
   written to localStorage immediately.

   State lives in a single localStorage key `course_progress`:
      { tiles: {
          [slug]: {
            slots,          // string of SLOT_COUNT chars, '1' = read
            maxScrollPct,   // derived: read slots in %
            lastSeen
          }
      }, updatedAt }

   Older shapes (`bands: [{ms, dwelled}]`, `segments: [bool;10]`, raw
   `maxScrollPct`) are converted to slots on load.

   Reset only via the JS console: `CourseProgress.reset()` (the command
   is logged to the console on every page load).
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	const STORAGE_KEY  = 'course_progress';
	const SLOT_COUNT   = 100;
	const MARK_EVERY_MS = 500;
	const OLD_SEGMENTS = 10;

	function defaultState() {
		return {
			tiles:     Object.create(null),
			updatedAt: 0
		};
	}

	function emptySlots() {
		return new Array(SLOT_COUNT + 1).join('0');
	}

	/* Altdaten (Bänder / Segmente / Prozent) in Slots umrechnen */
	function normalizeTile(raw) {
		let slots = null;

		if (raw && typeof raw === 'object') {
			if (typeof raw.slots === 'string' && raw.slots.length === SLOT_COUNT) {
				slots = raw.slots.replace(/[^1]/g, '0');
			} else if (Array.isArray(raw.bands) && raw.bands.length > 0) {
				const n = raw.bands.length;
				let s = '';
				for (let j = 0; j < SLOT_COUNT; j++) {
					const b = raw.bands[Math.min(n - 1, Math.floor(j * n / SLOT_COUNT))];
					s += (b && (b.dwelled || Number(b.ms) >= 3000)) ? '1' : '0';
				}
				slots = s;
			} else if (Array.isArray(raw.segments)) {
				let s = '';
				for (let j = 0; j < SLOT_COUNT; j++) {
					s += raw.segments[Math.floor(j * OLD_SEGMENTS / SLOT_COUNT)] === true ? '1' : '0';
				}
				slots = s;
			} else if (typeof raw.maxScrollPct === 'number' && isFinite(raw.maxScrollPct)) {
				const k = Math.round(Math.min(100, Math.max(0, raw.maxScrollPct)) / 100 * SLOT_COUNT);
				slots = new Array(k + 1).join('1') + new Array(SLOT_COUNT - k + 1).join('0');
			}
		}
		if (!slots) slots = emptySlots();

		const lastSeen = raw && isFinite(Number(raw.lastSeen)) && Number(raw.lastSeen) > 0
			? Number(raw.lastSeen)
			: 0;

		return {
			slots:        slots,
			maxScrollPct: readPct(slots),
			lastSeen:     lastSeen
		};
	}

	function readPct(slots) {
		const m = slots.match(/1/g);
		return m ? (m.length / SLOT_COUNT) * 100 : 0;
	}

	let state = defaultState();
	let lsWarned = false;
	let storeReady = false;   // erst nach dem ersten IndexedDB-Lesen schreiben

	function parseState(parsed) {
		if (!parsed || typeof parsed !== 'object') return null;
		const normalizedTiles = Object.create(null);
		if (parsed.tiles && typeof parsed.tiles === 'object') {
			for (const slug in parsed.tiles) {
				if (Object.prototype.hasOwnProperty.call(parsed.tiles, slug)) {
					normalizedTiles[slug] = normalizeTile(parsed.tiles[slug]);
				}
			}
		}
		return { tiles: normalizedTiles, updatedAt: Number(parsed.updatedAt) || 0 };
	}

	/* den neueren Stand übernehmen (Speicher vs. gelesener Stand) */
	function adoptIfNewer(s) {
		if (s && s.updatedAt >= state.updatedAt) { state = s; return true; }
		return false;
	}

	/* localStorage lesen (synchron, schnell). Ist er voll oder blockiert,
	   bleibt der Stand im Speicher bzw. kommt aus IndexedDB (idbLoad). */
	function loadState() {
		try {
			if (typeof localStorage === 'undefined') return;
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			adoptIfNewer(parseState(JSON.parse(raw)));
		} catch (e) { /* disabled / corrupt — keep what we have */ }
	}

	/* ── IndexedDB als zweiter, robuster Speicher ──────────────────
	   localStorage ist pro Adresse auf ~5 MB begrenzt und wird auf
	   localhost mit dem Toolkit geteilt (das dort ganze Modelle ablegt).
	   Ist er voll, schlägt das Schreiben still fehl und der Fortschritt
	   wäre nach F5 weg. IndexedDB hat viel mehr Platz. */
	const IDB_NAME = 'asanai_blog';
	const IDB_STORE = 'kv';
	let idbPromise = null;

	function idb() {
		if (idbPromise) return idbPromise;
		idbPromise = new Promise(function (resolve) {
			try {
				if (!window.indexedDB) { resolve(null); return; }
				const req = indexedDB.open(IDB_NAME, 1);
				req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
				req.onsuccess = function () { resolve(req.result); };
				req.onerror = function () { resolve(null); };
				req.onblocked = function () { resolve(null); };
			} catch (e) { resolve(null); }
		});
		return idbPromise;
	}

	function idbSave(json) {
		idb().then(function (db) {
			if (!db) return;
			try { db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(json, STORAGE_KEY); } catch (e) { /* ignore */ }
		});
	}

	/* IndexedDB lesen und übernehmen, falls neuer → callback(changed) */
	function idbLoad(cb) {
		idb().then(function (db) {
			if (!db) { cb(false); return; }
			try {
				const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(STORAGE_KEY);
				req.onsuccess = function () {
					let s = null;
					try { s = req.result ? parseState(JSON.parse(req.result)) : null; } catch (e) { s = null; }
					cb(adoptIfNewer(s));
				};
				req.onerror = function () { cb(false); };
			} catch (e) { cb(false); }
		});
	}

	/* sofort speichern — in localStorage UND IndexedDB */
	function saveState() {
		state.updatedAt = Date.now();
		const json = JSON.stringify(state);
		try {
			localStorage.setItem(STORAGE_KEY, json);
		} catch (e) {
			if (!lsWarned) {
				lsWarned = true;
				try { console.warn('Course Progress: localStorage is full or blocked — saving to IndexedDB instead.'); } catch (e2) {}
			}
		}
		idbSave(json);
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

	/* Der Balken steht für die ganze Länge des Kapitels: jede gelesene
	   Stelle wird an ihrer Position orange (nur eine Farbe). */
	function readMapGradient(ts) {
		const slots = (ts && typeof ts.slots === 'string') ? ts.slots : emptySlots();
		const stops = [];
		let run = slots.charAt(0);
		let start = 0;
		for (let i = 1; i <= SLOT_COUNT; i++) {
			const c = i < SLOT_COUNT ? slots.charAt(i) : null;
			if (c !== run) {
				const color = run === '1' ? 'var(--cp-orange)' : 'var(--cp-orange-dim)';
				stops.push(color + ' ' + (start / SLOT_COUNT * 100).toFixed(2) + '% ' + (i / SLOT_COUNT * 100).toFixed(2) + '%');
				run = c;
				start = i;
			}
		}
		return 'linear-gradient(to bottom, ' + stops.join(', ') + ')';
	}

	function renderTile(tile, ts) {
		let bar = tile.querySelector(':scope > .tile-progress-bar');
		if (!bar) {
			bar = document.createElement('div');
			bar.className = 'tile-progress-bar tile-progress-map';
			bar.setAttribute('aria-hidden', 'true');
			tile.appendChild(bar);
		}
		const tip = tile.querySelector(':scope > .tile-progress-tip');
		if (tip) tip.remove();
		bar.innerHTML = '';
		bar.classList.add('tile-progress-map');
		bar.style.background = readMapGradient(ts);

		const allRead = !!(ts && typeof ts.slots === 'string' && ts.slots.indexOf('0') === -1);
		if (allRead) tile.classList.add('tile-visited');
		else         tile.classList.remove('tile-visited');
	}

	function setupTile(tile) {
		if (!tile.dataset.slug) {
			tile.dataset.slug = getSlugFromHref(tile.getAttribute('href'));
		}
		const slug = tile.dataset.slug;
		renderTile(tile, slug ? state.tiles[slug] : null);
	}

	function paintTiles() {
		const tiles = getTiles();
		for (let i = 0; i < tiles.length; i++) setupTile(tiles[i]);
	}

	/* Inhalt sichtbar? (Lade-Bildschirm weg, #contents eingeblendet) */
	function contentShown() {
		if (!document.documentElement.classList.contains('is-ready')) return false;
		const c = document.getElementById('contents');
		return !c || c.style.display !== 'none';
	}

	function trackSubpage(slug) {
		if (!slug) return;

		let markTimer = null;
		let lastTop   = null;   // Scrollposition beim letzten Markieren
		let pageReady = false;

		/* sichtbaren Bereich als gelesen markieren und sofort speichern */
		function markVisible() {
			markTimer = null;
			if (!storeReady || !pageReady || !contentShown() || document.visibilityState !== 'visible') return;
			const doc = document.documentElement;
			const total = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
			const view  = window.innerHeight || 0;
			if (total <= 0 || view <= 0) return;
			const top = Math.max(0, window.scrollY || doc.scrollTop || 0);
			// von der letzten bis zur aktuellen Position alles mitnehmen — aber
			// nur bei normalem Scrollen, nicht bei Sprüngen (TOC, Links)
			const fill = lastTop !== null && Math.abs(top - lastTop) <= 2 * view;
			const lo = fill ? Math.min(lastTop, top) : top;
			const hi = fill ? Math.max(lastTop, top) : top;
			lastTop = top;
			const from = Math.max(0, Math.floor(lo / total * SLOT_COUNT));
			const to   = Math.min(SLOT_COUNT - 1, Math.ceil((hi + view) / total * SLOT_COUNT) - 1);			if (to < from) return;

			// frisch laden: ein anderer Tab kann inzwischen geschrieben haben
			loadState();
			const ts = state.tiles[slug] || normalizeTile(null);
			let slots = ts.slots;
			let changed = false;
			for (let i = from; i <= to; i++) {
				if (slots.charAt(i) !== '1') {
					slots = slots.slice(0, i) + '1' + slots.slice(i + 1);
					changed = true;
				}
			}
			if (!changed && state.tiles[slug]) return;
			ts.slots        = slots;
			ts.maxScrollPct = readPct(slots);
			ts.lastSeen     = Date.now();
			state.tiles[slug] = ts;
			saveState();
			paintTiles(); // Kacheln auf dieser Seite sofort mitziehen
		}

		/* Alles, was beim Scrollen durchs Fenster läuft, zählt als gelesen.
		   Gedrosselt: höchstens alle MARK_EVERY_MS ein Durchgang. Damit beim
		   schnellen Scrollen keine Lücken entstehen, wird zusätzlich der
		   Bereich zwischen letzter und aktueller Position mit markiert. */
		function queueMark() {
			if (markTimer) return;
			markTimer = setTimeout(markVisible, MARK_EVERY_MS);
		}

		window.addEventListener('scroll', queueMark, { passive: true });
		window.addEventListener('resize', queueMark, { passive: true });
		document.addEventListener('visibilitychange', function () {
			if (document.visibilityState === 'visible') queueMark();
		});
		// Erst messen, wenn der Inhalt wirklich angezeigt wird (revealContent()
		// setzt html.is-ready und blendet #contents ein) — solange der
		// Lade-Bildschirm liegt, ist die Seite nur ein Fenster hoch und alles
		// würde als gelesen gelten.
		if (contentShown()) {
			pageReady = true;
		} else {
			const mo = new MutationObserver(function () {
				if (!contentShown()) return;
				mo.disconnect();
				pageReady = true;
				lastTop = null;
				queueMark();
			});
			mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		}
		// Beim Verlassen den letzten Stand noch mitnehmen
		window.addEventListener('pagehide', markVisible);

		if (pageReady) queueMark();
	}

	function logResetHint() {
		const label    = '%c Course Progress %c';
		const cmd      = 'reset →  CourseProgress.reset()';
		const cssLabel = 'background:#f97316;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px;';
		const cssCmd   = 'background:#fff7ed;color:#f97316;font-family:ui-monospace,Menlo,monospace;padding:2px 6px;border-radius:0 3px 3px 0;border:1px solid #f97316;border-left:none;';
		try {
			console.log(label + ' ' + cmd, cssLabel, cssCmd);
		} catch (e) {
			try { console.warn('Course Progress: reset with CourseProgress.reset()'); } catch (e2) {}
		}
	}

	function init() {
		try {
			loadState();
			logResetHint();

			// Kacheln (Startseite, aber auch Kacheln auf Lektionsseiten) malen
			// und neu malen, sobald sich der Stand geändert haben kann:
			// zurück zur Seite (bfcache), Tab wieder sichtbar, anderer Tab.
			paintTiles();
			// IndexedDB nachladen (asynchron) — falls dort ein neuerer Stand
			// liegt, z. B. weil localStorage voll ist, neu malen
			idbLoad(function (changed) {
				storeReady = true;
				if (changed) paintTiles();
			});
			const repaint = function () {
				loadState();
				paintTiles();
				idbLoad(function (changed) { if (changed) paintTiles(); });
			};
			window.addEventListener('pageshow', repaint);
			document.addEventListener('visibilitychange', function () {
				if (document.visibilityState === 'visible') repaint();
			});
			window.addEventListener('storage', function (e) {
				if (!e.key || e.key === STORAGE_KEY) repaint();
			});

			// Lektionsseite → mitlesen (unabhängig davon, ob Kacheln da sind)
			const slug = getCurrentSlug();
			if (slug && slug !== 'index' && slug !== 'index_full' && slug !== 'blog' && !document.querySelector('.course-overview')) {
				trackSubpage(slug);
			}
		} catch (e) {
			try { console.error('CourseProgress init error:', e); } catch (e2) {}
		}
	}

	window.CourseProgress = {
		reset: function () {
			// leeren Stand mit neuem Zeitstempel in BEIDE Speicher schreiben,
			// damit kein älterer Stand (localStorage / IndexedDB) zurückkommt
			state = defaultState();
			try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
			saveState();
			paintTiles();
			return 'Course progress reset.';
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
