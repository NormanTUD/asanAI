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
	   Math and Statistics are split into cumulative levels (i = HS,
	   ii = undergrad, iii = grad / research) so a reader can opt in
	   only to the depth they actually want. A page that combines
	   levels can list several, e.g. "math-i, math-ii". */
	const TOPICS = [
		{ id: 'math-i',           label: 'Math I',           icon: '∑',    desc: 'Algebra, derivatives' },
		{ id: 'math-ii',          label: 'Math II',          icon: '∫',    desc: 'Integrals, linear algebra' },
		{ id: 'math-iii',         label: 'Math III',         icon: '∮',    desc: 'Probability, real analysis' },
		{ id: 'geometry',         label: 'Geometry',         icon: '▲',    desc: 'Space, curves, non-Euclidean, topology' },
		{ id: 'statistics-i',     label: 'Stats I',          icon: 'σ',    desc: 'Basic probability, distributions' },
		{ id: 'statistics-ii',    label: 'Stats II',         icon: 'μ',    desc: 'Inference, hypothesis testing, advanced' },
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
		{ id: 'frontier',         label: 'Frontier',         icon: '🚀',    desc: 'Open problems' },
		{ id: 'reference',        label: 'Reference',        icon: '📖',   desc: 'Glossary, cheatsheets' }
	];

	/* ── 1c. Categories (tone / heaviness filters) ─────────────
	   A second, orthogonal layer on top of the interest topics.
	   Topics answer "what am I interested in?"; categories answer
	   "how heavy should it be?". They are tagged on whole lessons
	   (the `tags:` line of a lesson's COURSE_METADATA block → a
	   `data-tags` attribute on its home-page tile) and on individual
	   in-lesson sections (any id in a `[[t:…]]` marker that is a
	   category, e.g. `[[t:math-i,math-heavy]]`).

	   Two kinds:
	     • kind:'suppress'  — "less of this" dials. ON by default;
	       switching one OFF tucks away every section/lesson tagged
	       with it. This is the "turn off the math-heavy stuff in one
	       click" control.
	     • kind:'include'   — "show me this" lenses. OFF by default;
	       switching one ON dims everything that is NOT tagged with it
	       (e.g. "interested layman" keeps only the accessible core).

	   Categories are deliberately kept OUT of TOPICS so the "N of M
	   topics active" count keeps meaning *interests*, and the picker
	   can render them as their own compact chip row. */
	const CATEGORIES = [
		{ id: 'math-heavy',        label: 'Math-heavy',        icon: '∫',   kind: 'suppress', desc: 'Dense equations, proofs & derivations' },
		{ id: 'logic-heavy',       label: 'Logic-heavy',       icon: '∴',   kind: 'suppress', desc: 'Formal logic, type theory, rigorous proofs' },
		{ id: 'language-heavy',    label: 'Language-heavy',    icon: '🗣️',  kind: 'suppress', desc: 'Linguistics & NLP theory' },
		{ id: 'code-heavy',        label: 'Code-heavy',        icon: '{ }', kind: 'suppress', desc: 'Hands-on code, algorithms & infra' },
		{ id: 'interested-layman', label: 'Interested layman', icon: '🌱',  kind: 'include',  desc: 'Only the accessible, jargon-free core' }
	];

	const CAT_BY_ID = {};
	CATEGORIES.forEach(function (c) { CAT_BY_ID[cssSafe(c.id)] = c; });

	function isCategory(id) { return !!CAT_BY_ID[cssSafe(id)]; }
	function catOf(id) { return CAT_BY_ID[cssSafe(id)] || null; }
	/** friendly label for any tag id (category or topic) */
	function labelFor(id) {
		const c = catOf(id);
		if (c) return c.label;
		const t = topicMeta(id);
		return (t && t.label !== t.id) ? t.label : id;
	}

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

	/* ── 1b. Classic reader types (personas) ───────────────────
	   The profession-based profiles above assume you relate to
	   *your job*. But most readers come here out of *interest*,
	   and the interests people actually self-identify with are
	   the classic ones: the mathematician, the builder, the
	   historian, the philosopher — and the polymath who wants
	   everything (the classic "Renaissance man"). Each persona
	   enables a curated topic set in one click; nothing is
	   persisted beyond the topic map itself, so fine-tuning and
	   switching types stay free-form. */
	const PERSONAS = [
		{ id: 'mathematician', label: 'Mathematician', icon: '∞',
		  hint: 'The Gauss type: give me the math — skip the history.',
		  topics: [ 'math-i', 'math-ii', 'math-iii', 'geometry', 'statistics-i', 'statistics-ii', 'reasoning' ] },
		{ id: 'builder', label: 'Builder', icon: '⚙️',
		  hint: 'The Mort type: show me how it is actually built.',
		  topics: [ 'programming', 'architecture', 'training', 'data', 'hardware', 'inference', 'agents', 'vision', 'audio', 'multimodal', 'math-i', 'statistics-i' ] },
		{ id: 'scientist', label: 'Scientist', icon: '🔬',
		  hint: 'The Curie type: what do we actually know, and how do we know it?',
		  topics: [ 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'data', 'reasoning', 'frontier', 'interpretability' ] },
		{ id: 'historian', label: 'Historian', icon: '🕰️',
		  hint: 'The Herodotus type: where did all of this come from?',
		  topics: [ 'history', 'language', 'society', 'philosophy', 'ethics', 'law' ] },
		{ id: 'philosopher', label: 'Philosopher', icon: '🦉',
		  hint: 'The Socrates type: what does any of this mean?',
		  topics: [ 'philosophy', 'ethics', 'society', 'law', 'language', 'history', 'reasoning' ] },
		{ id: 'wordsmith', label: 'Wordsmith', icon: '✒️',
		  hint: 'The Chomsky type: language is the real magic trick.',
		  topics: [ 'language', 'audio', 'vision', 'multimodal', 'history' ] },
		{ id: 'creator', label: 'Creator', icon: '🎨',
		  hint: 'The Elvis type: sound, images, feeling — what can I make?',
		  topics: [ 'vision', 'audio', 'multimodal', 'agents', 'programming', 'architecture' ] },
		{ id: 'conscience', label: 'Conscience', icon: '🧭',
		  hint: 'The watchdog type: what should we do about all of this?',
		  topics: [ 'ethics', 'safety', 'society', 'law', 'training', 'data' ] },
		{ id: 'polymath', label: 'Polymath', icon: '✨',
		  hint: 'The Da Vinci type: everything. All of it. No skips.',
		  topics: null }
	];

	/* 4 × 4 = 16 audience presets. Each cell lists the topics that
	   should be ON; everything else is hidden. The matrix is biased
	   toward the practical reading needs of each role at each depth:
	   a Curious HS reader gets the storytelling core; a Researcher
	   PhD gets nearly everything.

	   Math and Statistics are split into i / ii / iii and each level
	   cumulatively includes the lower levels: HS → math-i + stats-i,
	   Undergrad → + math-ii + stats-ii, Grad / PhD → + math-iii. */
	const AUDIENCE_PRESETS = {
		curious: {
			hs:        [ 'history', 'philosophy', 'ethics', 'society', 'language' ],
			undergrad: [ 'history', 'philosophy', 'ethics', 'society', 'language', 'math-i', 'statistics-i' ],
			grad:      [ 'history', 'philosophy', 'ethics', 'society', 'language', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii' ],
			phd:       [ 'history', 'philosophy', 'ethics', 'society', 'language', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming' ]
		},
		student: {
			hs:        [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'statistics-i' ],
			undergrad: [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming' ],
			grad:      [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'architecture', 'training', 'agents' ],
			phd:       [ 'history', 'philosophy', 'ethics', 'language', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'architecture', 'training', 'agents', 'math-iii', 'geometry', 'reasoning', 'inference', 'data' ]
		},
		engineer: {
			hs:        [ 'math-i', 'statistics-i', 'programming', 'data', 'hardware' ],
			undergrad: [ 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'data', 'hardware', 'architecture', 'training', 'inference' ],
			grad:      [ 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'data', 'hardware', 'architecture', 'training', 'inference', 'language', 'reasoning', 'safety', 'agents' ],
			phd:       [ 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'data', 'hardware', 'architecture', 'training', 'inference', 'language', 'reasoning', 'safety', 'agents', 'interpretability', 'multimodal', 'vision', 'audio' ]
		},
		researcher: {
			hs:        [ 'history', 'philosophy', 'math-i', 'statistics-i', 'language' ],
			undergrad: [ 'history', 'philosophy', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'language', 'programming', 'architecture' ],
			grad:      [ 'history', 'philosophy', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'language', 'programming', 'architecture', 'training', 'reasoning', 'interpretability', 'frontier', 'agents' ],
			phd:       [ 'history', 'philosophy', 'math-i', 'math-ii', 'math-iii', 'geometry', 'statistics-i', 'statistics-ii', 'language', 'programming', 'architecture', 'training', 'reasoning', 'interpretability', 'frontier', 'agents', 'ethics', 'inference', 'data', 'multimodal', 'vision', 'audio', 'safety', 'law', 'society', 'hardware' ]
		}
	};

	/* Quick presets (kept as one-click shortcuts that don't require
	   picking an audience). */
	const PRESETS = {
		essentials: [ 'history', 'philosophy', 'language' ],
		technical:  [ 'history', 'philosophy', 'language', 'math-i', 'math-ii', 'statistics-i', 'statistics-ii', 'programming', 'architecture' ]
	};

	/* ── 1d. Math-comfort axis (0–100) ─────────────────────────
	   A continuous dial, orthogonal to the discrete Math I/II/III
	   topics and to the tone categories. It answers "how much math am I
	   comfortable wading into?". Any element (in-lesson optional block or
	   home-page lesson tile) that carries a `data-mathlevel="N"` /
	   `data-math-level="N"` requirement is tucked away when the reader's
	   comfort is below N, and reappears — smoothly — once it is raised.
	   DEFAULT_MATH_LEVEL is a deliberate middle: a first-time reader sees
	   the accessible core of the course, and the heaviest derivations are
	   gathered behind an openable "tucked away" summary rather than
	   deleted. */
	const MATH_MIN = 0;
	const MATH_MAX = 100;
	const DEFAULT_MATH_LEVEL = 60;

	/* ── 1e. Debug mode ────────────────────────────────────────
	   Opt-in only. Production (and the CI render validator, which fails on
	   any console.error / console.warn) stays completely silent. Turn it
	   on by loading a page with `?debug=1` in the URL, or by setting
	   `window.__TOPICS_DEBUG__ = true` before topics.js loads. When on,
	   the module logs its decisions and exposes `BlogTopics.dump()`. */
	var DEBUG = false;
	try {
		DEBUG = (typeof window !== 'undefined' && !!window.location && /\bdebug=1\b/.test(window.location.search))
			|| (typeof window !== 'undefined' && !!window.__TOPICS_DEBUG__);
	} catch (e) { /* headless / non-browser: stays off */ }
	function dlog() { if (DEBUG) console.log.apply(console, [ '[topics]' ].concat([].slice.call(arguments))); }
	function dwarn() { if (DEBUG) console.warn.apply(console, [ '[topics]' ].concat([].slice.call(arguments))); }
	function derr() { if (DEBUG) console.error.apply(console, [ '[topics]' ].concat([].slice.call(arguments))); }
	if (DEBUG) {
		console.log('%c[topics] debug mode on — add ?debug=0 to silence', 'color:#818cf8;font-weight:bold');
	}

	/* ── 1f. Core reader types (the 3-card simple view) ────────
	   The full PERSONAS list (below) is a "which archetype are you"
	   picker of nine. But most people just want three doors and a
	   handle they can grab. These are the three most common readers,
	   named so you can think "yeah, that's me" and click:
	     • The Curious    — the interested layman, big picture first
	     • The Scientist  — show me the math and the machine
	     • The Thinker    — what does any of this *mean*?
	   Picking one loads a curated interest set AND a sensible math
	   comfort, then opens the detailed view so the rest of the
	   options appear. Everything stays free to fine-tune afterwards. */
	const CORE_PERSONAS = [
		{ id: 'curious', label: 'The Curious', icon: '🔭',
		  tagline: 'Here for the big picture and the story. Keep the math light.',
		  math: 25,
		  topics: [ 'history', 'philosophy', 'ethics', 'society', 'language' ] },
		{ id: 'scientist', label: 'The Scientist', icon: '🔬',
		  tagline: 'I want to know how it actually works — math, proofs, mechanisms.',
		  math: 85,
		  topics: [ 'math-i', 'math-ii', 'math-iii', 'statistics-i', 'statistics-ii', 'geometry',
		            'reasoning', 'programming', 'data', 'architecture', 'training', 'frontier', 'interpretability' ] },
		{ id: 'thinker', label: 'The Thinker', icon: '🦉',
		  tagline: 'What does any of this mean? Mind, ethics, society, the big questions.',
		  math: 35,
		  topics: [ 'philosophy', 'ethics', 'society', 'law', 'language', 'history', 'reasoning' ] },
		{ id: 'polymath', label: 'The Polymath', icon: '🌀',
		  tagline: 'Everything. All of it. Show me the full picture at full depth.',
		  math: 100,
		  topics: [ 'math-i', 'math-ii', 'math-iii', 'geometry', 'statistics-i', 'statistics-ii',
		            'programming', 'architecture', 'training', 'data', 'hardware', 'inference',
		            'vision', 'audio', 'multimodal', 'agents', 'reasoning', 'interpretability',
		            'language', 'history', 'philosophy', 'ethics', 'safety', 'society', 'law',
		            'frontier', 'reference' ] }
	];

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

	function clampMath(v) {
		v = parseInt(v, 10);
		if (isNaN(v)) return DEFAULT_MATH_LEVEL;
		return Math.max(MATH_MIN, Math.min(MATH_MAX, v));
	}

	function normalizePref(parsed) {
		const out = {
			topics: {},
			categories: {},
			profile: null,
			level: null,
			mathLevel: DEFAULT_MATH_LEVEL,
			corePersonas: []
		};
		if (!parsed || typeof parsed !== 'object') return out;
		const looksV2 = ('topics' in parsed) || ('profile' in parsed) || ('level' in parsed) || ('categories' in parsed) || ('mathLevel' in parsed);
		const topicsObj = looksV2 ? (parsed.topics || {}) : parsed;
		const catsObj = (parsed.categories && typeof parsed.categories === 'object') ? parsed.categories : {};
		TOPICS.forEach(function (t) {
			out.topics[t.id] = topicsObj[t.id] !== false;
		});
		CATEGORIES.forEach(function (c) {
			const def = c.kind === 'suppress'; // suppress ON by default, include OFF
			out.categories[c.id] = (catsObj[c.id] !== undefined) ? (catsObj[c.id] !== false) : def;
		});
		if (looksV2) {
			if (PROFILES.some(function (p) { return p.id === parsed.profile; })) {
				out.profile = parsed.profile;
			}
			if (LEVELS.some(function (l) { return l.id === parsed.level; })) {
				out.level = parsed.level;
			}
			if (parsed.mathLevel !== undefined) {
				out.mathLevel = clampMath(parsed.mathLevel);
			}
			if (Array.isArray(parsed.corePersonas)) {
				out.corePersonas = parsed.corePersonas.filter(function (id) {
					return CORE_PERSONAS.some(function (p) { return p.id === id; });
				});
			} else if (parsed.corePersona && CORE_PERSONAS.some(function (p) { return p.id === parsed.corePersona; })) {
				out.corePersonas = [parsed.corePersona];
			}
		}
		return out;
	}

	function defaultPref() {
		const topics = {};
		TOPICS.forEach(function (t) { topics[t.id] = true; });
		const categories = {};
		CATEGORIES.forEach(function (c) { categories[c.id] = (c.kind === 'suppress'); });
		return { topics: topics, categories: categories, profile: null, level: null, mathLevel: DEFAULT_MATH_LEVEL, corePersonas: [] };
	}

	/** the reader's current math-comfort (0–100) */
	function getMathLevel() {
		return activePref().mathLevel;
	}

	/** set the reader's math-comfort. Pass { pushHistory:false } while a
	    slider is being dragged so a whole drag is a single undo step. */
	function setMathLevel(value, opts) {
		opts = opts || {};
		if (opts.pushHistory !== false) pushHistory();
		const cur = activePref();
		cur.mathLevel = clampMath(value);
		dlog('mathLevel →', cur.mathLevel, '(comfort with math, 0–100)');
		persistPref(cur);
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

	/* ── 2c. Categories (tone filters) — state + helpers ──────── */
	function activeCats() {
		return activePref().categories;
	}
	/** is category `id` currently ON? Unknown ids are treated as ON
	    (neutral) so a stray tag can never hide content. */
	function isCatEnabled(id) {
		const c = catOf(id);
		if (!c) return true;
		return activeCats()[c.id] !== false;
	}
	function setCatEnabled(id, enabled) {
		const c = catOf(id);
		if (!c) return;
		pushHistory();
		const cur = activePref();
		cur.categories[c.id] = !!enabled;
		persistPref(cur);
	}
	/** convenience for the single 'include' lens */
	function setLaymanMode(on) { setCatEnabled('interested-layman', !!on); }

	/** split a flat list of tag ids into { interests, cats } */
	function splitTags(ids) {
		const interests = [];
		const cats = [];
		(ids || []).forEach(function (id) {
			const n = cssSafe(id);
			if (!n) return;
			if (CAT_BY_ID[n]) cats.push(CAT_BY_ID[n].id);
			else interests.push(n);
		});
		return { interests: interests, cats: cats };
	}

	/** parse a data-mathlevel / math: value → 0–100, or null if absent */
	function parseMathReq(v) {
		if (v === null || v === undefined || v === '') return null;
		const n = parseInt(v, 10);
		if (isNaN(n)) return null;
		return Math.max(MATH_MIN, Math.min(MATH_MAX, n));
	}

	/** The heart of the adaptation: given a unit's tags (fine topics
	    AND/OR categories) and an optional math-comfort requirement,
	    decide how it should be displayed and *why*.
	    Three states:
	      'full'    — show normally
	      'partial' — visible but dimmed, with a "why" chip (still readable)
	      'off'     — tucked away behind a reason banner
	    Set-theory: the more of your dials a unit misses, the more it
	    recedes — but it never disappears without a clear reason.
	    `opts.mathReq` (0–100) tucks the unit when the reader's math
	    comfort is below it, independent of interests and tone. The
	    returned `why` ∈ {null,'category','math','interests','layman'}
	    names the single binding reason so the home page can group tucked
	    tiles by category, and `whyLabel` is its human label. */
	function scoreUnit(tagIds, opts) {
		opts = opts || {};
		const mathReq = parseMathReq(opts.mathReq);
		const parts = splitTags(tagIds);
		const interests = parts.interests;
		const cats = parts.cats;
		const catsMap = activeCats();
		const topicsMap = activePref().topics;

		// 1) any 'suppress' category it carries is switched OFF → tucked away
		const suppressed = cats.filter(function (id) {
			return CAT_BY_ID[id].kind === 'suppress' && catsMap[id] === false;
		});
		if (suppressed.length) {
			const whyLabel = suppressed.map(labelFor).join(', ');
			return { state: 'off', reason: 'you switched off ' + whyLabel, why: 'category',
				whyLabel: whyLabel, interests: interests, cats: cats, mathReq: mathReq };
		}

		// 2) graded interest match over the fine topics
		let state = 'full';
		let reason = '';
		let why = null;
		let whyLabel = '';
		if (interests.length) {
			const hits = interests.filter(function (id) { return topicsMap[id] !== false; });
			if (hits.length === 0) {
				state = 'off';
				reason = 'outside your selected interests';
				why = 'interests';
				whyLabel = 'interests';
			} else if (hits.length < interests.length) {
				state = 'partial';
				const off = interests.filter(function (id) { return topicsMap[id] === false; }).map(labelFor);
				reason = 'partial match — ' + off.join(', ') + ' switched off';
				why = 'interests';
				whyLabel = off.join(', ');
			}
		}

		// 3) layman lens: ON and the unit is not part of the layman core
		if (state === 'full' && catsMap['interested-layman'] === true &&
		    cats.indexOf('interested-layman') === -1) {
			state = 'partial';
			reason = 'beyond the layman core';
			why = 'layman';
			whyLabel = 'layman core';
		}

		// 4) math-comfort gate: independent of interests/tone. If the unit
		//    needs more math than the reader is comfortable with, it is
		//    tucked — and this is the binding reason (it can escalate a
		//    partial interest match to fully tucked).
		if (mathReq !== null && getMathLevel() < mathReq) {
			state = 'off';
			reason = 'needs ~' + mathReq + '% math comfort (you are at ' + getMathLevel() + '%)';
			why = 'math';
			whyLabel = 'math proficiency';
		}

		return { state: state, reason: reason, why: why, whyLabel: whyLabel,
			interests: interests, cats: cats, mathReq: mathReq };
	}

	/** how many on-DOM units (sections + home tiles) carry category `id`?
	    Used for the little count badge on a category chip (page-local). */
	function categoryPresence(id) {
		const n = cssSafe(id);
		let count = 0;
		document.querySelectorAll('.topic-block').forEach(function (b) {
			const ids = readTopicAttr(b);
			if (ids.some(function (x) { return cssSafe(x) === n; })) count++;
		});
		document.querySelectorAll('[data-tags]').forEach(function (t) {
			const tags = (t.getAttribute('data-tags') || '').split(',')
				.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
			if (tags.indexOf(n) !== -1) count++;
		});
		return count;
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

	/** persist the full pref (topics + categories + audience selection).
	    Any caller that builds a partial pref (e.g. applying an audience
	    preset) keeps its current category filters — tone dials are a
	    separate axis from "who am I", so they must not be reset by a
	    profile/level change. */
	function persistPref(pref) {
		// Carry over every axis a caller didn't spell out, so that e.g.
		// applying a topic preset never wipes the math-comfort dial or the
		// remembered profile/level. Each caller owns only what it touches.
		const cur = activePref();
		if (!pref.topics) pref.topics = cur.topics;
		if (!pref.categories) pref.categories = cur.categories;
		if (pref.profile === undefined) pref.profile = cur.profile;
		if (pref.level === undefined) pref.level = cur.level;
		if (pref.mathLevel === undefined) pref.mathLevel = cur.mathLevel;
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
		return {
			topics: Object.assign({}, p.topics),
			categories: Object.assign({}, p.categories),
			profile: p.profile,
			level: p.level,
			mathLevel: p.mathLevel
		};
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
			categories: Object.assign({}, snap.categories),
			profile: snap.profile,
			level: snap.level,
			mathLevel: (snap.mathLevel !== undefined) ? clampMath(snap.mathLevel) : DEFAULT_MATH_LEVEL
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

	/** load a classic-type persona's curated topic set. The profile /
	    level selection is left untouched (personas are an interest
	    shortcut, not an audience axis), and the active persona is not
	    persisted — same one-click, no-memory semantics as the quick
	    presets below the picker. */
	function applyPersona(id) {
		const p = (PERSONAS || []).find(function (x) { return x.id === id; });
		if (!p) return;
		if (p.topics) applyPreset(p.topics);
		else setAll(true);
		flashHint('Loaded the ' + p.label + ' · fine-tune the topics below');
	}

	/** ensure map contains an entry for every known topic */
	function normalize(map) {
		const out = {};
		TOPICS.forEach(function (t) { out[t.id] = (map && map[t.id] !== false); });
		return out;
	}

	/** ensure map contains an entry for every known category */
	function normalizeCats(map) {
		const out = {};
		CATEGORIES.forEach(function (c) {
			out[c.id] = (map && map[c.id] !== undefined) ? (map[c.id] !== false) : (c.kind === 'suppress');
		});
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

	/** The toggle no longer reflects the share of topics — it just
	    exposes an aria-label so screen readers know how many topics are
	    currently active. */
	function updateToggleIntensity() {
		const btn = document.getElementById('topics-toggle');
		if (!btn) return;
		const map = normalize(activeMap());
		const active = Object.values(map).filter(Boolean).length;
		const total  = TOPICS.length;
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
		overlay.innerHTML = `
			<div class="topics-backdrop" data-close></div>
			<div class="topics-modal" role="dialog" aria-modal="true" aria-labelledby="topics-title">
				<button class="topics-close" type="button" aria-label="Close" data-close>&times;</button>
				<header class="topics-header">
					<h2 id="topics-title"><span class="topics-title-emoji">🎯</span> Your Interests</h2>
					<p class="topics-tagline">Pick who you are and how deep you want to go — we'll pick a sensible set of topics for you. Fine-tune individual topics below.</p>
				</header>
				<div class="topics-audience">
					<div class="topics-audience-row">
						<span class="topics-audience-label">I'm a</span>
						<div class="topics-seg" role="radiogroup" aria-label="Your profile" data-audience="profile">
							${PROFILES.map(p => '<button type="button" class="topics-seg-btn" role="radio" data-profile="' + escAttr(p.id) + '" title="' + escAttr(p.hint) + '">' + escAttr(p.label) + '</button>').join('')}
						</div>
						<button type="button" class="topics-audience-clear" data-audience-clear title="Clear the audience filter — pick topics by hand below">Clear</button>
					</div>
					<div class="topics-audience-row">
						<span class="topics-audience-label">reading at</span>
						<div class="topics-seg" role="radiogroup" aria-label="Your level" data-audience="level">
							${LEVELS.map(l => '<button type="button" class="topics-seg-btn" role="radio" data-level="' + escAttr(l.id) + '" title="' + escAttr(l.hint) + '">' + escAttr(l.label) + '</button>').join('')}
						</div>
						<span class="topics-audience-suffix">level</span>
					</div>
					<p class="topics-audience-hint" id="topics-audience-hint"></p>
				</div>
				<div class="topics-math-comfort" role="group" aria-label="Math comfort level">
					<span class="topics-math-label">How much math is comfortable?</span>
					<div class="topics-math-control">
						<input type="range" class="topics-math-range" min="${MATH_MIN}" max="${MATH_MAX}" step="5" value="${getMathLevel()}" aria-label="Math comfort, percent">
						<span class="topics-math-val">${getMathLevel()}% · ${mathLabel(getMathLevel())}</span>
					</div>
					<div class="math-comfort-ticks">
						<span>intuition</span><span>algebra</span><span>calculus</span><span>proofs</span><span>everything</span>
					</div>
				</div>
				<div class="topics-categories" role="group" aria-label="Tone filters — switch off what feels heavy">
					<span class="topics-categories-label">Tone — switch off whatever feels heavy</span>
					<div class="topics-cat-row" id="topics-cat-row"></div>
				</div>
				<div class="topics-personas" role="group" aria-label="Classic reader types">
					<span class="topics-personas-label">or, which classic type are you?</span>
					<div class="topics-persona-row">
						${PERSONAS.map(p => '<button type="button" class="topics-persona-btn' + (p.id === 'polymath' ? ' topics-preset-fun' : '') + '" data-persona="' + escAttr(p.id) + '" title="' + escAttr(p.hint) + '"><span class="topics-persona-icon" aria-hidden="true">' + escAttr(p.icon) + '</span>' + escAttr(p.label) + '</button>').join('')}
					</div>
				</div>
				<div class="topics-presets" role="group" aria-label="Quick presets">
					<button type="button" data-preset="all" class="topics-preset-btn">Everything · 100%</button>
					<button type="button" data-preset="essentials" class="topics-preset-btn">Just Essentials</button>
					<button type="button" data-preset="technical" class="topics-preset-btn">Technical Essentials</button>
					<button type="button" data-preset="none" class="topics-preset-btn topics-preset-off">Disable All</button>
				</div>
				<div class="topics-grid" id="topics-grid"></div>
				<footer class="topics-footer">
					<div class="topics-undo-group" role="group" aria-label="History">
						<button type="button" id="topics-undo" class="topics-undo-btn" aria-label="Undo">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
							<span>Undo</span>
						</button>
						<button type="button" id="topics-redo" class="topics-undo-btn" aria-label="Redo">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>
							<span>Redo</span>
						</button>
					</div>
					<span class="topics-count" id="topics-count"></span>
					<span class="topics-hint">Saved automatically · 🍪</span>
				</footer>
			</div>
		`;
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
		overlay.querySelectorAll('[data-persona]').forEach(function (b) {
			b.addEventListener('click', function () {
				applyPersona(b.getAttribute('data-persona'));
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

		const mathSlider = overlay.querySelector('.topics-math-range');
		if (mathSlider) {
			const oVal = overlay.querySelector('.topics-math-val');
			let oDrag = false;
			const oPaint = function () {
				const v = parseInt(mathSlider.value, 10);
				if (oVal) oVal.textContent = v + '% · ' + mathLabel(v);
			};
			mathSlider.addEventListener('input', function () {
				oPaint();
				if (!oDrag) { oDrag = true; pushHistory(); }
				setMathLevel(parseInt(mathSlider.value, 10), { pushHistory: false });
			});
			mathSlider.addEventListener('change', function () { oDrag = false; oPaint(); });
		}
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

	/** render the tone (category) chips inside the overlay, with fresh
	    on/off state + page-local affected counts. Safe before the overlay
	    exists. */
	function renderCategories() {
		const row = document.getElementById('topics-cat-row');
		if (!row) return;
		row.innerHTML = categoryChipsHtml();
		row.querySelectorAll('[data-cat]').forEach(function (b) {
			b.addEventListener('click', function () {
				const id = b.getAttribute('data-cat');
				setCatEnabled(id, !isCatEnabled(id));
			});
		});
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
			hint.textContent = '';
		}
	}

	let _lastFocused = null;

	function openOverlay() {
		ensureOverlay();
		renderGrid();
		renderCategories();
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

	function pickMeta(topicIds) {
		for (let i = 0; i < topicIds.length; i++) {
			const c = catOf(topicIds[i]);
			if (c) return { label: c.label, icon: c.icon };
			const m = topicMeta(topicIds[i]);
			if (m && m.label !== m.id) return { label: m.label, icon: m.icon };
		}
		return { label: topicIds[0] || 'this section', icon: '✦' };
	}

	/* ── 6a. Smooth height animation ──────────────────────────────
	   The whole point: a tucked block grows/shrinks over ~200 ms while
	   its content fades, exactly the way the toggleable full-quotes do
	   (see smartquote() in helper.js) — no snap. Reduced-motion users
	   get the instant version. All of this is best-effort: any failure
	   falls back to the immediate show/hide so nothing can break. */
	const TUCK_MS = 220;
	const TUCK_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

	function animateHeight(el, fromPx, toPx, duration, onDone) {
		if (!el || !el.style) { if (onDone) onDone(); return; }
		if (prefersReducedMotion() || !isFinite(fromPx) || fromPx === toPx) {
			el.style.height = (toPx == null) ? 'auto' : (toPx + 'px');
			if (onDone) onDone();
			return;
		}
		try {
			el.style.overflow = 'hidden';
			el.style.willChange = 'height';
			el.style.height = fromPx + 'px';
			void el.offsetHeight; // commit the start height before transitioning
			el.style.transition = 'height ' + duration + 'ms ' + TUCK_EASE;
			el.style.height = toPx + 'px';
			let done = false;
			const finish = function () {
				if (done) return;
				done = true;
				el.style.transition = '';
				el.style.willChange = '';
				el.style.overflow = '';
				el.style.height = ''; // release to auto so late-loading content can still grow
				el.removeEventListener('transitionend', handler);
				if (onDone) onDone();
			};
			const fallback = setTimeout(finish, duration + 140);
			const handler = function (e) {
				if (e.target === el && e.propertyName === 'height') { clearTimeout(fallback); finish(); }
			};
			el.addEventListener('transitionend', handler);
		} catch (e) {
			el.style.height = (toPx == null) ? 'auto' : (toPx + 'px');
			derr('animateHeight failed, fell back to instant.', e);
			if (onDone) onDone();
		}
	}

	/** (re)build the "tucked away" banner for a collapsed block, with the
	    concrete *why* so a reader always knows why something faded. The
	    title comes from `data-optionaltitle` when present (a titled
	    optional block); otherwise it is derived from the block's topics. */
	function setBanner(block, spec, score) {
		score = score || {};
		const old = block.querySelector(':scope > .topic-block-banner');
		if (old) old.remove();
		const title = spec.title || pickMeta(spec.topicIds).label;
		const icon = (spec.topicIds && spec.topicIds.length) ? pickMeta(spec.topicIds).icon : (score.why === 'math' ? '∫' : '✦');
		const banner = document.createElement('div');
		banner.className = 'topic-block-banner' + (spec.title ? ' topic-block-banner-titled' : '');
		banner.innerHTML = [
			'<span class="topic-block-banner-icon" aria-hidden="true">', escAttr(icon), '</span>',
			'<span class="topic-block-banner-text">',
				'<strong>', escAttr(title), '</strong> tucked away — ',
				escAttr(score.reason || 'outside your selected interests'),
				'. <span class="topic-block-banner-hint">Still curious? Peek inside — nothing is deleted.</span>',
			'</span>',
			'<button type="button" class="topic-block-reveal">',
				'<span class="topic-block-reveal-eye" aria-hidden="true">👁</span> Peek anyway',
			'</button>'
		].join('');
		banner.querySelector('.topic-block-reveal').addEventListener('click', function (ev) {
			ev.preventDefault();
			applyBlockState(block, block._tbSpec, score, true);
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
			return !el.classList.contains('topic-block-banner') && !el.classList.contains('topic-partial-chip');
		});
		moveable.forEach(function (el) { inner.appendChild(el); });
		block.appendChild(inner);
		return inner;
	}

	/** read everything a managed block tells us about itself */
	function blockSpec(block) {
		const topicIds = readTopicAttr(block);
		const tags = (block.getAttribute('data-tags') || '').split(',')
			.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
		const scoreIds = topicIds.concat(tags);
		const mathReq = block.getAttribute('data-mathlevel') || block.getAttribute('data-math-level');
		return {
			topicIds: topicIds,
			scoreIds: scoreIds,
			mathReq: mathReq,
			title: block.getAttribute('data-optionaltitle') || ''
		};
	}

	/** collapse a block, smoothly if `animate`. Always ends in the steady
	    `topic-block-collapsed` state (inner hidden, banner visible). */
	function collapseBlock(block, spec, score, animate) {
		const chip = block.querySelector(':scope > .topic-partial-chip');
		if (chip) chip.remove();
		const inner = ensureInner(block);
		block.classList.remove('topic-block-revealed');
		block.classList.remove('topic-block-partial');
		block.classList.add('topic-block-collapsed');

		if (animate && !prefersReducedMotion()) {
			block.classList.add('tb-collapsing');
			const h = inner.scrollHeight;
			inner.style.opacity = '1';
			inner.style.transition = 'opacity ' + TUCK_MS + 'ms ease';
			setBanner(block, spec, score);
			const banner = block.querySelector(':scope > .topic-block-banner');
			if (banner) { banner.style.transition = 'opacity ' + TUCK_MS + 'ms ease'; banner.style.opacity = '0'; }
			void inner.offsetHeight;
			if (banner) requestAnimationFrame(function () { banner.style.opacity = '1'; });
			inner.style.opacity = '0';
			block._tbBusy = true;
			animateHeight(inner, h, 0, TUCK_MS, function () {
				inner.style.opacity = '';
				inner.style.transition = '';
				block.classList.remove('tb-collapsing');
				block._tbBusy = false;
				if (block._tbDirty) { block._tbDirty = false; reapplyBlock(block); }
			});
		} else {
			setBanner(block, spec, score);
			const banner = block.querySelector(':scope > .topic-block-banner');
			if (banner) { banner.style.transition = ''; banner.style.opacity = ''; }
			inner.style.opacity = '';
		}
	}

	/** expand (reveal) a block, smoothly if `animate`. Ends with the block
	    fully visible; the banner is removed. */
	function revealBlock(block, animate) {
		const inner = block.querySelector(':scope > .topic-block-inner');
		const banner = block.querySelector(':scope > .topic-block-banner');
		block.classList.remove('topic-block-collapsed');
		block.classList.add('topic-block-revealed');

		if (inner && animate && !prefersReducedMotion()) {
			block.classList.add('tb-expanding');
			inner.style.display = 'block';
			inner.style.height = '0px';
			inner.style.overflow = 'hidden';
			inner.style.opacity = '0';
			inner.style.transition = 'none';
			void inner.offsetHeight;
			const h = inner.scrollHeight;
			if (banner) {
				banner.style.transition = 'opacity 140ms ease';
				banner.style.opacity = '0';
			}
			block._tbBusy = true;
			animateHeight(inner, 0, h, TUCK_MS, function () {
				inner.style.height = '';
				inner.style.overflow = '';
				inner.style.opacity = '';
				inner.style.transition = '';
				inner.style.display = '';
				block.classList.remove('tb-expanding');
				block._tbBusy = false;
				if (banner && banner.parentNode) banner.remove();
				if (block._tbDirty) { block._tbDirty = false; reapplyBlock(block); }
			});
		} else {
			if (banner) banner.remove();
			inner.style.height = '';
			inner.style.overflow = '';
			inner.style.opacity = '';
			inner.style.display = '';
		}
	}

	function reapplyBlock(block) {
		if (block._tbScore && block._tbSpec) {
			applyBlockState(block, block._tbSpec, block._tbScore, true);
		}
	}

	/** slim chip shown on a PARTIAL section: it stays readable, just
	    dimmed, with the reason it's only a partial match. */
	function ensurePartialChip(block, score) {
		let chip = block.querySelector(':scope > .topic-partial-chip');
		if (score.state === 'partial') {
			if (!chip) {
				chip = document.createElement('div');
				chip.className = 'topic-partial-chip';
				block.insertBefore(chip, block.firstChild);
			}
			chip.innerHTML = '<span class="topic-partial-chip-dot" aria-hidden="true">◐</span>'
				+ '<span class="topic-partial-chip-text">partial match — ' + escAttr(score.reason) + '</span>';
		} else if (chip) {
			chip.remove();
		}
	}

	/** reconcile one managed block to its target `score.state`, animating
	    only when the state actually changed and `animate` is set. */
	function applyBlockState(block, spec, score, animate) {
		if (block._tbBusy) { block._tbDirty = true; block._tbScore = score; block._tbSpec = spec; return; }
		block._tbScore = score;
		block._tbSpec = spec;
		const wasCollapsed = block.classList.contains('topic-block-collapsed');
		const nowOff = score.state === 'off';
		const hasTitle = !!spec.title;

		if (nowOff) {
			if (hasTitle) {
				// Explicitly titled optional block → full collapse + banner
				if (!wasCollapsed) {
					collapseBlock(block, spec, score, !!animate);
				} else if (block._tbReason !== score.reason) {
					setBanner(block, spec, score);
				}
			} else {
				// No title → just dim, keep content visible
				if (wasCollapsed) revealBlock(block, !!animate);
				block.classList.add('topic-block-dimmed');
			}
			block._tbReason = score.reason;
			return;
		}
		block.classList.remove('topic-block-dimmed');
		if (wasCollapsed) revealBlock(block, !!animate);
		block.classList.toggle('topic-block-partial', score.state === 'partial');
		ensurePartialChip(block, score);
		block._tbReason = score.state;
	}

	/** (re)build visibility for every managed block + tiles + indicators.
	    `opts.animate` toggles the ~200 ms height animation (true on user
	    changes, false for the initial / post-render passes so nothing
	    flashes on load). `opts.tuckMd:false` defers tucking of markdown
	    blocks until after renderMarkdown() has run. */
	function applyVisibility(opts) {
		opts = opts || {};
		const animate = !!opts.animate;
		const tuckMd = opts.tuckMd !== false;

		// First visit (no stored prefs): show everything, don't tuck.
		// The reader opts into filtering by interacting with the widget.
		if (!readRawPref()) {
			document.querySelectorAll('.topic-block.topic-block-collapsed').forEach(function (b) {
				b.classList.remove('topic-block-collapsed');
				b.classList.add('topic-block-revealed');
			});
			if (isIndexPage()) dimCourseTiles();
			updateSkipIndicator();
			return;
		}

		const managed = document.querySelectorAll(
			'.topic-block, [data-optionaltitle], [data-mathlevel], [data-math-level], [data-topic]');
		managed.forEach(function (block) {
			if (block.classList.contains('optional')) return; // the manual .optional system owns these
			if (!block.classList.contains('topic-block')) block.classList.add('topic-block');
			const isMd = block.classList.contains('md');
			if (isMd && !tuckMd) {
				// Leave markdown blocks visible for now; the post-render pass
				// (tuckMd:true) tucks them once their markup is live.
				block._tbState = 'deferred';
				return;
			}
			const spec = blockSpec(block);
			const score = scoreUnit(spec.scoreIds, { mathReq: spec.mathReq });
			applyBlockState(block, spec, score, animate);
		});

		// Inline skipped markers (for ad-hoc skipped-in-place text)
		document.querySelectorAll('.topic-inline').forEach(function (el) {
			const topicIds = readTopicAttr(el);
			if (!topicIds.length) return;
			el.classList.toggle('topic-inline-hidden', !anyEnabled(topicIds));
		});

		if (isIndexPage()) {
			regroupTuckedTiles(animate);
		} else {
			dimCourseTiles();
		}
		updateSkipIndicator();
		applyMathAlts();

		// keep any inline widgets in sync with the new counts
		document.querySelectorAll('[data-topics-inline]').forEach(renderInlineWidget);
	}

	/* ── 6b. Math alternative text ──────────────────────────────
	   A heavy equation can ship a plain-language twin so a reader who
	   has switched off a heavy category gets the simple version.
	   Convention (author writes both; the engine picks one to show):
	     <div class="math-opt" data-math-opt="math-heavy">
	       $$\text{…the heavy LaTeX…}$$
	       <span class="math-alt">…the simpler words…</span>
	     </div>
	   When every listed category is still ON the equation shows; as
	   soon as any listed 'suppress' category is switched OFF the
	   rendered <math> is hidden and the .math-alt twin is shown.
	   No content is added to the course yet — this is the mechanism
	   plus one test (see tests/math_alt_test.js). */
	function applyMathAlts() {
		const heavyOff = CATEGORIES.filter(function (c) {
			return c.kind === 'suppress' && activeCats()[c.id] === false;
		}).map(function (c) { return c.id; });
		document.querySelectorAll('[data-math-opt]').forEach(function (el) {
			const ids = (el.getAttribute('data-math-opt') || '').split(',')
				.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
			const hide = ids.length ? ids.some(function (id) { return heavyOff.indexOf(id) !== -1; }) : false;
			const alt = el.querySelector('.math-alt');
			const eqs = el.querySelectorAll('math');
			if (!alt && !eqs.length) return;
			el.classList.toggle('math-opt-simplified', hide);
			eqs.forEach(function (m) { m.style.display = hide ? 'none' : ''; });
			if (alt) alt.style.display = hide ? 'block' : 'none';
		});
	}

	/* ── 7. Course tile dimming (non-index pages) — 3-state ───── */
	function dimCourseTiles() {
		const tiles = document.querySelectorAll('[data-topics], [data-tags]');
		tiles.forEach(function (tile) {
			const interests = (tile.getAttribute('data-topics') || '').split(',')
				.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
			const cats = (tile.getAttribute('data-tags') || '').split(',')
				.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
			const mathReq = tile.getAttribute('data-mathlevel') || tile.getAttribute('data-math-level');
			const all = interests.concat(cats);
			tile.classList.remove('topic-tile-dim', 'topic-tile-partial', 'topic-tile-active');
			if (!all.length && mathReq == null) return;
			const score = scoreUnit(all, { mathReq: mathReq });
			if (score.state === 'off') {
				tile.classList.add('topic-tile-dim');
				tile.title = 'Tucked away — ' + score.reason;
			} else if (score.state === 'partial') {
				tile.classList.add('topic-tile-partial');
				tile.title = 'Partial match — ' + score.reason;
			} else {
				tile.classList.add('topic-tile-active');
				tile.title = 'In your interests';
			}
		});
	}

	/* ── 7b. Home page: regroup tucked tiles into openable tabs ──
	   Instead of just dimming a lesson tile on the index page, we gather
	   every 'off' tile into a single "Tucked away by your settings" area
	   grouped by *why* it was tucked (math proficiency / a tone category /
	   interests). Each group is a clickable, openable summary tab that
	   smoothly expands to reveal the (still-clickable) lessons inside — so
	   nothing is lost, it is just gathered out of the way. */
	var taGroups = {};
	var taArea = null;
	var gridsRemembered = false;

	function isIndexPage() {
		return !!document.querySelector('.course-overview') && !!document.querySelector('.course-tile');
	}

	function ensureTuckedArea() {
		if (taArea && taArea.parentNode) return taArea;
		const overview = document.querySelector('.course-overview');
		if (!overview) return null;
		taArea = document.createElement('div');
		taArea.className = 'tucked-away-area';
		taArea.setAttribute('aria-label', 'Lessons tucked away by your current settings');
		taArea.innerHTML =
			'<div class="tucked-away-title">'
			+ '<span class="tucked-away-icon" aria-hidden="true">🔎</span>'
			+ '<span>Tucked away by your settings</span>'
			+ '<span class="tucked-away-sub">Click a group to expand — nothing is deleted.</span>'
			+ '</div>';
		overview.appendChild(taArea);
		return taArea;
	}

	function rememberGrids() {
		if (gridsRemembered) return;
		document.querySelectorAll('.course-tiles').forEach(function (grid) {
			grid._taTiles = Array.from(grid.querySelectorAll('.course-tile'));
		});
		gridsRemembered = true;
	}

	function restoreAllTiles() {
		document.querySelectorAll('.course-tiles').forEach(function (grid) {
			(grid._taTiles || []).forEach(function (tile) { grid.appendChild(tile); });
		});
	}

	function groupKeyFor(score) {
		if (score.why === 'math') return 'math';
		if (score.why === 'category') return 'cat:' + score.whyLabel;
		return 'interests';
	}
	function groupLabelFor(score) {
		if (score.why === 'math') return 'Needs more math comfort';
		if (score.why === 'category') return score.whyLabel;
		return 'Outside your interests';
	}
	function groupIconFor(score) {
		if (score.why === 'math') return '∫';
		if (score.why === 'category') return (catOf(score.whyLabel) || {}).icon || '◦';
		return '✦';
	}

	function ensureGroup(key, label, icon) {
		if (taGroups[key]) {
			taGroups[key].labelEl.textContent = label;
			taGroups[key].iconEl.textContent = icon;
			return taGroups[key];
		}
		const g = document.createElement('div');
		g.className = 'tucked-group';
		const header = document.createElement('button');
		header.type = 'button';
		header.className = 'tucked-group-header';
		header.innerHTML =
			'<span class="tucked-group-caret" aria-hidden="true">▸</span>'
			+ '<span class="tucked-group-icon" aria-hidden="true">' + escAttr(icon) + '</span>'
			+ '<span class="tucked-group-label">' + escAttr(label) + '</span>'
			+ '<span class="tucked-group-count"></span>';
		const clip = document.createElement('div');
		clip.className = 'tucked-group-clip';
		clip.style.height = '0px';
		const body = document.createElement('div');
		body.className = 'tucked-group-body';
		clip.appendChild(body);
		g.appendChild(header);
		g.appendChild(clip);
		taArea.appendChild(g);
		const rec = {
			key: key, header: header, clip: clip, body: body,
			iconEl: header.querySelector('.tucked-group-icon'),
			labelEl: header.querySelector('.tucked-group-label'),
			countEl: header.querySelector('.tucked-group-count'),
			caret: header.querySelector('.tucked-group-caret'),
			expanded: false, count: 0
		};
		header.addEventListener('click', function () {
			rec.expanded = !rec.expanded;
			setGroupOpen(rec, rec.expanded, true);
		});
		taGroups[key] = rec;
		return rec;
	}

	function setGroupOpen(g, open, animate) {
		if (!g) return;
		g.header.classList.toggle('tucked-group-open', open);
		g.caret.textContent = open ? '▾' : '▸';
		if (!animate || prefersReducedMotion()) {
			g.clip.style.height = open ? 'auto' : '0px';
			return;
		}
		if (open) {
			g.clip.style.display = 'block';
			const h = g.body.scrollHeight;
			g.clip.style.height = '0px';
			void g.clip.offsetHeight;
			animateHeight(g.clip, 0, h, TUCK_MS, function () { g.clip.style.height = 'auto'; });
		} else {
			const h = g.clip.scrollHeight;
			g.clip.style.height = h + 'px';
			void g.clip.offsetHeight;
			animateHeight(g.clip, h, 0, TUCK_MS);
		}
	}

	function regroupTuckedTiles(animate) {
		if (!isIndexPage()) return;
		try {
			rememberGrids();
			restoreAllTiles();

			document.querySelectorAll('.course-tiles').forEach(function (grid) {
				const tiles = Array.from(grid.querySelectorAll('.course-tile'));
				let tucked = 0;
				tiles.forEach(function (tile) {
					const interests = (tile.getAttribute('data-topics') || '').split(',')
						.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
					const cats = (tile.getAttribute('data-tags') || '').split(',')
						.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
					const mathReq = tile.getAttribute('data-mathlevel') || tile.getAttribute('data-math-level');
					const score = scoreUnit(interests.concat(cats), { mathReq: mathReq });
					tile._taOff = (score.state === 'off');
					if (tile._taOff) tucked++;
				});

				let divider = grid.querySelector(':scope > .ta-grid-divider');
				if (tucked === 0) {
					if (divider) divider.remove();
					return;
				}

				if (!divider) {
					divider = document.createElement('div');
					divider.className = 'ta-grid-divider';
					divider.innerHTML = '<span class="ta-grid-divider-label" aria-hidden="true">Not shown</span>'
						+ '<span class="ta-grid-divider-count"></span>';
				}
				divider.querySelector('.ta-grid-divider-count').textContent = tucked + ' lesson' + (tucked === 1 ? '' : 's');

				tiles.forEach(function (tile) {
					if (tile._taOff) {
						tile.classList.add('ta-tile-off');
						grid.insertBefore(tile, divider.nextSibling === tile ? divider : divider);
					} else {
						tile.classList.remove('ta-tile-off');
					}
				});

				if (divider.parentNode !== grid) {
					grid.insertBefore(divider, grid.lastElementChild);
				}
				// Ensure divider is right before the first off-tile
				const firstOff = tiles.find(function (t) { return t._taOff; });
				if (firstOff) grid.insertBefore(divider, firstOff);
			});

			dlog('home page: tiles regrouped in-place per part');
		} catch (e) {
			derr('regroupTuckedTiles failed; leaving tiles as-is.', e);
		}
	}

	/* ── 8. Per-page "X tucked / partial" indicator ─────────────
	   Disabled: the per-block banners already communicate the tucked
	   state. A global "5 sections tucked away by your interests" bar
	   at the top of the page is redundant and alarming on first load. */
	function updateSkipIndicator() {
		const bar = document.getElementById('topics-skip-bar');
		if (bar) bar.remove();
	}

	/* ── 9. Change broadcast ──────────────────────────────────── */
	function fireChange() {
		updateToggleIntensity();
		renderGrid();
		renderCategories();
		renderAudienceSelection();
		// User-initiated change → animate the ~200 ms tuck/reveal.
		applyVisibility({ animate: true }); // also re-renders any inline widget
		try {
			document.dispatchEvent(new CustomEvent('topics:change', { detail: { map: normalize(activeMap()) } }));
		} catch (e) { /* old browsers */ }
	}

	/* ── 10. Inline widget (for intro.php / module pages) ───────
	   Two flavours:
	   • default            — the full grid of topic pills.
	   • personas-first     — starts as a small card showing only the
	     classic-type chips (low cognitive load); clicking a type
	     applies it and expands to the full grid, and the "detailed
	     settings" link opens the full picker overlay. The expanded
	     state is remembered per element via a dataset flag so the
	     widget stays detailed across re-renders. */
	function prefersReducedMotion() {
		return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function summarySpan(active, total, tucked, partial) {
		let s = '<strong>' + active + '</strong> of ' + total + ' topics active';
		if (tucked) s += ' · <em>' + tucked + ' section' + (tucked === 1 ? '' : 's') + ' tucked away</em>';
		if (partial) s += ' · <em>' + partial + ' partial match' + (partial === 1 ? '' : 'es') + '</em>';
		return '<div class="inline-topics-summary itx-item">'
			+ '<span class="inline-topics-icon" aria-hidden="true">🎯</span>'
			+ '<span>' + s + '</span></div>';
	}

	function categoryChipsHtml() {
		const catsMap = activeCats();
		return CATEGORIES.map(function (c) {
			const on = catsMap[c.id] !== false;
			const count = c.kind === 'suppress' ? categoryPresence(c.id) : 0;
			const badge = (c.kind === 'suppress' && count) ? '<span class="topics-cat-count">' + count + '</span>' : '';
			const cls = 'topics-cat-chip itx-item'
				+ (on ? ' topics-cat-on' : ' topics-cat-off')
				+ (c.kind === 'include' ? ' topics-cat-include' : '');
			return '<button type="button" class="' + cls + '" data-cat="' + escAttr(c.id) + '" title="' + escAttr(c.desc) + '">'
				+ '<span class="topics-cat-icon" aria-hidden="true">' + escAttr(c.icon) + '</span>'
				+ '<span class="topics-cat-label">' + escAttr(c.label) + '</span>' + badge + '</button>';
		}).join('');
	}

	function wireCategoryChips(host) {
		host.querySelectorAll('[data-cat]').forEach(function (b) {
			b.addEventListener('click', function () {
				const id = b.getAttribute('data-cat');
				setCatEnabled(id, !isCatEnabled(id));
			});
		});
	}

	function fairyDust(anchor) {
		if (prefersReducedMotion() || !anchor || !anchor.appendChild) return;
		const layer = document.createElement('div');
		layer.className = 'itx-dust';
		for (let i = 0; i < 14; i++) {
			const s = document.createElement('span');
			s.className = 'itx-dust-p';
			const size = 3 + Math.random() * 4;
			s.style.width = size + 'px';
			s.style.height = size + 'px';
			s.style.left = (8 + Math.random() * 84) + '%';
			s.style.bottom = (4 + Math.random() * 22) + '%';
			s.style.animationDelay = (Math.random() * 200) + 'ms';
			s.style.setProperty('--dx', (Math.random() * 56 - 28) + 'px');
			s.style.setProperty('--rise', -(44 + Math.random() * 72) + 'px');
			s.style.color = i % 3 === 0 ? 'var(--mn-accent)' : (i % 3 === 1 ? '#f0abfc' : '#a5b4fc');
			layer.appendChild(s);
		}
		anchor.appendChild(layer);
		setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 1500);
	}

	/** staggered, smartquote-style reveal of everything marked .itx-item,
	    with a light sparkle. No-op under reduced-motion. */
	function animateInlineReveal(host) {
		if (prefersReducedMotion()) return;
		const items = host.querySelectorAll('.itx-item');
		if (!items.length) return;
		const perItem = Math.max(10, Math.min(28, 480 / items.length));
		host.classList.add('itx-animating');
		items.forEach(function (el, i) { el.style.transitionDelay = Math.round(i * perItem) + 'ms'; });
		void host.offsetWidth; // commit the hidden state before revealing
		requestAnimationFrame(function () {
			requestAnimationFrame(function () { host.classList.add('itx-anim-on'); });
		});
		fairyDust(host);
		setTimeout(function () {
			host.classList.remove('itx-animating', 'itx-anim-on');
			items.forEach(function (el) { el.style.transitionDelay = ''; });
		}, items.length * perItem + 520);
	}

	/* ── 10a. Math-comfort slider + persona-card helpers ───────── */
	var _skipInlineWidget = false; // true while a slider is mid-drag (see below)

	/** Toggle a core persona label on/off. Personas are combinable
	    (union of their topics). Polymath is exclusive: selecting any
	    other persona removes it. Topics are only disabled when no
	    remaining active persona covers them. */
	function applyCorePersona(id) {
		const p = (CORE_PERSONAS || []).find(function (x) { return x.id === id; });
		if (!p) return;
		const cur = activePref();
		const active = (cur.corePersonas || []).slice();
		const idx = active.indexOf(id);
		const adding = (idx === -1);

		if (adding) {
			active.push(id);
			// Polymath exclusivity: picking a specific type drops polymath
			if (id !== 'polymath' && active.indexOf('polymath') !== -1) {
				const pi = active.indexOf('polymath');
				active.splice(pi, 1);
				dlog('polymath auto-removed (specific persona selected)');
			}
			(p.topics || []).forEach(function (t) { cur.topics[cssSafe(t)] = true; });
			dlog('persona +', p.label);
		} else {
			active.splice(idx, 1);
			// Recalc: disable topics no longer covered by any active persona
			const covered = {};
			active.forEach(function (aid) {
				const ap = CORE_PERSONAS.find(function (x) { return x.id === aid; });
				if (ap) (ap.topics || []).forEach(function (t) { covered[cssSafe(t)] = true; });
			});
			(p.topics || []).forEach(function (t) {
				const cid = cssSafe(t);
				if (!covered[cid]) cur.topics[cid] = false;
			});
			dlog('persona -', p.label);
		}

		pushHistory();
		cur.corePersonas = active;
		persistPref(cur);
	}

	function mathLabel(v) {
		if (v < 20) return 'Diagrams & intuition';
		if (v < 40) return 'Basic algebra & graphs';
		if (v < 60) return 'Calculus & linear algebra';
		if (v < 80) return 'Proofs & advanced math';
		if (v < 100) return 'Deep formal math';
		return 'Everything, no shortcuts';
	}

	function mathSliderHtml() {
		const v = getMathLevel();
		return '<div class="math-comfort itx-item" role="group" aria-label="Math comfort">'
			+ '<div class="math-comfort-top">'
			+   '<span class="math-comfort-label">∑ Are you comfortable with…</span>'
			+   '<span class="math-comfort-val" data-math-val>' + v + '% · ' + escAttr(mathLabel(v)) + '</span>'
			+ '</div>'
			+ '<input type="range" class="math-comfort-range" min="' + MATH_MIN + '" max="' + MATH_MAX
			+ '" step="5" value="' + v + '" aria-label="Math comfort, percent">'
			+ '<div class="math-comfort-ticks">'
			+   '<span data-tick="0">intuition</span>'
			+   '<span data-tick="35">algebra</span>'
			+   '<span data-tick="60">calculus</span>'
			+   '<span data-tick="80">proofs</span>'
			+   '<span data-tick="100">everything</span>'
			+ '</div>'
			+ '</div>';
	}

	function wireMathSlider(h) {
		const range = h.querySelector('.math-comfort-range');
		if (!range) return;
		const val = h.querySelector('[data-math-val]');
		let dragging = false;
		const paint = function () {
			const v = parseInt(range.value, 10);
			if (val) val.textContent = v + '% · ' + mathLabel(v);
		};
		range.addEventListener('input', function () {
			paint();
			if (!dragging) { dragging = true; pushHistory(); }
			_skipInlineWidget = true;
			try { setMathLevel(parseInt(range.value, 10), { pushHistory: false }); }
			finally { _skipInlineWidget = false; }
		});
		range.addEventListener('change', function () {
			dragging = false;
			paint();
			renderInlineWidget(h);
		});
	}

	/** run `changeFn` (which may re-render the widget) while the host's
	    height eases from its old size to the new one — the "reveal more /
	    tuck away" feel, no snap. */
	function swapWidget(h, changeFn) {
		if (prefersReducedMotion()) { changeFn(); animateInlineReveal(h); return; }
		try {
			const startH = h.offsetHeight;
			h.style.overflow = 'hidden';
			h.style.height = startH + 'px';
			void h.offsetWidth;
			changeFn();
			const endH = h.scrollHeight;
			h.style.transition = 'height ' + TUCK_MS + 'ms ' + TUCK_EASE;
			h.style.height = endH + 'px';
			let done = false;
			const fin = function () { if (done) return; done = true; h.style.transition = ''; h.style.overflow = ''; h.style.height = ''; };
			const fb = setTimeout(fin, TUCK_MS + 180);
			const onEnd = function (e) { if (e.target === h && e.propertyName === 'height') { clearTimeout(fb); fin(); } };
			h.addEventListener('transitionend', onEnd);
			animateInlineReveal(h);
		} catch (e) {
			h.style.overflow = ''; h.style.height = ''; h.style.transition = '';
			derr('swapWidget failed', e);
		}
	}

	function renderInlineWidget(host) {
		// A slider is being dragged in this widget: a full rebuild would
		// replace the <input> and kill the drag, so leave it alone.
		if (_skipInlineWidget) return;

		const map = normalize(activeMap());
		const active = Object.values(map).filter(Boolean).length;
		const total = TOPICS.length;
		const tucked = document.querySelectorAll('.topic-block.topic-block-collapsed').length;
		const partial = document.querySelectorAll('.topic-block.topic-block-partial').length;

		const isPersonasHost = (host.getAttribute('data-topics-inline') || '') === 'personas-first';
		const mode = isPersonasHost ? (host.dataset.mode === 'detailed' ? 'detailed' : 'simple') : 'grid';

		const summary = summarySpan(active, total, tucked, partial);
		const catRow = '<div class="topics-cat-row" role="group" aria-label="Tone filters">'
			+ '<span class="topics-cat-label-mini" aria-hidden="true">tone</span>'
			+ categoryChipsHtml() + '</div>';
		const slider = mathSliderHtml();

		let html, wire;
		const activePersonas = activePref().corePersonas || [];
		if (mode === 'simple') {
			html = [
				'<div class="inline-topics-head">',
					summary,
					'<button type="button" class="inline-topics-open inline-topics-secondary" data-open-detailed>detailed settings <span class="itx-arrow" aria-hidden="true">→</span></button>',
				'</div>',
				'<div class="core-personas" role="group" aria-label="Which reader are you?">'
					+ CORE_PERSONAS.map(function (p) {
						const sel = activePersonas.indexOf(p.id) !== -1 ? ' core-persona-active' : '';
						return '<button type="button" class="core-persona itx-item' + sel + '" data-core-persona="' + escAttr(p.id) + '">'
							+ '<span class="core-persona-icon" aria-hidden="true">' + escAttr(p.icon) + '</span>'
							+ '<span class="core-persona-body">'
							+   '<span class="core-persona-name">' + escAttr(p.label) + '</span>'
							+   '<span class="core-persona-tag">' + escAttr(p.tagline) + '</span>'
							+ '</span>'
							+ '<span class="core-persona-go" aria-hidden="true">→</span>'
							+ '</button>';
					}).join('') +
				'</div>',
				slider,
				'<p class="inline-topics-foot">Mix and match — each label unlocks its topics. Math comfort is independent below. Nothing is locked.</p>'
			].join('');
		wire = function (h) {
			h.querySelectorAll('[data-core-persona]').forEach(function (b) {
				b.addEventListener('click', function () {
					applyCorePersona(b.getAttribute('data-core-persona'));
					renderInlineWidget(h);
				});
			});
			const det = h.querySelector('[data-open-detailed]');
			if (det) det.addEventListener('click', function () {
				h.dataset.mode = 'detailed';
				swapWidget(h, function () { renderInlineWidget(h); });
			});
			wireMathSlider(h);
		};
		} else if (mode === 'detailed') {
			const more = PERSONAS.filter(function (p) { return CORE_PERSONAS.every(function (c) { return c.id !== p.id; }); });
			html = [
				'<div class="inline-topics-head">',
					summary,
					'<div class="inline-topics-head-actions">',
						'<button type="button" class="inline-topics-open inline-topics-secondary" data-collapse-types><span class="itx-arrow" aria-hidden="true">←</span> simple</button>',
						'<button type="button" class="inline-topics-open" data-open-picker>',
							'<span class="ti-target" aria-hidden="true">',
							'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
							'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
							'</svg></span>',
							'Open interest picker',
						'</button>',
					'</div>',
				'</div>',
				slider,
				catRow,
				'<div class="inline-persona-more" role="group" aria-label="More reader types">'
					+ more.map(function (p) {
						return '<button type="button" class="topics-persona-btn itx-item' + (p.id === 'polymath' ? ' topics-preset-fun' : '') +
							'" data-persona="' + escAttr(p.id) + '" title="' + escAttr(p.hint) + '">' +
							'<span class="topics-persona-icon" aria-hidden="true">' + escAttr(p.icon) + '</span>' +
							escAttr(p.label) + '</button>';
					}).join('') +
				'</div>',
				'<div class="inline-topics-grid">' + TOPICS.map(function (t) {
					const on = map[t.id] !== false;
					return '<button type="button" class="ipill itx-item ' + (on ? 'ipill-on' : 'ipill-off') +
						'" data-topic-id="' + escAttr(t.id) + '">' +
						'<span class="ipill-icon">' + escAttr(t.icon) + '</span>' +
						'<span class="ipill-label">' + escAttr(t.label) + '</span>' +
						'<span class="ipill-x" aria-hidden="true">' + (on ? '✓' : '×') + '</span></button>';
				}).join('') + '</div>',
				'<p class="inline-topics-foot">Fine-tune any topic · <em>tone</em> chips hide heavy content in one click · the ∑ dial gates the deeper math. Saved in a cookie.</p>'
			].join('');
			wire = function (h) {
				const pick = h.querySelector('[data-open-picker]');
				if (pick) pick.addEventListener('click', openOverlay);
				const collapse = h.querySelector('[data-collapse-types]');
				if (collapse) collapse.addEventListener('click', function () {
					h.dataset.mode = '';
					swapWidget(h, function () { renderInlineWidget(h); });
				});
				h.querySelectorAll('[data-persona]').forEach(function (b) {
					b.addEventListener('click', function () { applyPersona(b.getAttribute('data-persona')); });
				});
				h.querySelectorAll('.ipill').forEach(function (btn) {
					btn.addEventListener('click', function () {
						const id = btn.getAttribute('data-topic-id');
						setEnabled(id, !isEnabled(id));
					});
				});
				wireCategoryChips(h);
				wireMathSlider(h);
			};
		} else {
			// non-personas host: the classic full grid (kept for other pages)
			html = [
				'<div class="inline-topics-head">',
					summary,
					'<div class="inline-topics-head-actions">',
						'<button type="button" class="inline-topics-open" data-open-picker>',
							'<span class="ti-target" aria-hidden="true">',
							'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
							'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
							'</svg></span>',
							'Open interest picker',
						'</button>',
					'</div>',
				'</div>',
				catRow,
				'<div class="inline-topics-grid">' + TOPICS.map(function (t) {
					const on = map[t.id] !== false;
					return '<button type="button" class="ipill itx-item ' + (on ? 'ipill-on' : 'ipill-off') +
						'" data-topic-id="' + escAttr(t.id) + '">' +
						'<span class="ipill-icon">' + escAttr(t.icon) + '</span>' +
						'<span class="ipill-label">' + escAttr(t.label) + '</span>' +
						'<span class="ipill-x" aria-hidden="true">' + (on ? '✓' : '×') + '</span></button>';
				}).join('') + '</div>',
				'<p class="inline-topics-foot">Toggle topics to fine-tune · <em>tone</em> chips above hide heavy content in one click. Or the small <strong>🎯 top-right</strong> any time — saved in a cookie.</p>'
			].join('');
			wire = function (h) {
				const pick = h.querySelector('[data-open-picker]');
				if (pick) pick.addEventListener('click', openOverlay);
				h.querySelectorAll('.ipill').forEach(function (btn) {
					btn.addEventListener('click', function () {
						const id = btn.getAttribute('data-topic-id');
						setEnabled(id, !isEnabled(id));
					});
				});
				wireCategoryChips(h);
			};
		}

		host.innerHTML = html;
		wire(host);
	}

	/* ── 11. Init ─────────────────────────────────────────────── */
	function dumpState() {
		return {
			debug: DEBUG,
			mathLevel: getMathLevel(),
			profile: activePref().profile,
			level: activePref().level,
			topics: normalize(activeMap()),
			categories: normalizeCats(activeCats())
		};
	}

	function init() {
		ensureToggleButton();
		ensureOverlay();
		renderGrid();
		// tuckMd:false: don't tuck markdown blocks before renderMarkdown()
		// has turned their source into live HTML (that pass runs on 'load'
		// and re-applies visibility with tuckMd defaulting to true).
		applyVisibility({ animate: false, tuckMd: false });
		document.querySelectorAll('[data-topics-inline]').forEach(renderInlineWidget);
		if (DEBUG) dlog('ready — dump state with BlogTopics.dump()');
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	/* ── 12. Public API ───────────────────────────────────────── */
	window.BlogTopics = {
		TOPICS: TOPICS,
		CATEGORIES: CATEGORIES,
		PRESETS: PRESETS,
		PROFILES: PROFILES,
		LEVELS: LEVELS,
		PERSONAS: PERSONAS,
		CORE_PERSONAS: CORE_PERSONAS,
		AUDIENCE_PRESETS: AUDIENCE_PRESETS,
		MATH_MIN: MATH_MIN,
		MATH_MAX: MATH_MAX,
		DEBUG: DEBUG,
		preprocess: preprocess,
		applyVisibility: applyVisibility,
		applyMathAlts: applyMathAlts,
		scoreUnit: scoreUnit,
		getMathLevel: getMathLevel,
		setMathLevel: setMathLevel,
		applyCorePersona: applyCorePersona,
		dump: dumpState,
		activeMap: function () { return normalize(activeMap()); },
		activeCats: function () { return normalizeCats(activeCats()); },
		activePref: function () { return activePref(); },
		isEnabled: isEnabled,
		anyEnabled: anyEnabled,
		setEnabled: setEnabled,
		setAll: setAll,
		isCategory: isCategory,
		isCatEnabled: isCatEnabled,
		setCatEnabled: setCatEnabled,
		setLaymanMode: setLaymanMode,
		categoryPresence: categoryPresence,
		labelFor: labelFor,
		applyPreset: applyPreset,
		applyAudience: applyAudience,
		applyAudiencePartial: applyAudiencePartial,
		applyPersona: applyPersona,
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
