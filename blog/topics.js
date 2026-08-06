/* ════════════════════════════════════════════════════════════════
   BLOG TOPICS — a personal "interest picker" that lets the reader
   decide which corners of the course they want to see.

   • A small 🎯 button lives next to the dark-mode toggle.
   • Clicking it opens a checklist of ~15 topic tiles (math, history,
     philosophy, hardware, …) with icons and one-line descriptions.
   • Choices are persisted in a single cookie (`topics_pref`).
   • Authored markdown sections wrapped in
         [[t:math]]
         …section content…
         [[/t]]
     collapse to a small "skipped" banner (click to expand) when
     the matching topic is unchecked. They never vanish completely.
   • Course tiles on the home page carry optional `data-topics="…"`
     metadata; tiles whose every topic is unchecked fade back so
     the reader can still see they exist.

   The design goal: playful and lightweight. No accounts, no popups,
   no penalty for ignoring it. Just a quiet dial you can turn.
   ════════════════════════════════════════════════════════════════ */

(function () {
	'use strict';

	/* ── 1. Topic registry (single source of truth) ─────────────
	   Math is split into three levels (i = HS, ii = undergrad,
	   iii = grad / research) so a reader can opt in only to the
	   depth they actually want. A page that combines levels can
	   list several, e.g. "math-i, math-ii". */
	const TOPICS = [
		{ id: 'math-i',           label: 'Math I',           icon: '∑',    desc: 'Algebra, derivatives' },
		{ id: 'math-ii',          label: 'Math II',          icon: '∫',    desc: 'Integrals, linear algebra' },
		{ id: 'math-iii',         label: 'Math III',         icon: '∮',    desc: 'Probability, real analysis' },
		{ id: 'statistics',       label: 'Statistics',       icon: 'σ',    desc: 'Probability, inference' },
		{ id: 'programming',      label: 'Programming',      icon: '{ }',  desc: 'Code, algorithms' },
		{ id: 'architecture',     label: 'Architecture',     icon: '🏗️',   desc: 'Transformers, attention' },
		{ id: 'training',         label: 'Training',         icon: '🎯',   desc: 'Fine-tuning, RL, eval' },
		{ id: 'data',             label: 'Data',             icon: '📊',   desc: 'Datasets, curation' },
		{ id: 'hardware',         label: 'Hardware',         icon: '💻',   desc: 'Chips, GPUs, infra' },
		{ id: 'inference',        label: 'Inference',        icon: '⚡',   desc: 'Serving, quantization' },
		{ id: 'vision',           label: 'Vision',           icon: '👁️',   desc: 'Image, video' },
		{ id: 'audio',            label: 'Audio',            icon: '🎵',   desc: 'Speech, music' },
		{ id: 'multimodal',       label: 'Multimodal',       icon: '🧩',   desc: 'Text + image + audio' },
		{ id: 'agents',           label: 'Agents',           icon: '🤖',   desc: 'Tool use, planning' },
		{ id: 'reasoning',        label: 'Reasoning',        icon: '∴',    desc: 'Chain-of-thought' },
		{ id: 'interpretability', label: 'Interpretability', icon: '🔍',   desc: 'Probing, circuits' },
		{ id: 'language',         label: 'Language',         icon: '🗣️',   desc: 'Linguistics, NLP' },
		{ id: 'history',          label: 'History',          icon: '🏛️',   desc: 'Intellectual history' },
		{ id: 'philosophy',       label: 'Philosophy',       icon: '💭',   desc: 'Mind, epistemology' },
		{ id: 'ethics',           label: 'Ethics',           icon: '⚖️',   desc: 'Responsibility' },
		{ id: 'safety',           label: 'Safety',           icon: '🛡️',   desc: 'Security, robustness' },
		{ id: 'society',          label: 'Society',          icon: '🌐',   desc: 'Culture, policy' },
		{ id: 'law',              label: 'Law',              icon: '📜',   desc: 'Regulation' },
		{ id: 'frontier',         label: 'Frontier',         icon: '🚀',   desc: 'Open problems' },
		{ id: 'reference',        label: 'Reference',        icon: '📖',   desc: 'Glossary, cheatsheets' }
	];

	/* ── 1a. Audience axes (profile × level) ────────────────────
	   The reader picks one of four roles and one of four depths.
	   Each (profile, level) cell maps to a curated topic set so that
	   just clicking a profile+level gives most readers a sensible
	   default — they can still fine-tune individual topics below. */
	const PROFILES = [
		{ id: 'curious',    label: 'Curious',    hint: 'interested general reader, no CS background' },
		{ id: 'student',    label: 'Student',    hint: 'studying CS or AI formally' },
		{ id: 'engineer',   label: 'Engineer',   hint: 'ML practitioner building production systems' },
		{ id: 'researcher', label: 'Researcher', hint: 'academic / R&D in AI' }
	];
	const LEVELS = [
		{ id: 'hs',       label: 'High School',hint: 'High school level' },
		{ id: 'undergrad',label: 'Undergrad', hint: 'Undergraduate / Bachelor' },
		{ id: 'grad',     label: 'Grad',      hint: 'Graduate / Master\'s' },
		{ id: 'phd',      label: 'PhD',       hint: 'PhD / research level' }
	];

	/* 4 × 4 = 16 audience presets. Each cell lists the topics that
	   should be ON; everything else is hidden. The matrix is biased
	   toward the practical reading needs of each role at each depth:
	   a Curious HS reader gets the storytelling core; a Researcher
	   PhD gets nearly everything.

	   Math is split into i / ii / iii and each level cumulatively
	   includes the lower levels: HS → math-i, Undergrad → math-i +
	   math-ii, Grad / PhD → math-i + math-ii + math-iii. */
	const AUDIENCE_PRESETS = {
		curious: {
			hs:        [ 'history', 'philosophy', 'ethics', 'society', 'language' ],
			undergrad: [ 'history', 'philosophy', 'ethics', 'society', 'language', 'math-i' ],
			grad:      [ 'history', 'philosophy', 'ethics', 'society', 'language', 'math-i', 'math-ii', 'statistics' ],
			phd:       [ 'history', 'philosophy', 'ethics', 'society', 'language', 'math-i', 'math-ii', 'statistics', 'programming' ]
		},
		student: {
			hs:        [ 'history', 'philosophy', 'ethics', 'language', 'math-i' ],
			undergrad: [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'math-ii', 'statistics', 'programming' ],
			grad:      [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'math-ii', 'statistics', 'programming', 'architecture', 'training', 'agents' ],
			phd:       [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'math-ii', 'statistics', 'programming', 'architecture', 'training', 'agents', 'math-iii', 'reasoning', 'inference', 'data' ]
		},
		engineer: {
			hs:        [ 'math-i', 'programming', 'data', 'hardware' ],
			undergrad: [ 'math-i', 'math-ii', 'programming', 'data', 'hardware', 'statistics', 'architecture', 'training', 'inference' ],
			grad:      [ 'math-i', 'math-ii', 'programming', 'data', 'hardware', 'statistics', 'architecture', 'training', 'inference', 'language', 'reasoning', 'safety', 'agents' ],
			phd:       [ 'math-i', 'math-ii', 'programming', 'data', 'hardware', 'statistics', 'architecture', 'training', 'inference', 'language', 'reasoning', 'safety', 'agents', 'interpretability', 'multimodal', 'vision', 'audio' ]
		},
		researcher: {
			hs:        [ 'history', 'philosophy', 'math-i', 'language' ],
			undergrad: [ 'history', 'philosophy', 'math-i', 'math-ii', 'language', 'statistics', 'programming', 'architecture' ],
			grad:      [ 'history', 'philosophy', 'math-i', 'math-ii', 'language', 'statistics', 'programming', 'architecture', 'training', 'reasoning', 'interpretability', 'frontier', 'agents' ],
			phd:       [ 'history', 'philosophy', 'math-i', 'math-ii', 'math-iii', 'language', 'statistics', 'programming', 'architecture', 'training', 'reasoning', 'interpretability', 'frontier', 'agents', 'ethics', 'inference', 'data', 'multimodal', 'vision', 'audio', 'safety', 'law', 'society', 'hardware' ]
		}
	};

	/* Quick presets (kept as one-click shortcuts that don't require
	   picking an audience). */
	const PRESETS = {
		essentials: [ 'history', 'philosophy', 'language' ],
		technical:  [ 'history', 'philosophy', 'language', 'math-i', 'math-ii', 'statistics', 'programming', 'architecture' ]
	};

	const COOKIE_NAME  = 'topics_pref';
	const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
	const STORAGE_KEY  = 'blog_topics_pref';   // localStorage mirror

	/* ── 2. Cookie / storage helpers ────────────────────────────
	   Stored shape:
	       { topics: { id: true|false, … }, profile: 'engineer', level: 'phd' }
	   For backwards compatibility, an old flat topics-only map is
	   recognised and treated as `{ topics: <that map> }`. */
	function readRawPref() {
		const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
		if (m) {
			try {
				const parsed = JSON.parse(decodeURIComponent(m[1]));
				if (parsed && typeof parsed === 'object') return parsed;
			} catch (e) { /* fall through */ }
		}
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object') return parsed;
			}
		} catch (e) { /* fall through */ }
		return null;
	}

	function normalizePref(parsed) {
		const out = {
			topics: {},
			profile: null,
			level: null
		};
		if (!parsed || typeof parsed !== 'object') return out;
		const looksV2 = ('topics' in parsed) || ('profile' in parsed) || ('level' in parsed);
		const topicsObj = looksV2 ? (parsed.topics || {}) : parsed;
		TOPICS.forEach(function (t) {
			out.topics[t.id] = topicsObj[t.id] !== false;
		});
		if (looksV2) {
			if (PROFILES.some(function (p) { return p.id === parsed.profile; })) {
				out.profile = parsed.profile;
			}
			if (LEVELS.some(function (l) { return l.id === parsed.level; })) {
				out.level = parsed.level;
			}
		}
		return out;
	}

	function defaultPref() {
		const topics = {};
		TOPICS.forEach(function (t) { topics[t.id] = true; });
		return { topics: topics, profile: null, level: null };
	}

	function writePref(pref) {
		const v = encodeURIComponent(JSON.stringify(pref));
		document.cookie = COOKIE_NAME + '=' + v
			+ '; path=/; max-age=' + COOKIE_MAX_AGE + '; SameSite=Lax';
		try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode */ }
	}

	/** legacy wrappers (still used by helpers that only care about topics) */
	function readCookieMap() {
		const raw = readRawPref();
		return raw ? normalizePref(raw).topics : null;
	}
	function readStorageMap() {
		const raw = readRawPref();
		return raw ? normalizePref(raw).topics : null;
	}
	function writeCookieMap(map) {
		const cur = normalizePref(readRawPref());
		cur.topics = map;
		writePref(cur);
	}

	function defaultMap() {
		const m = {};
		TOPICS.forEach(function (t) { m[t.id] = true; });
		return m;
	}

	/** active preference (cookie/localStorage → defaults) */
	function activePref() {
		return normalizePref(readRawPref() || defaultPref());
	}
	/** legacy: just the topics map */
	function activeMap() {
		return activePref().topics;
	}

	/** is `topicId` enabled right now? (missing = enabled) */
	function isEnabled(topicId) {
		const m = activeMap();
		return m[topicId] !== false;
	}

	/** is `topicId` enabled when considering a list of topics?
	    OR-semantics: a block tagged math+history shows if either is on. */
	function anyEnabled(topicList) {
		if (!topicList || !topicList.length) return true;
		for (let i = 0; i < topicList.length; i++) {
			if (isEnabled(topicList[i])) return true;
		}
		return false;
	}

	function persist(map) {
		writeCookieMap(map);
		fireChange();
	}

	function setEnabled(topicId, enabled) {
		pushHistory();
		const m = activeMap();
		m[topicId] = !!enabled;
		persist(m);
	}

	function setAll(value) {
		pushHistory();
		const m = {};
		TOPICS.forEach(function (t) { m[t.id] = !!value; });
		persist(m);
	}

	/** enable exactly the topics whose id appears in `enabledIds`,
	    disable everything else. Unknown ids are silently skipped. */
	function applyPreset(enabledIds) {
		pushHistory();
		const allow = {};
		(enabledIds || []).forEach(function (id) { allow[cssSafe(id)] = true; });
		const m = {};
		TOPICS.forEach(function (t) { m[t.id] = !!allow[t.id]; });
		persist(m);
	}

	/** persist the full pref (topics + audience selection) */
	function persistPref(pref) {
		writePref(pref);
		fireChange();
	}

	/* ── 2b. Undo / redo history (per-session, in memory only) ──
	   Every user-initiated change pushes the previous state onto an
	   undo stack; Ctrl/Cmd+Z walks back, Ctrl/Cmd+Shift+Z (or Y)
	   walks forward. The keyboard listener only fires while the
	   overlay is open so we never hijack the browser's own undo
	   on form fields. */
	const HISTORY_MAX = 50;
	const undoStack = [];
	const redoStack = [];

	function snapshotPref() {
		const p = activePref();
		return { topics: Object.assign({}, p.topics), profile: p.profile, level: p.level };
	}

	function pushHistory() {
		undoStack.push(snapshotPref());
		if (undoStack.length > HISTORY_MAX) undoStack.shift();
		redoStack.length = 0;
		updateUndoButtons();
	}

	function restoreSnapshot(snap) {
		persistPref({
			topics: Object.assign({}, snap.topics),
			profile: snap.profile,
			level: snap.level
		});
	}

	function undo() {
		if (undoStack.length === 0) return false;
		redoStack.push(snapshotPref());
		if (redoStack.length > HISTORY_MAX) redoStack.shift();
		restoreSnapshot(undoStack.pop());
		return true;
	}

	function redo() {
		if (redoStack.length === 0) return false;
		undoStack.push(snapshotPref());
		if (undoStack.length > HISTORY_MAX) undoStack.shift();
		restoreSnapshot(redoStack.pop());
		return true;
	}

	function updateUndoButtons() {
		const u = document.getElementById('topics-undo');
		const r = document.getElementById('topics-redo');
		if (u) {
			u.disabled = undoStack.length === 0;
			u.classList.toggle('topics-undo-empty', undoStack.length === 0);
			u.title = undoStack.length === 0
				? 'Nothing to undo'
				: 'Undo last change (Ctrl/⌘+Z)';
		}
		if (r) {
			r.disabled = redoStack.length === 0;
			r.classList.toggle('topics-undo-empty', redoStack.length === 0);
			r.title = redoStack.length === 0
				? 'Nothing to redo'
				: 'Redo (Ctrl/⌘+Shift+Z)';
		}
	}

	/** apply the curated (profile, level) audience preset and remember
	    the selection. Unknown ids are silently skipped. */
	function applyAudience(profile, level) {
		const cell = AUDIENCE_PRESETS[profile] && AUDIENCE_PRESETS[profile][level];
		const allow = {};
		(cell || []).forEach(function (id) { allow[cssSafe(id)] = true; });
		const topics = {};
		TOPICS.forEach(function (t) { topics[t.id] = !!allow[t.id]; });
		pushHistory();
		persistPref({
			topics: topics,
			profile: cell ? profile : null,
			level:   cell ? level : null
		});
	}

	/** change just one axis of the audience selection without re-applying
	    the preset (used when the user opens the picker for the first time
	    and we want to remember their pick). */
	function setAudienceSelection(profile, level) {
		const cur = activePref();
		if (profile !== undefined) cur.profile = profile || null;
		if (level   !== undefined) cur.level   = level   || null;
		pushHistory();
		persistPref(cur);
	}

	/** Apply the audience picker result:
	      – profile + level both set  → curated preset is loaded.
	      – only one axis set         → selection is remembered but the
	                                   existing topic map is left alone
	                                   (so the user can keep their manual
	                                   fine-tuning while still seeing their
	                                   audience pick reflected).
	      – both axes null            → audience filter is cleared; the
	                                   topic map is left alone. */
	function applyAudiencePartial(profile, level) {
		const cleanProfile = (PROFILES.some(function (p) { return p.id === profile; })) ? profile : null;
		const cleanLevel   = (LEVELS.some(function (l)   { return l.id === level;    })) ? level   : null;
		if (cleanProfile && cleanLevel) {
			applyAudience(cleanProfile, cleanLevel);
			return;
		}
		const cur = activePref();
		pushHistory();
		persistPref({
			topics: cur.topics,
			profile: cleanProfile,
			level: cleanLevel
		});
	}

	/** ensure map contains an entry for every known topic */
	function normalize(map) {
		const out = {};
		TOPICS.forEach(function (t) { out[t.id] = (map && map[t.id] !== false); });
		return out;
	}

	/* ── 3. UI: 🎯 toggle button ────────────────────────────────
	   The button itself is rendered by `render_topics_toggle()` in
	   functions.php so it's in the DOM immediately (no FOUC, no
	   waiting on the loader). We just wire up the click handler and
	   keep the button's color intensity in sync via a CSS variable. */
	function ensureToggleButton() {
		let btn = document.getElementById('topics-toggle');
		if (!btn) {
			btn = document.createElement('button');
			btn.id = 'topics-toggle';
			btn.type = 'button';
			btn.setAttribute('aria-label', 'Choose your interests');
			btn.title = 'Choose your interests';
			btn.innerHTML = [
				'<span class="ti-target" aria-hidden="true">',
				'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
				' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
				'<circle cx="12" cy="12" r="9"/>',
				'<circle cx="12" cy="12" r="5"/>',
				'<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
				'</svg></span>'
			].join('');
			document.body.appendChild(btn);
		}
		// Replace the inline onclick with a proper handler so the
		// event stays attached even if the button is re-rendered.
		btn.onclick = openOverlay;
		updateToggleIntensity();
	}

	/** Drive the button's accent saturation from the share of topics
	    that are currently active. Pure 0 → button is plain grey; pure 1
	    → button is the full accent color. The button never carries a
	    badge or count. */
	function updateToggleIntensity() {
		const btn = document.getElementById('topics-toggle');
		if (!btn) return;
		const map = normalize(activeMap());
		const active = Object.values(map).filter(Boolean).length;
		const total  = TOPICS.length;
		const pct = total > 0 ? Math.max(0, Math.min(1, active / total)) : 0;
		btn.style.setProperty('--topics-pct', pct.toFixed(4));
		btn.setAttribute(
			'aria-label',
			'Choose your interests — ' + active + ' of ' + total + ' active'
		);
	}

	/* ── 4. UI: overlay + checklist ───────────────────────────── */
	function ensureOverlay() {
		if (document.getElementById('topics-overlay')) return;
		const overlay = document.createElement('div');
		overlay.id = 'topics-overlay';
		overlay.className = 'topics-overlay';
		overlay.setAttribute('aria-hidden', 'true');
		overlay.innerHTML = [
			'<div class="topics-backdrop" data-close></div>',
			'<div class="topics-modal" role="dialog" aria-modal="true" aria-labelledby="topics-title">',
				'<button class="topics-close" type="button" aria-label="Close" data-close>×</button>',
				'<header class="topics-header">',
					'<h2 id="topics-title"><span class="topics-title-emoji">🎯</span> Your Interests</h2>',
					'<p class="topics-tagline">Pick who you are and how deep you want to go — we\'ll pick a sensible set of topics for you. Fine-tune individual topics below.</p>',
				'</header>',
				'<div class="topics-audience">',
					'<div class="topics-audience-row">',
						'<span class="topics-audience-label">I\'m a</span>',
						'<div class="topics-seg" role="radiogroup" aria-label="Your profile" data-audience="profile">',
							PROFILES.map(function (p) {
								return '<button type="button" class="topics-seg-btn" role="radio" data-profile="' + escAttr(p.id) + '" title="' + escAttr(p.hint) + '">' + escAttr(p.label) + '</button>';
							}).join(''),
						'</div>',
						'<button type="button" class="topics-audience-clear" data-audience-clear title="Clear the audience filter — pick topics by hand below">Clear</button>',
					'</div>',
					'<div class="topics-audience-row">',
						'<span class="topics-audience-label">reading at</span>',
						'<div class="topics-seg" role="radiogroup" aria-label="Your level" data-audience="level">',
							LEVELS.map(function (l) {
								return '<button type="button" class="topics-seg-btn" role="radio" data-level="' + escAttr(l.id) + '" title="' + escAttr(l.hint) + '">' + escAttr(l.label) + '</button>';
							}).join(''),
						'</div>',
						'<span class="topics-audience-suffix">level</span>',
					'</div>',
					'<p class="topics-audience-hint" id="topics-audience-hint">Pick a profile and a level — your topic list updates instantly. Click the active button again (or Clear) to turn the audience filter off.</p>',
				'</div>',
				'<div class="topics-presets" role="group" aria-label="Quick presets">',
					'<button type="button" data-preset="all" class="topics-preset-btn">Show Everything</button>',
					'<button type="button" data-preset="essentials" class="topics-preset-btn">Just Essentials</button>',
					'<button type="button" data-preset="technical" class="topics-preset-btn">Technical Essentials</button>',
					'<button type="button" data-preset="none" class="topics-preset-btn topics-preset-off">Disable All</button>',
				'</div>',
				'<div class="topics-grid" id="topics-grid"></div>',
				'<footer class="topics-footer">',
					'<div class="topics-undo-group" role="group" aria-label="History">',
						'<button type="button" id="topics-undo" class="topics-undo-btn" aria-label="Undo">',
							'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>',
							'<span>Undo</span>',
						'</button>',
						'<button type="button" id="topics-redo" class="topics-undo-btn" aria-label="Redo">',
							'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>',
							'<span>Redo</span>',
						'</button>',
					'</div>',
					'<span class="topics-count" id="topics-count"></span>',
					'<span class="topics-hint">Saved automatically · 🍪</span>',
				'</footer>',
			'</div>'
		].join('');
		document.body.appendChild(overlay);

		overlay.querySelectorAll('[data-close]').forEach(function (el) {
			el.addEventListener('click', closeOverlay);
		});
		overlay.querySelectorAll('[data-preset]').forEach(function (b) {
			b.addEventListener('click', function () {
				const p = b.getAttribute('data-preset');
				if (p === 'all') setAll(true);
				else if (p === 'essentials') applyPreset(PRESETS.essentials);
				else if (p === 'technical') applyPreset(PRESETS.technical);
				else if (p === 'none') {
					pushHistory();
					setAll(false);
					flashHint('All topics muted · Ctrl/⌘+Z to undo');
				}
				renderAudienceSelection();
			});
		});
		overlay.querySelectorAll('[data-profile]').forEach(function (b) {
			b.addEventListener('click', function () {
				const profile = b.getAttribute('data-profile');
				const cur = activePref();
				/* Clicking the active profile again toggles it OFF.
				   Clicking a different profile saves it standalone,
				   without forcing a level. The preset only fires when
				   BOTH axes are picked. */
				const nextProfile = cur.profile === profile ? null : profile;
				applyAudiencePartial(nextProfile, cur.level);
				renderAudienceSelection();
			});
		});
		overlay.querySelectorAll('[data-level]').forEach(function (b) {
			b.addEventListener('click', function () {
				const level = b.getAttribute('data-level');
				const cur = activePref();
				const nextLevel = cur.level === level ? null : level;
				applyAudiencePartial(cur.profile, nextLevel);
				renderAudienceSelection();
			});
		});
		const clearBtn = overlay.querySelector('[data-audience-clear]');
		if (clearBtn) {
			clearBtn.addEventListener('click', function () {
				applyAudiencePartial(null, null);
				renderAudienceSelection();
			});
		}

		const undoBtn = document.getElementById('topics-undo');
		const redoBtn = document.getElementById('topics-redo');
		if (undoBtn) undoBtn.addEventListener('click', function () { undo(); });
		if (redoBtn) redoBtn.addEventListener('click', function () { redo(); });

		// Escape closes; Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z undo/redo while
		// the overlay is visible (we don't hijack the browser undo
		// outside the picker).
		document.addEventListener('keydown', function (e) {
			if (!overlay.classList.contains('open')) return;
			if (e.key === 'Escape') {
				e.preventDefault();
				closeOverlay();
				return;
			}
			const mod = e.metaKey || e.ctrlKey;
			if (!mod) return;
			const k = e.key.toLowerCase();
			if (k === 'z' && !e.shiftKey) {
				e.preventDefault();
				if (undo()) flashHint('Undid last change · Ctrl/⌘+Shift+Z to redo');
			} else if ((k === 'z' && e.shiftKey) || k === 'y') {
				e.preventDefault();
				if (redo()) flashHint('Redid · Ctrl/⌘+Z to undo');
			}
		});
	}

	let _hintTimer = null;
	function flashHint(msg) {
		const hint = document.getElementById('topics-audience-hint');
		if (!hint) return;
		const orig = hint.textContent;
		hint.textContent = msg;
		hint.classList.add('topics-hint-flash');
		if (_hintTimer) clearTimeout(_hintTimer);
		_hintTimer = setTimeout(function () {
			hint.classList.remove('topics-hint-flash');
			renderAudienceSelection();
		}, 1600);
	}

	function renderGrid() {
		const grid = document.getElementById('topics-grid');
		if (!grid) return;
		const map = normalize(activeMap());
		grid.innerHTML = '';
		TOPICS.forEach(function (topic) {
			const enabled = map[topic.id] !== false;
			const item = document.createElement('label');
			item.className = 'topic-tile' + (enabled ? ' topic-tile-on' : ' topic-tile-off');
			item.setAttribute('data-topic-id', topic.id);
			item.innerHTML = [
				'<input type="checkbox" data-topic-id="', escAttr(topic.id), '"',
					enabled ? ' checked' : '', '>',
				'<span class="topic-tile-icon" aria-hidden="true">', escAttr(topic.icon), '</span>',
				'<span class="topic-tile-body">',
					'<span class="topic-tile-label">', escAttr(topic.label), '</span>',
					'<span class="topic-tile-desc">', escAttr(topic.desc), '</span>',
				'</span>',
				'<span class="topic-tile-switch" aria-hidden="true"></span>'
			].join('');
			grid.appendChild(item);
			const cb = item.querySelector('input');
			cb.addEventListener('change', function () {
				setEnabled(topic.id, cb.checked);
			});
		});
		updateCount();
	}

	function updateCount() {
		const el = document.getElementById('topics-count');
		if (!el) return;
		const map = normalize(activeMap());
		const active = Object.values(map).filter(Boolean).length;
		const total  = TOPICS.length;
		el.textContent = active + ' of ' + total + ' topics active';
		el.classList.toggle('topics-count-none', active === 0);
		el.classList.toggle('topics-count-all',  active === total);
	}

	/** highlight the currently selected profile + level buttons and update
	    the hint text. Safe to call before the overlay exists. */
	function renderAudienceSelection() {
		const pref = activePref();
		document.querySelectorAll('#topics-overlay [data-profile]').forEach(function (b) {
			const on = b.getAttribute('data-profile') === pref.profile;
			b.classList.toggle('topics-seg-on', on);
			b.setAttribute('aria-checked', on ? 'true' : 'false');
		});
		document.querySelectorAll('#topics-overlay [data-level]').forEach(function (b) {
			const on = b.getAttribute('data-level') === pref.level;
			b.classList.toggle('topics-seg-on', on);
			b.setAttribute('aria-checked', on ? 'true' : 'false');
		});
		const hint = document.getElementById('topics-audience-hint');
		if (!hint) return;
		const profileLabel = (PROFILES.find(function (p) { return p.id === pref.profile; }) || {}).label;
		const levelLabel   = (LEVELS.find(function (l) { return l.id === pref.level; })   || {}).label;
		if (pref.profile && pref.level) {
			hint.textContent = 'Preset applied: ' + profileLabel + ' · ' + levelLabel + '. Toggle individual topics below to fine-tune.';
		} else if (pref.profile) {
			hint.textContent = 'Saved: ' + profileLabel + '. Pick a level to apply a curated preset, or tune the grid below by hand.';
		} else if (pref.level) {
			hint.textContent = 'Saved: reading at ' + levelLabel + ' level. Pick a profile to apply a curated preset, or tune the grid below by hand.';
		} else {
			hint.textContent = 'Pick a profile and a level — your topic list updates instantly. Click the active button again (or Clear) to turn the audience filter off.';
		}
	}

	let _lastFocused = null;

	function openOverlay() {
		ensureOverlay();
		renderGrid();
		renderAudienceSelection();
		updateUndoButtons();
		const o = document.getElementById('topics-overlay');
		o.classList.add('open');
		o.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
		_lastFocused = document.activeElement;
		const first = o.querySelector('input, button');
		if (first) first.focus();
	}

	function closeOverlay() {
		const o = document.getElementById('topics-overlay');
		if (!o) return;
		o.classList.remove('open');
		o.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		if (_lastFocused && typeof _lastFocused.focus === 'function') _lastFocused.focus();
	}

	/* ── 5. Markdown pre-processing (called by helper.js) ─────── */
	function cssSafe(name) {
		return String(name).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
	}

	function escAttr(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	/** Register a marked extension that recognises `[[t:math]]…[[/t]]`
	    block-level markers and renders the inner markdown as a
	    `<div class="topic-block" data-topic="math">…</div>`. The
	    visibility toggle later decides whether to actually show it.
	    Multiple topics can be combined with commas:
	    `[[t:math,history]]…[[/t]]` — the block is hidden only when
	    every listed topic is unchecked. Nesting is supported by
	    recursively preprocessing the inner content so inner blocks
	    become their own topic-block elements. */
	function preprocess(rawHtml) {
		if (window.marked && window.marked.use && !window.__blogTopicsHooked) {
			window.__blogTopicsHooked = true;
			window.marked.use({
				extensions: [{
					name: 'topicBlock',
					level: 'block',
					start(src) {
						const i = src.indexOf('[[t:');
						return i === -1 ? undefined : i;
					},
					tokenizer(src) {
						// Marker must start at the very beginning of the
						// chunk marked handed us — otherwise we let other
						// tokenisers have a go.
						const scan = scanBalancedTopic(src, 0);
						if (!scan || scan.start !== 0) return undefined;
						const ids = scan.ids;
						if (!ids.length) return undefined;
						return {
							type: 'topicBlock',
							raw: src.substring(scan.start, scan.end),
							topicIds: ids,
							topicAttr: ids.join(' '),
							// recurse into the inner content so any
							// nested topic-block markers become their
							// own `<div class="topic-block">` siblings
							// of the inner markdown.
							tokens: this.lexer.blockTokens(preprocess(scan.inner), [])
						};
					},
					renderer(token) {
						const inner = this.parser.parse(token.tokens);
						return '<div class="topic-block" data-topic="'
								+ escAttr(token.topicAttr) + '">'
								+ inner + '</div>\n';
					},
					childTokens: ['tokens']
				}]
			});
		}
		return rawHtml;
	}

	/** Find the first `[[t:id]]…[[/t]]` block in `text` starting at
	    `from`, balancing nested opens so the matching close is the
	    one paired with this open. Returns { start, end, ids, inner }
	    or null. */
	function scanBalancedTopic(text, from) {
		const start = from || 0;
		const openRe = /\[\[t:/g;
		openRe.lastIndex = start;
		const openM = openRe.exec(text);
		if (!openM) return null;
		const nameEnd = text.indexOf(']]', openM.index + 2);
		if (nameEnd === -1) return null;
		const ids = text.substring(openM.index + openM[0].length, nameEnd)
			.split(',').map(cssSafe).filter(Boolean);
		if (!ids.length) return null;
		const bodyStart = nameEnd + 2;
		let depth = 1;
		let pos = bodyStart;
		while (depth > 0) {
			const nextOpen  = text.indexOf('[[t:', pos);
			const nextClose = text.indexOf('[[/t]]', pos);
			if (nextClose === -1) return null; // unterminated
			if (nextOpen !== -1 && nextOpen < nextClose) {
				const ne = text.indexOf(']]', nextOpen + 2);
				if (ne === -1) return null;
				pos = ne + 2;
				depth++;
			} else {
				pos = nextClose + 6;
				depth--;
				if (depth === 0) {
					const inner = text.substring(bodyStart, nextClose);
					return {
						start: openM.index,
						end: pos,
						ids: ids,
						inner: inner
					};
				}
			}
		}
		return null;
	}

	/* ── 6. Apply visibility to topic blocks ───────────────────── */
	function topicMeta(id) {
		const norm = cssSafe(id);
		for (let i = 0; i < TOPICS.length; i++) {
			if (TOPICS[i].id === norm) return TOPICS[i];
		}
		return { id: norm, label: norm, icon: '✦' };
	}

	function readTopicAttr(block) {
		// data-topic is space-separated list of topic ids
		const raw = (block.getAttribute('data-topic') || '').trim();
		if (!raw) return [];
		return raw.split(/\s+/).filter(Boolean);
	}

	function ensureBanner(block, topicIds) {
		if (block.querySelector(':scope > .topic-block-banner')) return null;
		// Use the first known topic for the icon/label
		let meta = { id: topicIds[0], label: topicIds[0], icon: '✦' };
		for (let i = 0; i < topicIds.length; i++) {
			const m = topicMeta(topicIds[i]);
			if (m && m.label !== m.id) { meta = m; break; }
		}
		const labelHtml = topicIds.length === 1
			? '<strong>' + escAttr(meta.label) + '</strong>'
			: '<strong>' + topicIds.map(function (id) { return escAttr(topicMeta(id).label); }).join(' + ') + '</strong>';
		const banner = document.createElement('div');
		banner.className = 'topic-block-banner';
		banner.innerHTML = [
			'<span class="topic-block-banner-icon" aria-hidden="true">', escAttr(meta.icon), '</span>',
			'<span class="topic-block-banner-text">',
				labelHtml, ' section skipped — your interest filter has tucked it away.',
			'</span>',
			'<button type="button" class="topic-block-reveal">',
				'<span class="topic-block-reveal-eye" aria-hidden="true">👁</span> Peek anyway',
			'</button>'
		].join('');
		banner.querySelector('.topic-block-reveal').addEventListener('click', function (ev) {
			ev.preventDefault();
			revealBlock(block);
		});
		block.insertBefore(banner, block.firstChild);
		return banner;
	}

	function ensureInner(block) {
		let inner = block.querySelector(':scope > .topic-block-inner');
		if (inner) return inner;
		inner = document.createElement('div');
		inner.className = 'topic-block-inner';
		const moveable = Array.from(block.children).filter(function (el) {
			return !el.classList.contains('topic-block-banner');
		});
		moveable.forEach(function (el) { inner.appendChild(el); });
		block.appendChild(inner);
		return inner;
	}

	function collapseBlock(block, topicIds) {
		ensureInner(block);
		ensureBanner(block, topicIds);
		block.classList.add('topic-block-collapsed');
		block.classList.remove('topic-block-revealed');
	}

	function revealBlock(block) {
		const inner = block.querySelector(':scope > .topic-block-inner');
		if (inner) {
			while (inner.firstChild) block.insertBefore(inner.firstChild, inner);
			inner.remove();
		}
		const banner = block.querySelector(':scope > .topic-block-banner');
		if (banner) banner.remove();
		block.classList.remove('topic-block-collapsed');
		block.classList.add('topic-block-revealed');
	}

	function applyVisibility() {
		const blocks = document.querySelectorAll('.topic-block');
		blocks.forEach(function (block) {
			const topicIds = readTopicAttr(block);
			if (!topicIds.length) return;
			const enabled = anyEnabled(topicIds);
			if (enabled) {
				if (block.classList.contains('topic-block-collapsed')) {
					revealBlock(block);
				}
			} else {
				collapseBlock(block, topicIds);
			}
		});

		// Inline skipped markers (for ad-hoc skipped-in-place text)
		const inlines = document.querySelectorAll('.topic-inline');
		inlines.forEach(function (el) {
			const topicIds = readTopicAttr(el);
			if (!topicIds.length) return;
			el.classList.toggle('topic-inline-hidden', !anyEnabled(topicIds));
		});

		dimCourseTiles();
		updateSkipIndicator();

		// keep any inline widgets in sync with the new collapsed count
		document.querySelectorAll('[data-topics-inline]').forEach(renderInlineWidget);
	}

	/* ── 7. Course tile dimming (home page) ───────────────────── */
	function dimCourseTiles() {
		const tiles = document.querySelectorAll('[data-topics]');
		tiles.forEach(function (tile) {
			const topics = (tile.getAttribute('data-topics') || '')
				.split(',').map(function (s) { return cssSafe(s.trim()); })
				.filter(Boolean);
			if (topics.length === 0) {
				tile.classList.remove('topic-tile-dim', 'topic-tile-active');
				return;
			}
			const hits = topics.filter(isEnabled).length;
			if (hits === 0) {
				tile.classList.add('topic-tile-dim');
				tile.classList.remove('topic-tile-active');
			} else {
				tile.classList.remove('topic-tile-dim');
				tile.classList.add('topic-tile-active');
			}
		});
	}

	/* ── 8. Per-page "X skipped" indicator ────────────────────── */
	function updateSkipIndicator() {
		const total = document.querySelectorAll('.topic-block').length;
		const collapsed = document.querySelectorAll('.topic-block.topic-block-collapsed').length;
		let bar = document.getElementById('topics-skip-bar');
		if (collapsed === 0) {
			if (bar) bar.remove();
			return;
		}
		if (!bar) {
			bar = document.createElement('div');
			bar.id = 'topics-skip-bar';
			bar.className = 'topics-skip-bar';
			bar.innerHTML = [
				'<span class="topics-skip-icon" aria-hidden="true">🎯</span>',
				'<span class="topics-skip-text"></span>',
				'<button type="button" class="topics-skip-reveal-all">Reveal all on this page</button>'
			].join('');
			bar.querySelector('.topics-skip-reveal-all').addEventListener('click', function () {
				document.querySelectorAll('.topic-block.topic-block-collapsed').forEach(revealBlock);
				updateSkipIndicator();
			});
			const contents = document.getElementById('contents');
			if (contents) contents.insertBefore(bar, contents.firstChild);
		}
		bar.querySelector('.topics-skip-text').textContent =
			collapsed + ' section' + (collapsed === 1 ? '' : 's') + ' tucked away by your interests'
			+ (total ? ' (' + (total - collapsed) + ' of ' + total + ' visible)' : '');
	}

	/* ── 9. Change broadcast ──────────────────────────────────── */
	function fireChange() {
		updateToggleIntensity();
		renderGrid();
		renderAudienceSelection();
		applyVisibility();
		// Re-render any inline widget (intro page)
		document.querySelectorAll('[data-topics-inline]').forEach(renderInlineWidget);
		try {
			document.dispatchEvent(new CustomEvent('topics:change', { detail: { map: normalize(activeMap()) } }));
		} catch (e) { /* old browsers */ }
	}

	/* ── 10. Inline widget (for intro.php / module pages) ─────── */
	function renderInlineWidget(host) {
		const map = normalize(activeMap());
		const active = Object.values(map).filter(Boolean).length;
		const total = TOPICS.length;
		const skipped = document.querySelectorAll('.topic-block.topic-block-collapsed').length;

		const tilesHtml = TOPICS.map(function (t) {
			const on = map[t.id] !== false;
			return '<button type="button" class="ipill ' + (on ? 'ipill-on' : 'ipill-off') +
				'" data-topic-id="' + escAttr(t.id) + '">' +
				'<span class="ipill-icon">' + escAttr(t.icon) + '</span>' +
				'<span class="ipill-label">' + escAttr(t.label) + '</span>' +
				'<span class="ipill-x" aria-hidden="true">' + (on ? '✓' : '×') + '</span>' +
			'</button>';
		}).join('');

		host.innerHTML = [
			'<div class="inline-topics-head">',
				'<div class="inline-topics-summary">',
					'<span class="inline-topics-icon" aria-hidden="true">🎯</span>',
					'<span>',
						'<strong>' + active + '</strong> of ' + total + ' topics active',
						skipped ? ' · <em>' + skipped + ' section' + (skipped === 1 ? '' : 's') + ' tucked away</em>' : '',
					'</span>',
				'</div>',
				'<button type="button" class="inline-topics-open">',
					'<span class="ti-target" aria-hidden="true">',
					'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
					'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
					'</svg></span>',
					'Open interest picker',
				'</button>',
			'</div>',
			'<div class="inline-topics-grid">' + tilesHtml + '</div>',
			'<p class="inline-topics-foot">Or use the small <strong><span class="interest-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg></span> button top-right</strong> (next to dark-mode &amp; search) any time — your choices are saved in a cookie.</p>'
		].join('');

		host.querySelector('.inline-topics-open').addEventListener('click', openOverlay);
		host.querySelectorAll('.ipill').forEach(function (btn) {
			btn.addEventListener('click', function () {
				const id = btn.getAttribute('data-topic-id');
				setEnabled(id, !isEnabled(id));
			});
		});
	}

	/* ── 11. Init ─────────────────────────────────────────────── */
	function init() {
		ensureToggleButton();
		ensureOverlay();
		renderGrid();
		applyVisibility();
		document.querySelectorAll('[data-topics-inline]').forEach(renderInlineWidget);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	/* ── 12. Public API ───────────────────────────────────────── */
	window.BlogTopics = {
		TOPICS: TOPICS,
		PRESETS: PRESETS,
		PROFILES: PROFILES,
		LEVELS: LEVELS,
		AUDIENCE_PRESETS: AUDIENCE_PRESETS,
		preprocess: preprocess,
		applyVisibility: applyVisibility,
		activeMap: function () { return normalize(activeMap()); },
		activePref: function () { return activePref(); },
		isEnabled: isEnabled,
		anyEnabled: anyEnabled,
		setEnabled: setEnabled,
		setAll: setAll,
		applyPreset: applyPreset,
		applyAudience: applyAudience,
		applyAudiencePartial: applyAudiencePartial,
		setAudienceSelection: setAudienceSelection,
		undo: undo,
		redo: redo,
		canUndo: function () { return undoStack.length > 0; },
		canRedo: function () { return redoStack.length > 0; },
		openOverlay: openOverlay,
		closeOverlay: closeOverlay,
		renderInlineWidget: renderInlineWidget,
		cssSafe: cssSafe,
		escAttr: escAttr,
		onChange: function (fn) { document.addEventListener('topics:change', fn); }
	};
})();
