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

	// Build fingerprint for tbDebug() — bump on each masking/reveal change
	// so a stale/cached/production page is obvious in the debug report.
	window.__TB_VER = '2026-09-22-group-badge-run-start';

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
	const DEFAULT_MATH_LEVEL = 50; // "University" — the middle stop
	// The slider snaps to five stops, easy → research. The *gate* stays
	// fine-grained (it compares against each block's data-mathlevel); these
	// stops only shape the comfort level a reader actually picks.
	const MATH_LEVELS = [
		{ v: 0,   label: 'No math' },
		{ v: 25,  label: 'High school' },
		{ v: 50,  label: 'University' },
		{ v: 75,  label: 'Graduate' },
		{ v: 100, label: 'Research' }
	];
	function snapMath(v) {
		// Guard: a non-numeric/NaN level (shouldn't happen — clampMath
		// normalises — but never trust it) snaps to the middle stop.
		if (typeof v !== 'number' || !isFinite(v)) return DEFAULT_MATH_LEVEL;
		let best = MATH_LEVELS[0].v;
		for (let i = 0; i < MATH_LEVELS.length; i++) {
			if (Math.abs(MATH_LEVELS[i].v - v) < Math.abs(best - v)) best = MATH_LEVELS[i].v;
		}
		return best;
	}
	function mathLevelLabel(v) {
		const s = snapMath(v);
		for (let i = 0; i < MATH_LEVELS.length; i++) {
			if (MATH_LEVELS[i].v === s) return MATH_LEVELS[i].label;
		}
		return MATH_LEVELS[0].label;
	}

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

 	/* ── 1f. Lesson dependency graph ───────────────────────────────
 	   Each lesson lists the OTHER lessons it builds on. When every
 	   prerequisite is marked "learned", the lesson's heavy blocks get
 	   a green "you could understand this" indicator and are auto-
 	   revealed regardless of the math-comfort slider. */
 	const LESSON_DEPS = {
 		'math-i':           [],
 		'math-ii':          ['math-i'],
 		'math-iii':         ['math-ii'],
 		'math-iv':          ['math-iii'],
 		'differentiation':  ['math-i', 'math-ii']
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
			corePersonas: [],
			learned: {}
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
			if (parsed.learned && typeof parsed.learned === 'object') {
				Object.keys(parsed.learned).forEach(function (k) {
					if (typeof k === 'string' && parsed.learned[k]) out.learned[k] = true;
				});
			}
		}
		return out;
	}

	function defaultPref() {
		const topics = {};
		TOPICS.forEach(function (t) { topics[t.id] = true; });
		const categories = {};
		CATEGORIES.forEach(function (c) { categories[c.id] = (c.kind === 'suppress'); });
		return { topics: topics, categories: categories, profile: null, level: null, mathLevel: DEFAULT_MATH_LEVEL, corePersonas: [], learned: {} };
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

	/* ── 1g. Learned / dependency tracking ─────────────────────
	   The reader marks a lesson as "learned" after finishing it.
	   When all prerequisites of a lesson are learned, its heavy
	   blocks get a green "you could understand this" indicator and
	   are auto-revealed (the math slider no longer hides them). */

	function getLessonId() {
		const el = document.querySelector('[data-lesson-id]');
		if (el) return el.getAttribute('data-lesson-id');
		// Fallback: derive from URL slug
		try {
			const path = (window && window.location && window.location.pathname) || '';
			const m = path.match(/\/([a-z_0-9]+)\.php?\/?$/i) || path.match(/\/([a-z_0-9]+)\/?$/i);
			return m ? m[1].toLowerCase() : null;
		} catch (e) { return null; }
	}

	function isLearned(lessonId) {
		return !!activePref().learned[lessonId];
	}

	function depsMet(lessonId) {
		const deps = LESSON_DEPS[lessonId];
		if (!deps || !deps.length) return true; // base lesson, no deps
		return deps.every(function (d) { return isLearned(d); });
	}

	function toggleLearned(lessonId) {
		if (!lessonId || (!LESSON_DEPS.hasOwnProperty(lessonId) && !lessonMeta(lessonId))) return;
		pushHistory();
		const cur = activePref();
		if (cur.learned[lessonId]) {
			delete cur.learned[lessonId];
			dlog('un-learned →', lessonId);
		} else {
			cur.learned[lessonId] = true;
			dlog('learned →', lessonId);
		}
		persistPref(cur);
	}

	/* ── lesson lookup (titles + urls for dependency links) ─────
	   PHP ships the full course index as window.__moduleNavData on
	   every lesson page (see functions.php). We normalise both the
	   underscore file slug (math_i) and the hyphen lesson id
	   (math-i) so a LESSON_DEPS key resolves to its real lesson. */
	var _lessonIndex = null;
	function lessonIndex() {
		if (_lessonIndex) return _lessonIndex;
		_lessonIndex = {};
		const mods = (window.__moduleNavData && window.__moduleNavData.modules) || [];
		mods.forEach(function (m) {
			if (!m || !m.slug) return;
			const entry = { title: m.title, url: m.url };
			_lessonIndex[m.slug] = entry;
			_lessonIndex[m.slug.replace(/_/g, '-')] = entry;
		});
		return _lessonIndex;
	}
	function lessonMeta(id) {
		if (!id) return null;
		const idx = lessonIndex();
		return idx[id] || idx[id.replace(/-/g, '_')] || null;
	}
	function lessonLink(id) {
		const m = lessonMeta(id);
		if (m && m.url) {
			return '<a class="tdp-chip" href="' + escAttr(m.url) + '">' + escAttr(m.title) + '</a>';
		}
		return '<span class="tdp-chip tdp-chip-plain">' + escAttr(id.replace(/-/g, ' ')) + '</span>';
	}

	/** lessons whose prerequisite list contains `id` (i.e. what `id`
	    unlocks once the reader marks it learned). */
	function unlocksOf(id) {
		return Object.keys(LESSON_DEPS).filter(function (k) {
			return (LESSON_DEPS[k] || []).indexOf(id) !== -1;
		});
	}

	/** status-aware prerequisite chips: a covered lesson is a green
	    link (revisit it); an uncovered one is a link (to read it) plus a
	    one-tap "✓" confirm button so the reader never has to navigate
	    away to mark it learned. */
	function depChips(lessonId) {
		return (LESSON_DEPS[lessonId] || []).map(function (d) {
			const m = lessonMeta(d);
			const title = m && m.title ? m.title : d.replace(/-/g, ' ');
			const dot = '<span class="tdp-dot" aria-hidden="true">' + (isLearned(d) ? '✓' : '○') + '</span>';
			const href = (m && m.url) ? ' href="' + escAttr(m.url) + '"' : '';
			if (isLearned(d)) {
				const cls = 'tdp-chip tdp-chip-met';
				return m && m.url
					? '<a class="' + cls + '"' + href + ' title="Revisit ' + escAttr(title) + '">' + dot + escAttr(title) + '</a>'
					: '<span class="' + cls + '" title="Covered">' + dot + escAttr(title) + '</span>';
			}
			const chip = m && m.url
				? '<a class="tdp-chip tdp-chip-unmet" href="' + escAttr(m.url) + '" title="Read ' + escAttr(title) + '">' + dot + escAttr(title) + '</a>'
				: '<span class="tdp-chip tdp-chip-unmet tdp-chip-plain">' + dot + escAttr(title) + '</span>';
			const mark = '<button type="button" class="tdp-mark" data-mark-dep="' + escAttr(d) + '" title="Mark ' + escAttr(title) + ' as learned" aria-label="Mark ' + escAttr(title) + ' as learned"><span aria-hidden="true">✓</span></button>';
			return chip + mark;
		}).join(' ');
	}

	/* ── course order (reading path + progress) ─────────────────
	   PHP ships the full linear course as window.__moduleNavData.modules
	   (ordered by part + order) with a `current` index on every lesson
	   page. This lets every lesson — not just the math spine — show where
	   the reader is and what comes next. */
	var _courseOrder = null;
	function courseOrder() {
		if (_courseOrder) return _courseOrder;
		_courseOrder = (window.__moduleNavData && window.__moduleNavData.modules) || [];
		return _courseOrder;
	}
	function courseIndexOf(lessonId) {
		if (!lessonId) return -1;
		const mods = courseOrder();
		for (let i = 0; i < mods.length; i++) {
			const s = mods[i].slug;
			if (s === lessonId || s.replace(/_/g, '-') === lessonId) return i;
		}
		return -1;
	}
	function countLearned() {
		const learned = activePref().learned;
		return courseOrder().reduce(function (n, m) {
			return n + (learned[m.slug] || learned[m.slug.replace(/_/g, '-')] ? 1 : 0);
		}, 0);
	}

	/** Keep the learned button pinned to the END OF THE LESSON BODY —
	    right before #footnotes-section / #sources-section, never after them.
	    The button is created once (on init, before bibtexify has appended
	    those sections), so "settling" means: if the footnotes/sources now
	    exist, sit immediately before the first of them; otherwise (no
	    citations at all) stay the last child of #contents. Either way it is
	    a no-op once in place, so re-calling it on click never moves the
	    element → no scroll jump. */
	function settleLearnedButton() {
		const btn = document.getElementById('topic-learned-btn');
		const contents = document.getElementById('contents');
		if (!btn || !contents) return;
		// The course status box now lives at the END of the article body;
		// the learned button sits right before it (see settleCourseStatusBox).
		const box = document.getElementById('course-status-box');
		if (box && box.parentNode === contents && box.previousElementSibling !== btn) {
			box.parentNode.insertBefore(btn, box);
			return;
		}
		const anchor = contents.querySelector('#footnotes-section, #sources-section');
		if (anchor) {
			if (anchor.previousElementSibling !== btn) anchor.parentNode.insertBefore(btn, anchor);
		} else if (contents.lastElementChild !== btn) {
			contents.appendChild(btn);
		}
	}

	/** Pin the course-status box ("Lesson N of M") to the END of the lesson
	    body: right before #footnotes-section / #sources-section when present,
	    otherwise the last child of #contents — always after the learned
	    button. Idempotent: a no-op once in place, so re-calling never shifts
	    the element → no scroll jump. Safe to call before the box exists
	    (guarded) or before the learned button exists (order is re-asserted
	    whichever of the two settles last). */
	function settleCourseStatusBox() {
		try {
			const box = document.getElementById('course-status-box');
			const contents = document.getElementById('contents');
			if (!box || !contents || box.parentNode !== contents) return;
			const anchor = contents.querySelector('#footnotes-section, #sources-section');
			if (anchor) {
				if (anchor.previousElementSibling !== box) anchor.parentNode.insertBefore(box, anchor);
			} else if (contents.lastElementChild !== box) {
				contents.appendChild(box);
			}
			const btn = document.getElementById('topic-learned-btn');
			if (btn && btn.parentNode === contents && box.previousElementSibling !== btn) {
				box.parentNode.insertBefore(btn, box);
			}
		} catch (e) {
			if (DEBUG) derr('settleCourseStatusBox:', e);
		}
	}

	function showLearnedUI() {
		// Guarded: this now runs on EVERY lesson, so a hiccup here must
		// never take the lesson down with it (worst case: no learned UI).
		try {
			const lessonId = getLessonId();
			if (!lessonId) return;

			const contents = document.getElementById('contents');
			if (!contents) return;

			const pos = courseIndexOf(lessonId);
			const isSpine = LESSON_DEPS.hasOwnProperty(lessonId);
			const inCourse = pos >= 0;
			if (!inCourse && !isSpine) return;

			const mods = courseOrder();
			const total = mods.length;
			const next = (pos >= 0 && pos + 1 < total) ? mods[pos + 1] : null;
			const done = countLearned();

			const deps = isSpine ? (LESSON_DEPS[lessonId] || []) : [];
			const met = isSpine ? depsMet(lessonId) : false;
			const nMet = deps.filter(function (d) { return isLearned(d); }).length;
			const unlocks = isSpine ? unlocksOf(lessonId) : [];

			// Course-status box at the END of the article (after the
			// "mark as learned" button, before footnotes/sources) — see
			// settleCourseStatusBox(). Compact "Lesson N of M" status is
			// always visible; the Builds-on / Next-up / Unlocks detail lives
			// in a panel that opens on tap. Idempotent: the box is created
			// once and only its content/classes are swapped after.
			const legacyPill = document.getElementById('topic-deps-pill');
			if (legacyPill) legacyPill.remove();

			const showStatus = inCourse || deps.length > 0 || unlocks.length > 0;
			if (!showStatus) {
				const oldBox = document.getElementById('course-status-box');
				if (oldBox) oldBox.remove();
			} else {
				let box = document.getElementById('course-status-box');
				if (!box) {
					box = document.createElement('div');
					box.id = 'course-status-box';
					box.className = 'csb';

					const toggle = document.createElement('button');
					toggle.type = 'button';
					toggle.id = 'csb-toggle';
					toggle.className = 'csb-toggle';
					toggle.setAttribute('aria-expanded', 'false');
					toggle.innerHTML =
						'<span class="csb-dot" aria-hidden="true"></span>'
						+ '<span class="csb-label"></span>'
						+ '<span class="csb-bar" aria-hidden="true"><span class="csb-bar-fill"></span></span>'
						+ '<span class="csb-caret" aria-hidden="true">▾</span>';

					const panel = document.createElement('div');
					panel.id = 'csb-panel';
					panel.className = 'csb-panel';
					panel.setAttribute('role', 'region');
					panel.setAttribute('aria-label', 'Course progress and prerequisites');

					box.appendChild(toggle);
					box.appendChild(panel);

					toggle.addEventListener('click', function () {
						const open = box.classList.toggle('is-open');
						toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
					});
					// Tap a prerequisite chip's ✓ to mark it learned (was on the pill).
					box.addEventListener('click', function (e) {
						const mark = (e.target && e.target.closest) ? e.target.closest('.tdp-mark') : null;
						if (!mark) return;
						const d = mark.getAttribute('data-mark-dep');
						if (!d || isLearned(d)) return;
						toggleLearned(d);   // → fireChange → applyVisibility (re-reveals gated blocks)
						showLearnedUI();   // refresh the box + button
					});

					// In-flow, at the END of the reading column (not a floating
					// body overlay) so it can never cover the TOC or plots.
					// Attach first (a detached node can't be settled), then pin
					// it before footnotes/sources / after the learned button.
					contents.appendChild(box);
					settleCourseStatusBox();
				}

				const toggle = box.querySelector('#csb-toggle');
				const panel = box.querySelector('#csb-panel');

				const pct = (inCourse && total > 0) ? Math.round((done / total) * 100) : 0;
				const dotState = (isSpine && deps.length > 0)
					? (met ? 'met' : 'unmet')
					: (inCourse ? 'progress' : 'none');
				toggle.querySelector('.csb-dot').className = 'csb-dot csb-dot-' + dotState;
				toggle.querySelector('.csb-label').textContent =
					inCourse ? ('Lesson ' + (pos + 1) + ' of ' + total) : 'Course';
				toggle.querySelector('.csb-bar').style.display = inCourse ? '' : 'none';
				toggle.querySelector('.csb-bar-fill').style.width = pct + '%';

				let phtml = '';
				if (inCourse) {
					phtml += next
						? '<div class="csb-line csb-line-next"><span class="csb-ico" aria-hidden="true">▸</span><span class="csb-txt">Next up: <a class="tdp-chip" href="' + escAttr(next.url) + '">' + escAttr(next.title) + '</a></span></div>'
						: '<div class="csb-line csb-line-next"><span class="csb-ico" aria-hidden="true">✓</span><span class="csb-txt">You&rsquo;re at the end of the course.</span></div>';
				}
				if (isSpine && deps.length > 0) {
					phtml += met
						? '<div class="csb-line csb-line-met"><span class="csb-ico" aria-hidden="true">✓</span><span class="csb-txt">Prerequisites covered: ' + depChips(lessonId) + ' — the full depth here is unlocked.</span></div>'
						: '<div class="csb-line csb-line-unmet"><span class="csb-ico" aria-hidden="true">' + (nMet > 0 ? '\u25D0' : '\u25CB') + '</span><span class="csb-txt">Builds on ' + depChips(lessonId) + ' — tap the <b>✓</b> next to each to unlock the full depth.</span></div>';
				}
				if (isSpine && unlocks.length > 0) {
					phtml += '<div class="csb-line csb-line-unlocks"><span class="csb-ico" aria-hidden="true">↳</span><span class="csb-txt">'
						+ (isLearned(lessonId) ? 'You&rsquo;ve unlocked ' : 'Once marked learned, this unlocks ')
						+ unlocks.map(lessonLink).join(' ') + '.</span></div>';
				}
				panel.innerHTML = phtml;

				const hasDetail = phtml.trim().length > 0;
				toggle.classList.toggle('csb-has-detail', hasDetail);
				toggle.querySelector('.csb-caret').style.display = hasDetail ? '' : 'none';
			}

			// "Mark as learned" button (bottom of content). Created once and
			// kept at the end of the lesson body — before footnotes/sources —
			// by settleLearnedButton(). We only update its label/state here,
			// so a click never moves it (no scroll jump).
			const learned = isLearned(lessonId);
			let btn = document.getElementById('topic-learned-btn');
			if (!btn) {
				btn = document.createElement('button');
				btn.type = 'button';
				btn.id = 'topic-learned-btn';
				btn.addEventListener('click', function () {
					toggleLearned(lessonId);
					showLearnedUI();
				});
				contents.appendChild(btn);   // attach it; getElementById can't find a detached node
				settleLearnedButton();        // then keep it before footnotes/sources, if any
			}
			btn.className = 'topic-learned-btn' + (learned ? ' topic-learned-active' : '');
			btn.innerHTML = learned
				? '<span aria-hidden="true">✓</span> Marked as learned <span class="tlb-hint">(click to undo)</span>'
				: '<span aria-hidden="true">○</span> Mark this lesson as learned';

			// Re-assert the end-of-article order (learned button → course
			// status box → footnotes/sources) now that both elements exist.
			// No-op once settled, so this never causes a scroll jump.
			settleCourseStatusBox();
		} catch (e) {
			if (DEBUG) dlog('showLearnedUI error:', e);
		}
	}

	function writePref(pref) {
		const v = encodeURIComponent(JSON.stringify(pref));
		try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode */ }
		// The cookie is a cross-page fallback, but browsers cap it near
		// 4 KB. `learned` grows as the reader marks lessons, so only write
		// the cookie while the payload fits comfortably — localStorage always
		// holds the full state either way.
		if (v.length < 3900) {
			document.cookie = COOKIE_NAME + '=' + v
				+ '; path=/; max-age=' + COOKIE_MAX_AGE + '; SameSite=Lax';
		}
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
		//    tucked — UNLESS the reader has already learned all
		//    prerequisites of the current lesson (depsMet bypasses it).
		const lessonId = getLessonId();
		const depsOK = lessonId ? depsMet(lessonId) : false;
		if (mathReq !== null && !depsOK && getMathLevel() < mathReq) {
			state = 'off';
			reason = 'needs ' + mathLevelLabel(mathReq) + ' math (you are at ' + mathLevelLabel(getMathLevel()) + ')';
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
		// First-time visitor (nothing saved yet): gently invite them to
		// set their level. The pulse + hint drop away the moment they
		// make any choice, so it never nags returning readers.
		const firstVisit = !readRawPref();
		if (firstVisit) {
			btn.classList.add('topics-toggle-attention');
			btn.title = 'New here? Shape the course to you — math, interests, depth. 10 seconds, saved on this device.';
		} else {
			btn.classList.remove('topics-toggle-attention');
			btn.title = 'Choose your interests';
		}
		const map = normalize(activeMap());
		const active = Object.values(map).filter(Boolean).length;
		const total  = TOPICS.length;
		btn.setAttribute(
			'aria-label',
			(firstVisit ? 'New here — choose your interests, ' : 'Choose your interests — ')
				+ active + ' of ' + total + ' active'
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
					<span class="topics-math-label">∑ Math comfort</span>
					<div class="topics-math-control">
						<input type="range" class="topics-math-range" min="${MATH_MIN}" max="${MATH_MAX}" step="25" value="${snapMath(getMathLevel())}" aria-label="Math comfort level">
						<span class="topics-math-val">${mathLevelLabel(getMathLevel())}</span>
					</div>
					<div class="math-comfort-ticks">
						${MATH_LEVELS.map(function (l) { return '<span>' + escAttr(l.label) + '</span>'; }).join('')}
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
				if (oVal) oVal.textContent = v + '%';
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

	/** Add the gradient-fade + reveal pill to a collapsed block.
	    Content stays visible (faded); a small badge shows the gate reason. */
	function setBanner(block, spec, score) {
		score = score || {};
		const old = block.querySelector(':scope > .topic-block-fade-badge');
		if (old) old.remove();
		const badge = document.createElement('button');
		badge.type = 'button';
		badge.className = 'topic-block-fade-badge';
		badge.setAttribute('aria-label', 'Reveal this section');
		const icon = score.why === 'math' ? '∫' : (score.why === 'category' ? '✦' : '◈');
		const label = score.why === 'math'
			? score.reason || ''
			: (score.reason || 'outside your interests');
		// Section title: prefer the author's data-optionaltitle, else the first
		// heading inside the block (available once Markdown has rendered).
		let title = block.getAttribute('data-optionaltitle') || '';
		if (!title) {
			const h = block.querySelector('h1,h2,h3,h4,h5,h6');
			if (h) title = (h.textContent || '').replace(/\s+/g, ' ').trim();
		}
		badge.innerHTML =
			'<span class="tbf-icon" aria-hidden="true">' + escAttr(icon) + '</span>'
			+ (title ? '<span class="tbf-title">' + escAttr(title) + '</span>' : '')
			+ '<span class="tbf-text">' + escAttr(label) + '</span>'
			+ '<span class="tbf-action">tap to reveal ↓</span>';
		badge.addEventListener('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			block._tbUserRevealed = true; // reader chose to see it → keep it revealed
			revealBlock(block, true);
		});
		block.appendChild(badge);
		return badge;
	}

	function ensureInner(block) {
		let inner = block.querySelector(':scope > .topic-block-inner');
		if (inner) return inner;
		inner = document.createElement('div');
		inner.className = 'topic-block-inner';
		const moveable = Array.from(block.children).filter(function (el) {
			return !el.classList.contains('topic-block-fade-badge')
				&& !el.classList.contains('topic-block-alt-reveal')
				&& !el.classList.contains('topic-partial-chip')
				&& !el.classList.contains('topic-block-alt');
		});
		moveable.forEach(function (el) { inner.appendChild(el); });
		block.appendChild(inner);
		return inner;
	}

	/** read everything a managed block tells us about itself.
	    `label` is the banner title: the explicit `data-optionaltitle` if
	    present, otherwise the first H1–H6 heading inside the block (after
	    Markdown has rendered). A math-gated block always collapses when off;
	    `label` just makes the banner read like the section rather than bare
	    "needs … math". `hasHeading` is used by the authoring guardrail. */
	function blockSpec(block) {
		const topicIds = readTopicAttr(block);
		const tags = (block.getAttribute('data-tags') || '').split(',')
			.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
		const scoreIds = topicIds.concat(tags);
		const mathReq = block.getAttribute('data-mathlevel') || block.getAttribute('data-math-level');
		const title = block.getAttribute('data-optionaltitle') || '';
		let derived = '';
		if (!title) {
			const h = block.querySelector('h1, h2, h3, h4, h5, h6');
			if (h) derived = (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
		}
		return {
			topicIds: topicIds,
			scoreIds: scoreIds,
			mathReq: mathReq,
			title: title,
			label: title || derived,
			hasHeading: !!derived
		};
	}

	/** True when a block wraps a real interactive / plot / media widget that
	    does NOT tolerate a hard 120px clip: clipping hides a tall plot and can
	    let an oversized / absolutely-positioned child break the layout below
	    (the math_iii HoTT plots). Such blocks dim (fade) instead of collapsing,
	    so their layout — and the JS that draws the plot — keeps working.

	    Small static previews do NOT count: math_ii's 180px pixelated 3×3
	    tensor previews must still get the full collapse + "tap to reveal". A
	    canvas only counts as a plot when it is large (a real plot), not a tiny
	    bitmap preview. */
	function isFragile(block) {
		if (!block.querySelector) return false;
		// Explicit interactive / plot / media markers always count.
		if (block.querySelector('iframe, video, audio, embed, object, [data-interactive], .hott-plot, .hott-canvas, .interactive, .widget')) {
			return true;
		}
		// A canvas counts only if it is a large plot, not a tiny preview.
		const canvases = block.querySelectorAll('canvas');
		for (let i = 0; i < canvases.length; i++) {
			const c = canvases[i];
			const bw = parseInt(c.getAttribute('width'), 10) || 0;
			const bh = parseInt(c.getAttribute('height'), 10) || 0;
			const w = c.offsetWidth || bw;
			const h = c.offsetHeight || bh;
			if (w > 320 || h > 240) return true;
		}
		return false;
	}

	/** collapse a block: content stays visible but gets a gradient fade
	    via CSS class. A small badge appears at the bottom and the block is
	    clipped to TUCK_H (eased when `animate`). */
	function collapseBlock(block, spec, score, animate) {
		const chip = block.querySelector(':scope > .topic-partial-chip');
		if (chip) chip.remove();
		ensureInner(block);
		block.classList.remove('topic-block-revealed');
		block.classList.remove('topic-block-partial');
		block.classList.remove('topic-block--clipped');
		block.classList.add('topic-block-collapsed');
		setBanner(block, spec, score);
		if (animate && !prefersReducedMotion()) {
			const fromH = block.getBoundingClientRect().height || block.scrollHeight;
			animateClip(block, fromH, TUCK_H, true);
		} else {
			block.classList.add('topic-block--clipped');
		}
	}

	/** small "show the full math" affordance shown while a block is in
	    its plain-language alternative mode. Clicking reveals the math. */
	function setAltReveal(block, spec, score) {
		const old = block.querySelector(':scope > .topic-block-alt-reveal');
		if (old) old.remove();
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'topic-block-alt-reveal';
		btn.setAttribute('aria-label', 'Show the full math');
		btn.innerHTML = '<span class="tbalt-icon" aria-hidden="true">∫</span>'
			+ '<span class="tbalt-text">Show the full math</span>';
		btn.addEventListener('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			block._tbUserRevealed = true;
			revealBlock(block, true);
		});
		block.appendChild(btn);
		return btn;
	}

	const TUCK_H = 168; // must match `.topic-block--clipped` max-height

	/** Smoothly animate a block's clip between `fromH` and `toH` by easing
	    its max-height. `isCollapse` keeps the rest-state clip class on the
	    tucked end and drops it on the expanded end. Falls back to an instant
	    jump on any failure or under reduced-motion. */
	function animateClip(block, fromH, toH, isCollapse) {
		try {
			block.style.overflow = 'hidden';
			block.style.maxHeight = fromH + 'px';
			void block.offsetHeight; // commit the start height before easing
			block.style.transition = 'max-height 240ms cubic-bezier(0.22, 0.61, 0.36, 1)';
			block.style.maxHeight = toH + 'px';
			let done = false;
			const finish = function () {
				if (done) return;
				done = true;
				block.style.transition = '';
				block.style.overflow = '';
				block.style.maxHeight = '';
				block.removeEventListener('transitionend', handler);
				if (isCollapse) block.classList.add('topic-block--clipped');
				else block.classList.remove('topic-block--clipped');
			};
			const handler = function (e) {
				if (e.target === block && e.propertyName === 'max-height') finish();
			};
			block.addEventListener('transitionend', handler);
			setTimeout(finish, 420); // safety net if transitionend is missed
		} catch (e) {
			block.style.maxHeight = ''; block.style.overflow = ''; block.style.transition = '';
			if (isCollapse) block.classList.add('topic-block--clipped');
			else block.classList.remove('topic-block--clipped');
		}
	}

	/** expand (reveal) a block: remove the fade + badge + alt mode, then
	    ease the clip open (or jump instantly when not animating). */
	function clearClipInline(block) {
		block.style.overflow = '';
		block.style.maxHeight = '';
		block.style.transition = '';
	}

	function revealBlock(block, animate) {
		// Idempotent: a double-trigger (per-badge handler + the document
		// delegation fallback both firing) must not re-run the animation.
		if (block.classList.contains('topic-block-revealed')) {
			block.classList.remove('topic-block--clipped');
			clearClipInline(block);
			syncDemoTucking(block);
			if (block._tbUserRevealed === true) ensureRecollapse(block);
			return;
		}
		const badge = block.querySelector(':scope > .topic-block-fade-badge');
		if (badge) badge.remove();
		const altRev = block.querySelector(':scope > .topic-block-alt-reveal');
		if (altRev) altRev.remove();
		block.classList.remove('topic-block-collapsed');
		block.classList.remove('topic-block-alt-active');
		block.classList.add('topic-block-revealed');
		const fullH = block.scrollHeight || block.offsetHeight || 0;
		const canAnimate = animate && !prefersReducedMotion() && fullH > TUCK_H;
		if (canAnimate) {
			animateClip(block, TUCK_H, fullH, false);
			// Hard guarantee: a reveal must never leave the block stuck
			// clipped — if the transitionend is missed (or the clip's
			// `overflow:hidden !important` wins the fight), force the unclip.
			setTimeout(function () {
				if (block.classList.contains('topic-block--clipped')) {
					block.classList.remove('topic-block--clipped');
					clearClipInline(block);
				}
			}, 520);
		} else {
			block.classList.remove('topic-block--clipped');
			clearClipInline(block);
		}
		syncDemoTucking(block);
		if (block._tbUserRevealed === true) ensureRecollapse(block);
	}

	function reapplyBlock(block) {
		if (block._tbScore && block._tbSpec) {
			applyBlockState(block, block._tbSpec, block._tbScore, true);
		}
	}

	/** A section the reader pried open (still gated) stays open only while they
	    want it. This fold-away control lets them tuck it back without touching
	    the math dial. It is placed in-flow at the END OF THE SECTION — after
	    the demos that follow the block, right before the next heading / managed
	    block — because "the section" is the block plus its trailing demos, not
	    just the block's div. The delegation-free per-button handler is enough
	    here (no competing document-level handler targets this class). */
	function ensureRecollapse(block) {
		try {
			let btn = findRecollapse(block);
			if (!btn) {
				btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'topic-block-recollapse';
				btn.setAttribute('aria-label', 'Fold this section away');
				btn.textContent = '\u25B2 \u00A0Fold this section away';
				btn.addEventListener('click', function (e) {
					e.stopPropagation();
					block._tbUserRevealed = false;
					block._tbState = 'off';
					reapplyBlock(block);
					// Re-tucking this block may have created a new run of
					// consecutive tucked sections → regroup behind one badge.
					rebuildGroupBadges();
				});
			}
			const parent = block.parentNode;
			if (!parent) return btn;
			const boundary = sectionEndBefore(block);
			if (boundary && boundary !== btn) {
				// insertBefore on an already-correct node is a no-op (no
				// reflow, no scroll jump); it also migrates a stale copy
				// that is still a child of the block.
				parent.insertBefore(btn, boundary);
			} else if (parent.lastElementChild !== btn) {
				parent.appendChild(btn);
			}
			return btn;
		} catch (e) {
			if (DEBUG) derr('ensureRecollapse:', e);
			return null;
		}
	}
	/** Locate the recollapse button for `block` at EITHER of its possible
	    home positions: a (stale) direct child of the block, or the in-flow
	    sibling at the section end (after the block's trailing demos). */
	function findRecollapse(block) {
		if (!block) return null;
		try {
			if (block.querySelector) {
				const asChild = block.querySelector(':scope > .topic-block-recollapse');
				if (asChild) return asChild;
			}
			let sib = block.nextElementSibling;
			while (sib) {
				if (sib.classList && sib.classList.contains('topic-block-recollapse')) return sib;
				if (sib.tagName === 'SECTION') break;
				if (sib.id && TB_NO_TUCK_IDS[sib.id]) break;
				if (sib.matches && sib.matches('[data-mathlevel], [data-math-level], [data-optionaltitle], [data-topic]')) break;
				if (sib.matches && sib.matches('h1,h2,h3,h4,h5,h6')) break;
				sib = sib.nextElementSibling;
			}
		} catch (e) {
			if (DEBUG) derr('findRecollapse:', e);
		}
		return null;
	}
	function removeRecollapse(block) {
		try {
			const btn = findRecollapse(block);
			if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
		} catch (e) {
			if (DEBUG) derr('removeRecollapse:', e);
		}
	}

	/* ── Grouped reveal badge ────────────────────────────────────
	   Several sections tucked in a row used to show a "tap to reveal"
	   badge per section, forcing N taps. One grouped badge at the START
	   of the run (right where the folded region begins) reveals the whole
	   run at once and LISTS EVERY SECTION HEADING it covers, so the reader
	   sees the bar immediately and knows exactly what a single tap opens.
	   Rebuilt from scratch on every applyVisibility pass (a single cheap
	   DOM walk), so it can never desync from block states. Runs of one
	   block keep the ordinary per-block badge. */

	/** Elements that do not visually separate two tucked sections:
	    script/style/template (not rendered) and tucked demos (display:none). */
	function isTuckTransparent(el) {
		if (!el || !el.tagName) return false;
		if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEMPLATE') return true;
		if (el.classList && el.classList.contains('topic-demo-tucked')) return true;
		return false;
	}

	function isTuckedBlock(el) {
		return !!(el && el.classList
			&& el.classList.contains('topic-block')
			&& el.classList.contains('topic-block-collapsed'));
	}

	/** The next tucked block that continues the run started by `block`, or
	    null the moment any VISIBLE content separates them. A bare heading or
	    a plain (unmanaged) prose div between two tucked blocks is visible
	    content → the sections are no longer "directly in a row". */
	function nextTuckedInRun(block) {
		let sib = block ? block.nextElementSibling : null;
		while (sib) {
			if (isTuckTransparent(sib)) { sib = sib.nextElementSibling; continue; }
			if (isTuckedBlock(sib)) return sib;
			return null;
		}
		return null;
	}

	/** Best-effort title for a tucked block: the author's data-optionaltitle,
	    else the first heading inside (post-Markdown), else empty. */
	function tuckedTitle(block) {
		try {
			let t = block.getAttribute ? (block.getAttribute('data-optionaltitle') || '') : '';
			if (!t && block.querySelector) {
				const h = block.querySelector('h1,h2,h3,h4,h5,h6');
				if (h) t = (h.textContent || '').replace(/\s+/g, ' ').trim();
			}
			return (t || '').slice(0, 80);
		} catch (e) {
			return '';
		}
	}

	/** One grouped badge standing in for `run` (an array of ≥2 consecutive
	    tucked blocks). Placed in-flow at the end of the run — after the last
	    member's trailing demos, before the next heading/section boundary. */
	function placeGroupBadge(run) {
		const first = run[0];
		const parent = first && first.parentNode;
		if (!parent) return null;
		const badge = document.createElement('button');
		badge.type = 'button';
		badge.className = 'topic-block-fade-badge topic-block-group-badge';
		badge.setAttribute('aria-label', 'Reveal all tucked sections in this group');
		badge._groupMembers = run.slice();
		const titles = run.map(tuckedTitle).filter(Boolean);
		const n = run.length;
		const anyMath = run.some(function (b) { return b._tbWhy === 'math'; });
		badge.innerHTML =
			'<span class="tbf-icon" aria-hidden="true">' + (anyMath ? '\u222B' : '\u2726') + '</span>'
			+ '<span class="tbf-title">' + n + (n === 1 ? ' section' : ' sections') + ' tucked away</span>'
			+ (titles.length
				? '<span class="tbf-group-titles">'
					+ titles.map(function (t) {
						return '<span class="tbf-group-title">' + escAttr(t) + '</span>';
					}).join('<span class="tbf-group-sep" aria-hidden="true">\u00B7</span>')
					+ '</span>'
				: '')
			+ '<span class="tbf-action">tap to reveal all \u2193</span>';
		badge.addEventListener('click', function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
			revealGroupBadge(badge);
		});
		parent.insertBefore(badge, first);
		if (DEBUG) dlog('group badge placed at run start for ' + n + ' sections:',
			titles.length ? titles.join(' / ') : '(no titles found)');
		return badge;
	}

	/** Reveal every block of a group at once and remove the badge.
	    Idempotent per member (revealBlock guards on topic-block-revealed);
	    the badge is detached before revealing so a stale re-dispatch can
	    never double-run. */
	function revealGroupBadge(badge) {
		let revealed = 0, failed = 0;
		try {
			const members = (badge && badge._groupMembers) ? badge._groupMembers.slice() : [];
			if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
			// Per-member isolation: one failing member must not strand the
			// rest — every reveal is attempted independently.
			members.forEach(function (b) {
				try {
					if (!b || !b.classList) { failed++; return; }
					if (b.classList.contains('topic-block-revealed')) return;
					b._tbUserRevealed = true; // reader chose to see it → keep it revealed
					revealBlock(b, true);
					revealed++;
				} catch (mb) {
					failed++;
					if (DEBUG) derr('revealGroupBadge member failed:', mb);
				}
			});
			if (DEBUG) dlog('group badge: revealed ' + revealed + ' of ' + members.length
				+ (failed ? ' (' + failed + ' FAILED)' : '') + ' sections');
		} catch (e) {
			failed++;
			if (DEBUG) derr('revealGroupBadge:', e);
		}
		// Safety net — ALWAYS runs (outside the try): if any member refused
		// to reveal (state drift, exception), a fresh rebuild re-badges the
		// remainder (group or solo) instead of leaving it unreachable.
		try { rebuildGroupBadges(); } catch (e) {
			if (DEBUG) derr('revealGroupBadge rebuild:', e);
		}
	}

	/** Reveal every tucked section that contains `el`. Anchor links (TOC
	    entries, footnote/source jumps, in-text references) must never land
	    on hidden content: the reader navigated to a specific spot, so each
	    covering section is unfolded and STAYS unfolded (with its fold-away
	    button) until they fold it again. Returns the number of sections
	    unfolded, so callers can delay their scroll until the clip animation
	    has settled (~240 ms). */
	function revealAncestorsOf(el) {
		let revealed = 0;
		try {
			let node = (el && el.closest) ? el.closest('.topic-block') : null;
			while (node) {
				if (node.classList.contains('topic-block-collapsed')
						&& !node.classList.contains('topic-block-revealed')) {
					node._tbUserRevealed = true;
					revealBlock(node, true);
					revealed++;
				}
				node = node.parentElement ? node.parentElement.closest('.topic-block') : null;
			}
			if (revealed) {
				// A revealed member may have broken up a grouped run —
				// rebuild so the remaining run keeps one correct badge.
				try { rebuildGroupBadges(); } catch (e) {
					if (DEBUG) derr('revealAncestorsOf rebuild:', e);
				}
			}
		} catch (e) {
			if (DEBUG) derr('revealAncestorsOf:', e);
		}
		return revealed;
	}

	/** Rebuild ALL grouped badges from the current block states. Safe to
	    call any time; a no-op when fewer than two tucked sections are
	    consecutive. Member badges are only removed from blocks that end up
	    in a run of ≥2, so single tucked sections keep their own badge. */
	let _gVisTok = 0, _gGrpTok = 0; // per-pass element markers (object-key
	// collision guard: plain {} keyed by element objects would alias every
	// element to "[object Object]")
	function rebuildGroupBadges() {
		try {
			document.querySelectorAll('.topic-block-group-badge').forEach(function (g) {
				if (g.parentNode) g.parentNode.removeChild(g);
			});
			const collapsed = Array.prototype.slice.call(
				document.querySelectorAll('.topic-block.topic-block-collapsed'));
			const vTok = ++_gVisTok, gTok = ++_gGrpTok;
			const isVisited = function (n) { return n.__gvis === vTok; };
			const markVisited = function (n) { n.__gvis = vTok; };
			const inGroup = function (n) { return n.__ggrp === gTok; };
			const markGroup = function (n) { n.__ggrp = gTok; };
			let groups = 0;
			if (collapsed.length >= 2) {
				collapsed.forEach(function (first) {
					if (isVisited(first)) return;
					markVisited(first);
					const run = [first];
					let nxt = nextTuckedInRun(first);
					while (nxt) {
						if (isVisited(nxt)) break; // already absorbed (defensive)
						markVisited(nxt);
						run.push(nxt);
						nxt = nextTuckedInRun(nxt);
					}
					if (run.length < 2) return; // single section → its own badge
					run.forEach(function (b) {
						markGroup(b);
						const badge = b.querySelector ? b.querySelector(':scope > .topic-block-fade-badge') : null;
						if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
					});
					if (placeGroupBadge(run)) groups++;
				});
			}
			// Self-heal: every collapsed block that is NOT inside a grouped
			// run must carry its own reveal badge. Guards against state drift
			// and against a failed group reveal leaving a section unreachable
			// (badge removed for the group, but the block still collapsed).
			collapsed.forEach(function (b) {
				if (inGroup(b)) return;
				const hasBadge = b.querySelector ? !!b.querySelector(':scope > .topic-block-fade-badge') : true;
				if (hasBadge) return;
				try {
					const spec = b._tbSpec || blockSpec(b);
					const score = b._tbScore || { state: 'off', why: b._tbWhy || 'category', reason: b._tbReason || 'tucked away' };
					setBanner(b, spec, score);
					if (DEBUG) dlog('self-healed missing reveal badge:', (spec && spec.label) || b.tagName);
				} catch (he) {
					if (DEBUG) derr('self-heal badge failed:', he);
				}
			});
			if (DEBUG && groups) dlog('rebuildGroupBadges: ' + groups + ' grouped run(s)');
			return groups;
		} catch (e) {
			if (DEBUG) derr('rebuildGroupBadges:', e);
			return 0;
		}
	}

	/** Fallback reveal path. Some pages carry document/body click handlers
	    (lightbox, provenance, bindIframeSafeLinks) and per-badge handlers can
	    get desynced from the live badge element; a delegated bubble handler on
	    document always fires when a `.topic-block-fade-badge` is actually
	    clicked, so "tap to reveal" can never be a dead button. */
	function ensureBadgeDelegation() {
		if (document.__tbBadgeDeleg) return;
		document.__tbBadgeDeleg = true;
		document.addEventListener('click', function (ev) {
			const t = ev.target;
			if (!t || !t.closest) return;
			const badge = t.closest('.topic-block-fade-badge');
			if (!badge) return;
			// Grouped badges carry the same base class for styling but cover
			// MANY blocks and sit OUTSIDE any of them — their own handler
			// (revealGroupBadge) is the only valid path.
			if (badge.classList.contains('topic-block-group-badge')) return;
			const block = badge.closest('.topic-block') || badge.parentElement;
			if (!block || !block.classList.contains('topic-block-collapsed')) return;
			block._tbUserRevealed = true;
			revealBlock(block, true);
		}, false);
	}

	/** Hide the demo/plot containers that follow a collapsed block, up to (not
	    including) the next heading or the next managed block. A math section's
	    interactive widgets (vector plots, matrix canvases, …) sit in their own
	    un-gated divs right after the gated prose; when the prose is masked the
	    widgets should recede with it instead of floating out on their own. */
	// Page furniture the tuck must stop before. Footnotes and the source
	// bibliography are appended as trailing <section> elements; masking them
	// is a hard no (the reader's citation trail must never disappear), so we
	// stop at any <section> and at these ids regardless of what else follows.
	const TB_NO_TUCK_IDS = {
		'footnotes': 1, 'sources': 1, 'footnotes-section': 1, 'sources-section': 1,
		'contents': 1, 'loader': 1, 'toc': 1, 'course-status': 1,
		'course-status-box': 1, 'topic-learned-btn': 1, 'sidenotes-rail': 1,
		'curiosity-score': 1
	};

	/** The element that ends `block`'s SECTION: the next page-furniture id,
	    <section>, managed block, or bare heading — exactly the same boundary
	    rules tuckFollowingDemos() walks with, so "end of section" always
	    means "where the demos stop". Returns null when the section runs to
	    the end of the parent. Used to place controls (recollapse button,
	    grouped reveal badge) at the true end of a section rather than at the
	    end of the block's own div — which, when demos follow, is mid-section. */
	function sectionEndBefore(block) {
		if (!block || !block.nextElementSibling) return null;
		let sib = block.nextElementSibling;
		while (sib) {
			if (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE' || sib.tagName === 'TEMPLATE') {
				sib = sib.nextElementSibling; continue;
			}
			if (sib.tagName === 'SECTION') return sib;
			if (sib.id && TB_NO_TUCK_IDS[sib.id]) return sib;
			if (sib.matches && sib.matches('[data-mathlevel], [data-math-level], [data-optionaltitle], [data-topic]')) return sib;
			if (sib.matches && sib.matches('h1,h2,h3,h4,h5,h6')) return sib;
			sib = sib.nextElementSibling;
		}
		return null;
	}

	function tuckFollowingDemos(block) {
		const hidden = [];
		let sib = block.nextElementSibling;
		while (sib) {
			// Hard stops: page furniture / structural sections (never tuck).
			if (sib.tagName === 'SECTION') break;
			if (sib.id && TB_NO_TUCK_IDS[sib.id]) break;
			// A new section: a gated / titled managed block. Match the data-*
			// attributes (present in the source) rather than the .topic-block
			// class, so this is reliable even before applyVisibility has tagged
			// the block. Plain (ungated) .md prose and .optional boxes that sit
			// between the demos belong to the current section and tuck with it —
			// only a gated block starts a new section.
			if (sib.matches && sib.matches('[data-mathlevel], [data-math-level], [data-optionaltitle], [data-topic]')) break;
			// A bare heading that starts a new section.
			if (sib.matches && sib.matches('h1,h2,h3,h4,h5,h6')) break;
			// Skip non-rendered nodes without tucking them.
			if (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE' || sib.tagName === 'TEMPLATE') {
				sib = sib.nextElementSibling; continue;
			}
			if (sib.classList) {
				sib.classList.add('topic-demo-tucked');
				hidden.push(sib);
			}
			sib = sib.nextElementSibling;
		}
		return hidden;
	}

	function untuckDemos(demos) {
		(demos || []).forEach(function (d) { d.classList.remove('topic-demo-tucked'); });
		// No global resize here: Plotly.resize() throws on a plot div that is
		// still display:none (a still-tucked or not-yet-inited demo). The
		// demos' own lazyInit IntersectionObserver re-renders them the moment
		// they are unhidden and scrolled into view, so a forced resize is both
		// unnecessary and the source of the "Resize must be passed a displayed
		// plot div" promise errors.
	}

	function syncDemoTucking(block) {
		const wasTucked = !!(block._tbTuckedDemos && block._tbTuckedDemos.length);
		const shouldTuck = block.classList.contains('topic-block-collapsed') && block._tbWhy === 'math';
		if (shouldTuck) {
			block._tbTuckedDemos = tuckFollowingDemos(block);
		} else {
			untuckDemos(block._tbTuckedDemos);
			block._tbTuckedDemos = null;
		}
		return shouldTuck || wasTucked;
	}

	/** Fill in the section title on badges that were created before Markdown
	    rendered (blocks without a data-optionaltitle). Idempotent. */
	function refreshBadgeTitles() {
		document.querySelectorAll('.topic-block.topic-block-collapsed .topic-block-fade-badge').forEach(function (badge) {
			if (badge.querySelector('.tbf-title')) return;
			const block = badge.parentElement;
			let title = block.getAttribute('data-optionaltitle') || '';
			if (!title) {
				const h = block.querySelector('h1,h2,h3,h4,h5,h6');
				if (h) title = (h.textContent || '').replace(/\s+/g, ' ').trim();
			}
			if (!title) return;
			const span = document.createElement('span');
			span.className = 'tbf-title';
			span.textContent = title;
			const icon = badge.querySelector('.tbf-icon');
			if (icon) badge.insertBefore(span, icon.nextSibling);
			else badge.insertBefore(span, badge.firstChild);
		});
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
		if (block._tbBusy) { block._tbDirty = true; block._tbScore = score; block._tbSpec = spec; block._tbWhy = score.why; return; }
		block._tbScore = score;
		block._tbSpec = spec;
		block._tbWhy = score.why;
		const wasCollapsed = block.classList.contains('topic-block-collapsed');
		const nowOff = score.state === 'off';
		// A math-gated block always collapses when its math is off (strong
		// "masking"), so it no longer depends on having an explicit title.
		// Titled blocks (or blocks with a first heading) collapse for any
		// reason; untitled non-math blocks only dim, as before.
		// EXCEPTION: blocks wrapping interactive / plot / media content
		// (`isFragile`) are never hard-clipped — clipping breaks their layout
		// (math_iii's canvases). They dim instead, staying fully functional.
		const fragile = isFragile(block);
		const collapsible = !fragile && (!!spec.label || score.why === 'math');
		const alt = block.querySelector(':scope > .topic-block-alt');

		// A block the reader manually revealed stays revealed for the whole
		// session — a later re-score (slider tick, Markdown re-render,
		// optional-block pass) must not tuck it back. This wins over the
		// math-alternative path too, so "show the full math" sticks.
		if (nowOff && block._tbUserRevealed === true) {
			block.classList.remove('topic-block-collapsed');
			block.classList.remove('topic-block--clipped');
			block.classList.remove('topic-block-dimmed');
			block.classList.remove('topic-block-alt-active');
			block.classList.add('topic-block-revealed');
			block._tbReason = 'user-revealed';
			syncDemoTucking(block);
			ensureRecollapse(block);
			return;
		}

		// Math alternative: the block is too math-heavy for the reader and
		// the author supplied a plain-language twin. Show the twin instead
		// of fading the math (a "show the math" link keeps it reachable).
		if (nowOff && score.why === 'math' && alt) {
			ensureInner(block);
			block.classList.remove('topic-block-collapsed');
			block.classList.remove('topic-block-dimmed');
			block.classList.remove('topic-block-partial');
			block.classList.add('topic-block-alt-active');
			setAltReveal(block, spec, score);
			block._tbReason = 'alt';
			syncDemoTucking(block);
			removeRecollapse(block);
			return;
		}

		// Not showing the alt → make sure any alt mode is cleared (class
		// plus a stale "show the math" affordance left over from a
		// previous alt-active state).
		if (alt) block.classList.remove('topic-block-alt-active');
		const staleAltReveal = block.querySelector(':scope > .topic-block-alt-reveal');
		if (staleAltReveal) staleAltReveal.remove();

		if (nowOff) {
			if (collapsible) {
				// Titled / headed / math-gated block → full collapse + banner
				if (!wasCollapsed) {
					collapseBlock(block, spec, score, !!animate);
				} else if (block._tbReason !== score.reason) {
					setBanner(block, spec, score);
				}
			} else {
				// No title and not a math gate → just dim, keep content visible
				if (wasCollapsed) revealBlock(block, !!animate);
				block.classList.add('topic-block-dimmed');
			}
			block._tbReason = score.reason;
			syncDemoTucking(block);
			removeRecollapse(block);
			return;
		}
		block.classList.remove('topic-block-dimmed');
		block.classList.remove('topic-block--clipped');
		if (wasCollapsed) revealBlock(block, !!animate);
		block.classList.toggle('topic-block-partial', score.state === 'partial');
		ensurePartialChip(block, score);
		block._tbReason = score.state;
		syncDemoTucking(block);
		removeRecollapse(block);
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
		// Still keep the learned button + course status box at the end of
		// the lesson body in case footnotes/sources were appended after
		// them (this early-return path skips the settle calls at the bottom
		// of the function).
		settleLearnedButton();
		settleCourseStatusBox();
			return;
		}

		const managed = document.querySelectorAll(
			'.topic-block, [data-optionaltitle], [data-mathlevel], [data-math-level], [data-topic]');
		managed.forEach(function (block) {
			if (block.classList.contains('optional')) return; // the manual .optional system owns these
			if (block.classList.contains('course-tile')) {
				// Index tiles carry data-mathlevel too, but they are NOT
				// sections: tucking them would clip them to the 168px
				// section height and cut off their text. Their own path is
				// regroupTuckedTiles() (off tiles move to the per-part
				// "Not shown" box) + dimCourseTiles() (partial match).
				// One-time cleanup of stale tuck state left behind by older
				// versions of this file (clipped box, injected badges):
				block.classList.remove('topic-block-collapsed', 'topic-block--clipped',
					'topic-block-revealed', 'topic-block-dimmed', 'topic-block-partial',
					'topic-block-alt-active');
				clearClipInline(block);
				['.topic-block-fade-badge', '.topic-block-alt-reveal', '.topic-block-recollapse']
					.forEach(function (sel) {
						const stale = block.querySelector(':scope > ' + sel);
						if (stale) stale.remove();
					});
				let sib = block.nextElementSibling; // stale sibling button (up to 2 ahead)
				for (let i = 0; i < 2 && sib; i++, sib = sib.nextElementSibling) {
					if (sib.classList && sib.classList.contains('topic-block-recollapse')) { sib.remove(); break; }
					if (sib.classList && sib.classList.contains('course-tile')) break;
				}
				return;
			}
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

		// Post-render: now that Markdown is live, fill in section titles on
		// badges for blocks that had no data-optionaltitle.
		refreshBadgeTitles();

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

		// Group consecutive tucked sections behind one "reveal all" badge
		// (lists the section headings it covers). Must run AFTER all block
		// states are settled and badge titles are filled in — and BEFORE the
		// end-of-article settle calls, so the learned button / course box
		// re-pin themselves to the very end if a group badge landed there.
		rebuildGroupBadges();
		settleLearnedButton();
		settleCourseStatusBox();
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

	/** open/close one per-part "hidden lessons" box, animating height. */
	function togglePartHidden(group) {
		const clip = group.querySelector('.ta-part-hidden-clip');
		const body = group.querySelector('.ta-part-hidden-body');
		const icon = group.querySelector('.tph-icon');
		if (!clip || !body) return;
		const open = !group.classList.contains('ta-part-hidden-open');
		group.classList.toggle('ta-part-hidden-open', open);
		if (icon) icon.textContent = open ? '\uD83D\uDC35' : '\uD83D\uDE48'; // 🐵 peeking / 🙈 hidden
		if (prefersReducedMotion()) {
			clip.style.height = open ? 'auto' : '0px';
			return;
		}
		if (open) {
			const h = body.scrollHeight;
			clip.style.height = '0px';
			void clip.offsetHeight;
			// open: release to auto afterwards so late content can grow
			animateHeight(clip, 0, h, TUCK_MS, function () { clip.style.height = 'auto'; });
		} else {
			const h = clip.scrollHeight;
			clip.style.height = h + 'px';
			void clip.offsetHeight;
			// close: pin to 0px afterwards (animateHeight's finish releases
			// to auto, which would otherwise snap the box back open).
			animateHeight(clip, h, 0, TUCK_MS, function () { clip.style.height = '0px'; });
		}
	}

	/** short, human "why was this lesson tucked" phrase for a score. */
	function whyPhrase(s) {
		if (!s) return 'they don’t quite match your settings';
		if (s.why === 'math') return 'the math runs deeper than your comfort dial';
		if (s.why === 'layman') return 'they sit beyond the layman core';
		if (s.why === 'interests') return 'they’re outside the interests you picked';
		if (s.why === 'category') return 'you switched off ' + (s.whyLabel || 'some topics');
		return 'they don’t quite match your settings';
	}

	/** friendly one-line summary of a part's tucked lessons, e.g.
	    "the math runs deeper than your comfort dial" or a short
	    "x and y" when several reasons apply. */
	function hiddenReasons(offInfo) {
		if (!offInfo || !offInfo.length) return 'they don’t quite match your settings';
		const reasons = [];
		offInfo.forEach(function (o) {
			const r = whyPhrase(o.score);
			if (reasons.indexOf(r) === -1) reasons.push(r);
		});
		if (reasons.length === 1) return reasons[0];
		if (reasons.length === 2) return reasons[0] + ' and ' + reasons[1];
		return reasons.slice(0, -1).join(', ') + ', and ' + reasons[reasons.length - 1];
	}

	/** rebuild the per-part hidden box body, splitting the tucked lessons
	    into one labelled subgroup per reason (math / interests / tone), so
	    a reader sees exactly *why* each lesson receded. `body` is cleared and
	    repopulated with the tile elements (already back in their grids via
	    restoreAllTiles before this runs). Only non-empty subgroups render. */
	function renderHiddenGroups(body, offInfo) {
		body.textContent = '';
		const GROUPS = [
			{ why: 'math',      label: 'Needs more math comfort', icon: '∫' },
			{ why: 'interests', label: 'Outside your interests',  icon: '✦' }
		];
		const buckets = GROUPS.map(function (g) { return { g: g, list: [] }; });
		const fallback = { label: 'Not quite matching your settings', icon: '…', list: [] };
		offInfo.forEach(function (o) {
			const why = o.score && o.score.why;
			const b = buckets.filter(function (x) { return x.g.why === why; })[0];
			if (b) b.list.push(o); else fallback.list.push(o);
		});
		function addGroup(label, icon, list) {
			const g = document.createElement('div');
			g.className = 'tph-group';
			const lbl = document.createElement('div');
			lbl.className = 'tph-group-label';
			lbl.innerHTML = '<span class="tph-group-icon" aria-hidden="true">' + icon + '</span> '
				+ label + ' <span class="tph-group-num">' + list.length + '</span>';
			const grid = document.createElement('div');
			grid.className = 'tph-group-grid';
			list.forEach(function (o) {
				o.tile.title = 'Tucked away — ' + (o.score.reason || '');
				grid.appendChild(o.tile);
			});
			g.appendChild(lbl);
			g.appendChild(grid);
			body.appendChild(g);
		}
		buckets.forEach(function (b) { if (b.list.length) addGroup(b.g.label, b.g.icon, b.list); });
		if (fallback.list.length) addGroup(fallback.label, fallback.icon, fallback.list);
	}

	/** On the index page, every lesson tile that scores 'off' is moved
	    into a per-part, tap-to-expand "Not shown" box that sits right
	    below that part's grid. The box is collapsed by default (nothing is
	    lost — it just recedes); tapping it reveals the hidden lessons as
	    normal, clickable tiles. */
	function regroupTuckedTiles(animate) {
		if (!isIndexPage()) return;
		try {
			rememberGrids();
			restoreAllTiles();

			document.querySelectorAll('.course-tiles').forEach(function (grid) {
				// Drop any leftover divider from the old in-place scheme.
				const divider = grid.querySelector(':scope > .ta-grid-divider');
				if (divider) divider.remove();

				const part = grid.closest('.course-part') || grid.parentElement;

				const tiles = Array.from(grid.querySelectorAll('.course-tile'));
				const total = tiles.length;
				const offInfo = [];
				tiles.forEach(function (tile) {
					const interests = (tile.getAttribute('data-topics') || '').split(',')
						.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
					const cats = (tile.getAttribute('data-tags') || '').split(',')
						.map(function (s) { return cssSafe(s.trim()); }).filter(Boolean);
					const mathReq = tile.getAttribute('data-mathlevel') || tile.getAttribute('data-math-level');
					const score = scoreUnit(interests.concat(cats), { mathReq: mathReq });
					tile.classList.remove('ta-tile-off');
					if (score.state === 'off') offInfo.push({ tile: tile, score: score });
				});

				let group = part.querySelector(':scope > .ta-part-hidden');
				if (offInfo.length === 0) {
					if (group) group.remove();
					return;
				}

				if (!group) {
					group = document.createElement('div');
					group.className = 'ta-part-hidden';
					const header = document.createElement('button');
					header.type = 'button';
					header.className = 'ta-part-hidden-header';
					header.setAttribute('aria-expanded', 'false');
					header.innerHTML =
						'<span class="tph-caret" aria-hidden="true">▸</span>'
						+ '<span class="tph-icon" aria-hidden="true">\uD83D\uDE48</span>'
						+ '<span class="tph-label">Not shown in this part</span>'
						+ '<span class="tph-count" aria-hidden="true">tap to peek</span>';
					const clip = document.createElement('div');
					clip.className = 'ta-part-hidden-clip';
					clip.style.height = '0px';
					const body = document.createElement('div');
					body.className = 'ta-part-hidden-body';
					clip.appendChild(body);
					group.appendChild(header);
					group.appendChild(clip);
					part.appendChild(group);
					header.addEventListener('click', function () {
						togglePartHidden(group);
						header.setAttribute('aria-expanded',
							group.classList.contains('ta-part-hidden-open') ? 'true' : 'false');
					});
				}

				const body = group.querySelector('.ta-part-hidden-body');
				renderHiddenGroups(body, offInfo);

				const n = offInfo.length;
				group.querySelector('.tph-label').textContent =
					n + ' of ' + total + ' lessons tucked away — ' + hiddenReasons(offInfo);
				group.querySelector('.tph-count').textContent =
					group.classList.contains('ta-part-hidden-open') ? 'tap to hide' : 'tap to peek';

				// Re-measure if the box was already open so it fits.
				if (group.classList.contains('ta-part-hidden-open')) {
					const clip = group.querySelector('.ta-part-hidden-clip');
					clip.style.height = body.scrollHeight + 'px';
				}
			});

			dlog('home page: hidden tiles grouped into per-part expandable boxes');
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

	function mathSliderHtml() {
		const v = snapMath(getMathLevel());
		return '<div class="math-comfort itx-item" role="group" aria-label="Math comfort level">'
			+ '<div class="math-comfort-top">'
			+   '<span class="math-comfort-label">∑ Math comfort</span>'
			+   '<span class="math-comfort-val" data-math-val>' + mathLevelLabel(v) + '</span>'
			+ '</div>'
			+ '<input type="range" class="math-comfort-range" min="' + MATH_MIN + '" max="' + MATH_MAX
			+ '" step="25" value="' + v + '" aria-label="Math comfort level">'
			+ '<div class="math-comfort-ticks">'
			+   MATH_LEVELS.map(function (l) { return '<span>' + escAttr(l.label) + '</span>'; }).join('')
			+ '</div>'
			+ '</div>';
	}

	function wireMathSlider(h) {
		const range = h.querySelector('.math-comfort-range');
		if (!range) return;
		const val = h.querySelector('[data-math-val]');
		let dragging = false;
		const paint = function () {
			if (val) val.textContent = mathLevelLabel(parseInt(range.value, 10));
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
						const check = activePersonas.indexOf(p.id) !== -1 ? '✔' : '';
						return '<button type="button" class="core-persona itx-item' + sel + '" data-core-persona="' + escAttr(p.id) + '">'
							+ '<span class="core-persona-check" aria-hidden="true">' + check + '</span>'
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
				'<p class="inline-topics-foot">Mix and match — each label unlocks its topics; math comfort is set separately below.</p>'
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
		showLearnedUI();
		ensureBadgeDelegation();
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
		MATH_LEVELS: MATH_LEVELS,
		snapMath: snapMath,
		mathLevelLabel: mathLevelLabel,
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
		LESSON_DEPS: LESSON_DEPS,
		getLessonId: getLessonId,
		isLearned: isLearned,
		depsMet: depsMet,
		toggleLearned: toggleLearned,
		revealAncestorsOf: revealAncestorsOf,
		courseOrder: courseOrder,
		courseIndexOf: courseIndexOf,
		countLearned: countLearned,
		onChange: function (fn) { document.addEventListener('topics:change', fn); },
		// Test/diagnostic hooks (private by convention). Lets the Node
		// integration test — and future tbDebug tooling — drive the tuck /
		// reveal / placement code without a browser. NOT part of the public
		// contract; page code must not depend on it.
		_internals: {
			applyVisibility: applyVisibility,
			showLearnedUI: showLearnedUI,
			settleLearnedButton: settleLearnedButton,
			settleCourseStatusBox: settleCourseStatusBox,
			rebuildGroupBadges: rebuildGroupBadges,
			ensureRecollapse: ensureRecollapse,
			removeRecollapse: removeRecollapse,
			findRecollapse: findRecollapse,
			sectionEndBefore: sectionEndBefore,
			nextTuckedInRun: nextTuckedInRun,
			isTuckTransparent: isTuckTransparent,
			revealGroupBadge: revealGroupBadge,
			placeGroupBadge: placeGroupBadge,
			revealBlock: revealBlock,
			collapseBlock: collapseBlock,
			setBanner: setBanner,
			blockSpec: blockSpec
		}
	};
})();
